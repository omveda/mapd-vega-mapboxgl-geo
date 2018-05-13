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
      name: "vedatest1",
      sql: sls`SELECT 
        conv_4326_900913_x(ST_X(mapd_geo)) as x,
        conv_4326_900913_y(ST_Y(mapd_geo)) as y,
        rowid
        FROM vedatest1 LIMIT 20000`
    },
    {
      "name": "polys",
      "format": "polys",
      "shapeColGroup": "mapd",
      "sql": "SELECT vedalots3.rowid FROM vedalots3"
    },
    {
      "name": "lines",
      "format": {
        "type": "lines",
        "coords": {
          "x": ["points"],
          "y": [{"from": "points"}]
        },
        "layout": "interleaved"
      },
      "sql": "SELECT rowid, orig_geom as points FROM veda_sql_test3"
    }
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
      from: { data: "vedatest1" },
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
        "data": "polys"
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
      "from": {"data": "lines"},
      "properties": {
        "x": {
          "field": "x"
        },
        "y": {
          "field": "y"
        },
        "strokeColor": "green",
        "strokeWidth": 5,
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
