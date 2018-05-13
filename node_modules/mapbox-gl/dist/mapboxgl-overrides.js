'use strict';
(function (mapboxgl_module) {
    var EXTENT = 8192; // from mapd-mapbox-gl-js/js/data/bucket.js
    var maxInt16 = 32767; // from mapd-mapbox-gl-js/js/source/image_source.js in setCoordinates() method
    var ImageSource = mapboxgl_module.ImageSource;
    // const Painter = mapboxgl_module.Painter;
    var LngLat = mapboxgl_module.LngLat;
    var util = mapboxgl_module.util;
    var Point = mapboxgl_module.Point;
    var TileCoord = mapboxgl_module.TileCoord;
    var RasterBoundsArray = mapboxgl_module.RasterBoundsArray;
    var Buffer = mapboxgl_module.Buffer;
    var VertexArrayObject = mapboxgl_module.VertexArrayObject;

    /**
     * Sets the image's coordinates and re-renders the map.
     *
     * @param {Array<Array<number>>} coordinates Four geographical coordinates,
     *   represented as arrays of longitude and latitude numbers, which define the corners of the image.
     *   The coordinates start at the top left corner of the image and proceed in clockwise order.
     *   They do not have to represent a rectangle.
     * @returns {ImageSource} this
     */
    ImageSource.prototype.setCoordinates = function (coordinates) {
        this.coordinates = coordinates;

        // Calculate which mercator tile is suitable for rendering the video in
        // and create a buffer with the corner coordinates. These coordinates
        // may be outside the tile, because raster tiles aren't clipped when rendering.

        var map = this.map;
        var cornerZ0Coords = coordinates.map(function (coord) {
            return map.transform.locationCoordinate(LngLat.convert(coord)).zoomTo(0);
        });

        var centerCoord = this.centerCoord = util.getCoordinatesCenter(cornerZ0Coords);
        centerCoord.column = Math.floor(centerCoord.column);
        centerCoord.row = Math.floor(centerCoord.row);

        // NOTE: I (croot) found an issue in mapbox 0.28.0 where the zoom
        // in the centerCoord returned from the above getCoordinatesCenter()
        // can be < 0. This eventually fails with an assert
        // in the new TileCoord() call below. So I'm making sure zoom is at
        // least 0 to combat this assert. Another option is to remove the
        // new TileCoord() call below as I'm not exactly sure we need it.
        centerCoord.zoom = Math.max(centerCoord.zoom, 0);

        this.minzoom = this.maxzoom = centerCoord.zoom;
        this.coord = new TileCoord(centerCoord.zoom, centerCoord.column, centerCoord.row);
        this._tileCoords = cornerZ0Coords.map(function (coord) {
            var zoomedCoord = coord.zoomTo(centerCoord.zoom);
            return new Point(Math.round((zoomedCoord.column - centerCoord.column) * EXTENT), Math.round((zoomedCoord.row - centerCoord.row) * EXTENT));
        });

        this.fire('data', { dataType: 'source' });
        return this;
    };

    /**
     * Extension function used to update an existing tile.
     * This function is exactly the same as ImageSource.createTile()
     * except that it updates the image source's bounds buffer
     * rather than creating it.
     * @private
     */
    // ImageSource.prototype.updateTile = function() {
    //     if (!this.tile) {
    //         // create instead
    //         this.setCoordinates(this.coordinates);
    //         return;
    //     }


    //     var map = this.map;
    //     var cornerZ0Coords = this.coordinates.map(function(coord) {
    //       return map.transform.locationCoordinate(LngLat.convert(coord)).zoomTo(0);
    //     });

    //     var centerCoord = this.centerCoord = util.getCoordinatesCenter(cornerZ0Coords);
    //     centerCoord.column = Math.round(centerCoord.column);
    //     centerCoord.row = Math.round(centerCoord.row);

    //     // NOTE: I (croot) found an issue in mapbox 0.21.0 where the zoom
    //     // in the centerCoord returned from the above getCoordinatesCenter()
    //     // can be < 0. This eventually fails with an assert
    //     // in the new TileCoord() call below. So I'm making sure zoom is at
    //     // least 0 to combat this assert. Another option is to remove the
    //     // new TileCoord() call below as I'm not exactly sure we need that.
    //     centerCoord.zoom = Math.max(centerCoord.zoom, 0);

    //     var tileCoords = cornerZ0Coords.map(function(coord) {
    //       var zoomedCoord = coord.zoomTo(centerCoord.zoom);
    //       return new Point(
    //           Math.round((zoomedCoord.column - centerCoord.column) * EXTENT),
    //           Math.round((zoomedCoord.row - centerCoord.row) * EXTENT));
    //     });

    //     this.tile.coord = new TileCoord(centerCoord.zoom, centerCoord.column, centerCoord.row);

    //     const gl = map.painter.gl;
    //     const array = new Int16Array([
    //     tileCoords[0].x, tileCoords[0].y, 0, 0,
    //     tileCoords[1].x, tileCoords[1].y, maxInt16, 0,
    //     tileCoords[3].x, tileCoords[3].y, 0, maxInt16, // eslint-disable-line no-magic-numbers
    //     tileCoords[2].x, tileCoords[2].y, maxInt16, maxInt16
    //     ]);

    //     var type = gl[this.tile.boundsBuffer.type];
    //     gl.bindBuffer(type, this.tile.boundsBuffer.buffer);
    //     gl.bufferSubData(type, 0, array);
    // };

    /**
     * Extension function to update an existing ImageSource overlay with an
     * udpated image. The "options" object argument should look like the following:
     * {
     *     coordinates: <coord object>, // optional, if not included, uses the coordinates from
     *                                  // the previous image. This is the same coordinates
     *                                  // object used in the constructor.
     *     url: <image url> // this is necessary for an update. If not found, function just
     *                      // returns without error and without an update. This is the
     *                      // same object as the options.url in the constructor. In
     *                      // the mapd case, it is a base64 encoded png string.
     * }
     */
    ImageSource.prototype.updateImage = function (options) {
        var _this = this;

        if (!this.image || !options.url) {
            return;
        }

        // NOTE: I was playing with resetting this._loaded,
        // but setting it to false here can cause flickering
        // if a render was done before the updated image
        // is loaded since render() makes sure the image
        // is loaded first. Leaving it here commented
        // out just in case.
        // this._loaded = false;

        var updateCoords = Boolean(options.coordinates);

        util.getImage(options.url, function (err, image) {
            // @TODO handle errors via event.
            if (err) return _this.fire('error', { error: err });

            if (image.width != _this.image.width || image.height != _this.image.height) {
                _this._resized = true;
            } else {
                _this._updated = true;
            }

            _this.image = image;

            if (updateCoords && _this.map) {
                _this.setCoordinates(options.coordinates);
                _this.fire('change');
            }
        });
    };

    ImageSource.prototype._setTile = function (tile) {
        var gl = this.map.painter.gl;
        var tileChanged = true;
        if (this.tile) {
            if (tile !== this.tile) {
                delete this.tile.texture;
                delete this.tile.buckets;
                delete this.tile.boundsBuffer;
                delete this.tile.boundsVAO;
            } else {
                tileChanged = false;
            }
        }

        this.tile = tile;
        var maxInt16 = 32767;
        var array = new RasterBoundsArray();
        array.emplaceBack(this._tileCoords[0].x, this._tileCoords[0].y, 0, 0);
        array.emplaceBack(this._tileCoords[1].x, this._tileCoords[1].y, maxInt16, 0);
        array.emplaceBack(this._tileCoords[3].x, this._tileCoords[3].y, 0, maxInt16);
        array.emplaceBack(this._tileCoords[2].x, this._tileCoords[2].y, maxInt16, maxInt16);

        if (!this.boundsBuffer) {
            this.boundsBuffer = Buffer.fromStructArray(array, Buffer.BufferType.VERTEX);
            this.boundsVAO = new VertexArrayObject();
        } else {
            // reset the tile's boundsBuffer to the new tile coords
            var bufferObj = this.boundsBuffer;
            var data = array.serialize();
            var type = gl[bufferObj.type];

            // NOTE: when in here, the array structure hasn't changed, just the
            // data underneath, so there's no need to recreate the
            // VAO or anything like that.
            gl.bindBuffer(type, bufferObj.buffer);
            gl.bufferSubData(type, 0, data.arrayBuffer);
        }

        this.tile.buckets = {};
        this.tile.boundsBuffer = this.boundsBuffer;
        this.tile.boundsVAO = this.boundsVAO;
    };

    ImageSource.prototype.loadTile = function (tile, callback) {
        // We have a single tile -- whoose coordinates are this.coord -- that
        // covers the image we want to render.  If that's the one being
        // requested, set it up with the image; otherwise, mark the tile as
        // `errored` to indicate that we have no data for it.
        if (this.coord && this.coord.toString() === tile.coord.toString()) {
            this._setTile(tile);
            callback(null);
        } else {
            tile.state = 'errored';
            callback(null);
        }
    };

    /**
     * Overrides function to prepare the image source.
     * Just needed to add logic to handle the case
     * where an image has been updated with new dimensions.
     * Also threw in a couple lines to hopefully subtly
     * improve performance.
     */
    ImageSource.prototype._prepareImage = function (gl, image) {
        if (!this.texture) {
            this.texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        } else if (this._updated) {
            // eslint-disable-line no-underscore-dangle
            // Image was updated but dimensions unchanged.
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, image);
            this._updated = false; // eslint-disable-line no-underscore-dangle;
        } else if (this._resized) {
            // eslint-disable-line no-underscore-dangle
            // Image was updated and dimensions changed.
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            this._resized = false; // eslint-disable-line no-underscore-dangle
        } else if (image instanceof window.HTMLVideoElement) {
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, image);
        }

        if (this.tile.state !== 'loaded') {
            this.tile.state = 'loaded';
            this.tile.texture = this.texture;
        }
    };

    // Painter.prototype.renderPass = function(options) {
    //   var groups = this.style._groups;
    //   var isOpaquePass = options.isOpaquePass;
    //   this.currentLayer = isOpaquePass ? this.style._order.length : -1;

    //   for (var i = 0; i < groups.length; i++) {
    //       var group = groups[isOpaquePass ? groups.length - 1 - i : i];
    //       var source = this.style.sources[group.source];

    //       var j;
    //       var coords = [];
    //       if (source) {
    //           coords = source.getVisibleCoordinates();
    //           for (j = 0; j < coords.length; j++) {
    //               coords[j].posMatrix = this.transform.calculatePosMatrix(coords[j], source.maxzoom);
    //           }
    //           this.clearStencil();
    //           if (source.prepare) source.prepare(isOpaquePass); // this is the only overriding change in this method
    //           if (source.isTileClipped) {
    //               this._renderTileClippingMasks(coords);
    //           }
    //       }

    //       if (isOpaquePass) {
    //           if (!this._showOverdrawInspector) {
    //               this.gl.disable(this.gl.BLEND);
    //           }
    //           this.isOpaquePass = true;
    //       } else {
    //           this.gl.enable(this.gl.BLEND);
    //           this.isOpaquePass = false;
    //           coords.reverse();
    //       }

    //       for (j = 0; j < group.length; j++) {
    //           var layer = group[isOpaquePass ? group.length - 1 - j : j];
    //           this.currentLayer += isOpaquePass ? -1 : 1;
    //           this.renderLayer(this, source, layer, coords);
    //       }

    //       // NOTE: this is part of the original painter.renderPass() method
    //       // but we don't need debug rendering, nor do we currently have
    //       // access to the debug draw function, tho we could expose it if
    //       // we wanted
    //       // if (source) {
    //       //     draw.debug(this, source, coords);
    //       // }
    //   }
    // };
})(mapboxgl);
