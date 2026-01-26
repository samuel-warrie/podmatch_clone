dmx.fileUtils = {

    fileReader(file, readAs) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader[readAs](file);
        });
    },

    blobToArrayBuffer: function(blob) {
        return dmx.fileUtils.fileReader(blob, 'readAsArrayBuffer');
    },

    blobToBinaryString: function(blob) {
        return dmx.fileUtils.fileReader(blob, 'readAsBinaryString');
    },

    blobToDataURL: function(blob) {
        return dmx.fileUtils.fileReader(blob, 'readAsDataURL');
    },

    blobToBase64String: function(blob) {
        return dmx.fileUtils.fileReader(blob, 'readAsDataURL').then(dataURL =>
            dataURL.substring(dataURL.indexOf(',') + 1)
        );
    },

    arrayBufferToBlob: function(arrayBuffer, type) {
        return Promise.resolve(new Blob([arrayBuffer], {
            type
        }));
    },

    binaryStringToBlob: function(binary, type) {
        const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
        return Promise.resolve(new Blob([bytes], {
            type
        }));
    },

    dataURLToBlob: function(dataURL) {
        const {
            data,
            type
        } = dmx.fileUtils.parseDataURL(dataURL);
        return dmx.fileUtils.base64StringToBlob(data, type);
    },

    base64StringToBlob: function(base64String, type) {
        const binary = window.atob(base64String);
        return dmx.fileUtils.binaryStringToBlob(binary, type);
    },

    parseDataURL: function(dataURL) {
        const match = dataURL.match(/^data:(.*?)(;base64)?,(.*)$/);
        return {
            mediaType: match[1],
            base64: !!match[2],
            data: match[3],
            type: match[1].split(';')[0],
        };
    },

    parseMediaType: function(mediaType) {
        const match = mediaType.match(/^([^/]+)\/([^+;]+)(?:\+([^;]+))?(?:;(.*))?$/);
        return {
            type: match[1],
            subtype: match[2],
            suffix: match[3],
            parameters: match[4] ? match[4].split(';').reduce((obj, param) => {
                const [key, value] = param.split('=');
                obj[key] = value;
                return obj;
            }, {}) : {},
        };
    },

};