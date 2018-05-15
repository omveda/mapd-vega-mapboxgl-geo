import {debounce} from "./utils"
import updateVega from "./updateVega"

// set the access token for MapboxGLJS
var accessToken = 'pk.eyJ1IjoiZW5qYWxvdCIsImEiOiIzOTJmMjBiZmI2NGQ2ZjAzODhiMzhiOGI2MTI1YTk4YSJ9.sIOXXU3TPp5dLg_L3cUxhQ';
mapboxgl.accessToken = accessToken;

let map = null

export const initMap = () => {
  // create a div element for mapboxgl to hook into
  var div = document.createElement("div");
  div.id = "map"
  document.querySelector("body").append(div)

  // instantiate the map object
  map = new mapboxgl.Map({
    container: "map",
    // style: 'mapbox://styles/mapbox/light-v9',
    style: 'mapbox://styles/mapbox/streets-v9',
    //style: 'mapbox://styles/mapbox/streets-satellite', // not working
    // center: [-97.5,39.8],
    center: [-122.399001, 37.791968],
    zoom: 7,
    minZoom: 2,
    maxZoom: 16,
    hash: true,
    //maxBounds: [[-129, 22], [-66, 54]]
    // maxBounds: [[-124, 35], [-120, 39]]
    maxBounds: [[-122.511842, 37.741625], [-122.396357, 37.810652]]
  });

  // add map navigation controls
  map.addControl(new mapboxgl.NavigationControl());

  function update() {
    updateVega(map)
  }

  map.on('move', debounce(update, 100))

  return map
}

export const getMap = () => map

export const setMap = createdMap => {
  if (map) map.remove()
  map = createdMap
}

export const resizeMap = () => {
  if (map) {
    map.resize()
  }
}

export const clearMap = () => {
  if (map) map.remove()
  map = null
}

export const setBounds = bounds => {
  map.fitBounds([bounds._sw, bounds._ne],
    {
      linear: true
    }
  )
}

export const getBounds = () => map.getBounds()

export const updateMap = (vegaImage) => {
  const mapBounds = map.getBounds()
  const imageBounds = [
      [mapBounds.getNorthWest().lng, mapBounds.getNorthWest().lat],
      [mapBounds.getNorthEast().lng, mapBounds.getNorthEast().lat],
      [mapBounds.getSouthEast().lng, mapBounds.getSouthEast().lat],
      [mapBounds.getSouthWest().lng, mapBounds.getSouthWest().lat]
    ];

  if (typeof map.getLayer('overlay') === 'undefined') {
    var toBeAddedOverlay = 'overlay';
    map.addSource(toBeAddedOverlay, {
      type: 'image',
      url: vegaImage,
      coordinates: imageBounds
    });
    map.addLayer({
      id: toBeAddedOverlay,
      source: toBeAddedOverlay,
      type: 'raster',
      paint: {'raster-opacity': 0.85, 'raster-fade-duration': 0}
    });
  }
  else {
    var overlayName = 'overlay';
    var imageSrc = map.getSource(overlayName);
    imageSrc.updateImage({
      url: vegaImage,
      coordinates: imageBounds
    });
  }
}
