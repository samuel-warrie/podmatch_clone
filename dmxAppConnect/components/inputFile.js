dmx.Component('input-file', {

    extends: 'form-element',

    attributes: {
        imageMaxWidth: {
            type: Number,
            default: null,
        },

        imageMaxHeight: {
            type: Number,
            default: null,
        },

        imageType: {
            type: String,
            default: null, // defaults to original image format
            enum: ['png', 'jpeg', 'webp'],
        },

        imageQuality: {
            type: Number,
            default: null,
        },
    },

    initialData: {
        file: null,
    },

    _imageTypes: {
        png: 'image/png',
        jpeg: 'image/jpeg',
        webp: 'image/webp',
        'image/png': 'image/png',
        'image/jpeg': 'image/jpeg',
        'image/webp': 'image/webp',
    },

    _imageExtensions: {
        'image/png': 'png',
        'image/jpeg': 'jpg',
        'image/webp': 'webp',
    },

    _setValue(value) {
        console.warn('Can not set value of a file input!');
    },

    _changeHandler(event) {
        dmx.Component('form-element').prototype._changeHandler.call(this, event);

        this._updateData();

        if (this.$node.files.length && (this.props.imageMaxWidth || this.props.imageMaxHeight || this.props.imageType)) {
            this._resizeImage();
        }
    },

    _resizeImage() {
        const file = this.$node.files[0];

        if (file && file.type.startsWith('image/')) {
            const blobUrl = URL.createObjectURL(file);
            const img = new Image();
            img.src = blobUrl;
            img.onerror = () => URL.revokeObjectURL(blobUrl);
            img.onload = () => {
                URL.revokeObjectURL(blobUrl);

                const {
                    imageMaxWidth,
                    imageMaxHeight,
                    imageType,
                    imageQuality
                } = this.props;

                let width = img.width;
                let height = img.height;
                let ratio = width / height;
                let needResize = false;

                if (imageMaxWidth && width > imageMaxWidth) {
                    width = imageMaxWidth;
                    height = ~~(width / ratio);
                    needResize = true;
                }

                if (imageMaxHeight && height > imageMaxHeight) {
                    height = imageMaxHeight;
                    width = ~~(height * ratio);
                    needResize = true;
                }

                const newType = imageType ? this._imageTypes[imageType] : file.type;

                if (newType !== file.type || needResize) {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    canvas.width = width;
                    canvas.height = height;

                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob(blob => {
                        if (blob == null) {
                            return console.error('Could not resize image!');
                        }
                        const container = new DataTransfer();
                        const newName = file.name.replace(/\.\w+$/, '.' + this._imageExtensions[blob.type]);
                        const newFile = new File([blob], newName, {
                            type: blob.type
                        });
                        container.items.add(newFile);
                        this.$node.files = container.files;
                        this._updateData();
                    }, newType, imageQuality ? imageQuality / 100 : undefined);
                }
            };
        }
    },

    _updateData() {
        let data = null;

        if (this.$node.files.length) {
            const self = this;
            const file = this.$node.files[0];

            data = {
                date: (file.lastModified ? new Date(file.lastModified) : file.lastModifiedDate).toISOString(),
                name: file.name,
                size: file.size,
                type: file.type,
                get dataUrl() {
                    if (!file._dataUrl) {
                        dmx.fileUtils.blobToDataURL(file).then(dataUrl => {
                            file._dataUrl = dataUrl;
                            self.set('file', Object.assign({}, data, {
                                dataUrl
                            }));
                        }).catch(error => {
                            console.error(error);
                        });
                    }

                    return null;
                },
            };
        }

        this.set('file', data);
    }

});