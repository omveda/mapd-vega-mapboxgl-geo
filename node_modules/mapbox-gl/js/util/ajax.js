'use strict';

const window = require('./window');

exports.getJSON = function(url, callback) {
    const xhr = new window.XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.onerror = function(e) {
        callback(e);
    };
    xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300 && xhr.response) {
            let data;
            try {
                data = JSON.parse(xhr.response);
            } catch (err) {
                return callback(err);
            }
            callback(null, data);
        } else {
            callback(new Error(xhr.statusText));
        }
    };
    xhr.send();
    return xhr;
};

function base64ToArrayBuffer (base64) { // from SO: http://bit.ly/2fGowUT
    var binaryString =  window.atob(base64);
    var len = binaryString.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

exports.getArrayBuffer = function(url, callback) {
    if (url.slice(0, 22) === "data:image/png;base64,") {
        return callback(null, base64ToArrayBuffer(url.slice(22)));
    } else {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onerror = function(e) {
            callback(e);
        };
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300 && xhr.response) {
                callback(null, xhr.response);
            } else {
                callback(new Error(xhr.statusText));
            }
        };
        xhr.send();
        return xhr;
    }
};

function sameOrigin(url) {
    const a = window.document.createElement('a');
    a.href = url;
    return a.protocol === window.document.location.protocol && a.host === window.document.location.host;
}

const transparentPngUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQYV2NgAAIAAAUAAarVyFEAAAAASUVORK5CYII=';

exports.getImage = function(url, callback) {
    return exports.getArrayBuffer(url, (err, imgData) => {
        if (err) return callback(err);
        const img = new window.Image();
        img.onload = () => {
            callback(null, img);
            (window.URL || window.webkitURL).revokeObjectURL(img.src);
        }

        var blob = new Blob([new Uint8Array(imgData)], { type: 'image/png' });
        img.src = (window.URL || window.webkitURL).createObjectURL(blob);
        img.getData = () => {
            var canvas = document.createElement('canvas');
            var context = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            context.drawImage(img, 0, 0);
            return context.getImageData(0, 0, img.width, img.height).data;
        };
        return img
    });
};

exports.getVideo = function(urls, callback) {
    const video = window.document.createElement('video');
    video.onloadstart = function() {
        callback(null, video);
    };
    for (let i = 0; i < urls.length; i++) {
        const s = window.document.createElement('source');
        if (!sameOrigin(urls[i])) {
            video.crossOrigin = 'Anonymous';
        }
        s.src = urls[i];
        video.appendChild(s);
    }
    return video;
};
