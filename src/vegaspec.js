// Multi-layer with POINT, LINESTRING and POLYGONS
//
import sls from "single-line-string"

const makeVegaSpec = ({
  width,
  height,
  minXBounds,
  minYBounds,
  maxYBounds,
  maxXBounds,
  minLon,
  maxLon,
  minLat,
  maxLat
}) => (
{
  width,
  height,
  data: [
    {
      // Render the SF lots (POLYGON) which have a city facility located on them.
      "name": "sf_citylots",
      "format": "polys",
      "shapeColGroup": "mapd",
      "sql": "SELECT A.rowid from sf_facility B, sf_citylots A where ST_Contains(A.mapd_geo, B.mapd_geo)"
    },
    {
      // Render all the bike lanes in SF (LINESTRING).
      "name": "bikeways",
      "format": {
        "type": "lines",
        "coords": {
          "x": ["points"],
          "y": [{"from": "points"}]
        },
        "layout": "interleaved"
      },
      "sql": "SELECT rowid, mapd_geo as points FROM sf_bikeway"
    },
    {
      // Render all the SF facilities (POINT) that are within 50 meters from the bike lanes.
      "name": "sf_facilities",
      "sql": "select conv_4326_900913_x(ST_X(A.mapd_geo)) as x, conv_4326_900913_y(ST_Y(A.mapd_geo)) as y, A.rowid from sf_facility A, sf_bikeway B where ST_Distance(ST_Transform(B.mapd_geo, 900913), ST_Transform(A.mapd_geo, 900913)) < 50"
    },
  ],
  "projections": [
    {
      "name": "projection",
      "type": "mercator",
      "bounds": {
        "x": [minLon, maxLon],
        "y": [minLat, maxLat]
      }
    }
  ],
  scales: [
    {
      name: "x",
      type: "linear",
      domain: [minXBounds, maxXBounds],
      range: "width"
    },
    {
      name: "y",
      type: "linear",
      domain: [minYBounds, maxYBounds],
      range: "height"
    },
    {
      "name": "line_color",
      "type": "ordinal",
      "domain": ["A", "B", "C"],
      "range": ["#22a7f0","#76c68f", "#c9e52f"]
    }
  ],
  marks: [
    {
      type: "symbol",
      from: { data: "sf_facilities" },
      properties: {
        width: 5,
        height: 5,
        x: { scale: "x", field: "x" },
        y: { scale: "y", field: "y" },
        fillColor: "blue",
        fillOpacity: 1.0,
        opacity: 1.0,
        strokeColor: "rgb(0, 0, 0)",
        strokeWidth: 2.5,
        shape: "square"
      }
    },
    {
      "type": "polys",
      "from": {
        "data": "sf_citylots"
      },
      "properties": {
        "x": {
          "field": "x"
        },
        "y": {
          "field": "y"
        },
        "fillColor": {
          "value": "red"
        },
        "fillOpacity": .9,
        "opacity": .7,
        "strokeColor": "blue",
        "strokeWidth": 2,
        "lineJoin": "miter",
        "miterLimit": 10
      },
      "transform": {
        "projection": "projection"
      }
    },
    {
      "type": "lines",
      "from": {"data": "bikeways"},
      "properties": {
        "x": {
          "field": "x"
        },
        "y": {
          "field": "y"
        },
        "strokeColor": "green",
        "strokeWidth": 2,
        "lineJoin": "miter",
        "miterLimit": 10
      },
      "transform": {
        "projection": "projection"
      }
    },
  ]
}

);

export default makeVegaSpec
