dmx.Component('input-file-multiple', {

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
        files: [],
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
            this._resizeImages();
        }
    },

    _resizeImages() {
        const files = Array.from(this.$node.files);

        Promise.all(files.map(file => {
            return new Promise(resolve => {
                if (!file.type.startsWith('image/')) {
                    resolve(file);
                    return;
                }

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
                            const newName = file.name.replace(/\.\w+$/, '.' + this._imageExtensions[blob.type]);
                            const newFile = new File([blob], newName, {
                                type: blob.type
                            });
                            resolve(newFile);
                        }, newType, imageQuality ? imageQuality / 100 : undefined);
                    } else {
                        resolve(file);
                    }
                };
            });
        })).then(files => {
            const container = new DataTransfer();
            for (let file of files) {
                container.items.add(file);
            }
            this.$node.files = container.files;
            this._updateData();
        });
    },

    _updateData() {
        let files = [];

        if (this.$node.files.length) {
            const self = this;

            files = Array.from(this.$node.files).map((file, index) => {
                const data = {
                    date: (file.lastModified ? new Date(file.lastModified) : file.lastModifiedDate).toISOString(),
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    get dataUrl() {
                        if (!file._dataUrl) {
                            loading = true;
                            dmx.fileUtils.blobToDataURL(file).then(dataUrl => {
                                file._dataUrl = dataUrl;
                                files = dmx.clone(files);
                                files[index].dataUrl = dataUrl;
                                self.set('files', files);
                            }).catch(error => {
                                console.error(error);
                            });
                        }

                        return null;
                    },
                };

                return data;
            });
        }

        this.set('files', files);
    },

});