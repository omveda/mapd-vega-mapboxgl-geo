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
      "name": "sf_citylots",
      "format": "polys",
      "shapeColGroup": "mapd",
      "sql": "SELECT sf_citylots.rowid FROM sf_citylots"
    },
    {
      "name": "sewer_lines",
      "format": {
        "type": "lines",
        "coords": {
          "x": ["points"],
          "y": [{"from": "points"}]
        },
        "layout": "interleaved"
      },
      "sql": "SELECT rowid, orig_geom as points FROM utility_lines where type = 'sewer'"
    },
    {
      "name": "comm_lines",
      "format": {
        "type": "lines",
        "coords": {
          "x": ["points"],
          "y": [{"from": "points"}]
        },
        "layout": "interleaved"
      },
      "sql": "SELECT rowid, orig_geom as points FROM utility_lines where type = 'communication'"
    },
    {
      name: "sf_facilities",
sql: sls `select  conv_4326_900913_x(ST_X(A.mapd_geo)) as x, conv_4326_900913_y(ST_Y(A.mapd_geo)) as y, A.rowid from sf_facilities A, utility_lines B WHERE ST_Distance(ST_Transform(A.mapd_geo,900913), ST_Transform(B.orig_geom,900913)) < 20`
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
        fillOpacity: 0.9,
        opacity: 0.9,
        strokeColor: "rgb(0, 0, 0)",
        strokeWidth: 0.5,
        shape: "circle"
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
        fillOpacity: .5,
        opacity: .5,
        "strokeColor": "white",
        "strokeWidth": 0,
        "lineJoin": "miter",
        "miterLimit": 10
      },
      "transform": {
        "projection": "projection"
      }
    },
    {
      "type": "lines",
      "from": {"data": "sewer_lines"},
      "properties": {
        "x": {
          "field": "x"
        },
        "y": {
          "field": "y"
        },
        "strokeColor": "green",
        "strokeWidth": 4,
        "lineJoin": "miter",
        "miterLimit": 10
      },
      "transform": {
        "projection": "projection"
      }
    },
    {
      "type": "lines",
      "from": {"data": "comm_lines"},
      "properties": {
        "x": {
          "field": "x"
        },
        "y": {
          "field": "y"
        },
        "strokeColor": "orange",
        "strokeWidth": 3,
        "lineJoin": "miter",
        "miterLimit": 10
      },
      "transform": {
        "projection": "projection"
      }
    }
  ]
}

);

export default makeVegaSpec
