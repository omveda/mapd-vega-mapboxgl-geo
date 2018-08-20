# MapD Vega MapboxGL Geo

MapD Vega MapboxGL Demo - Written by Chris Henrick is a barebones example of using the Vega spec for MapD backend rendering with MapBoxGL.JS.
This repo has vega spec examples that use the Geo data types like point, polygon and line.


## Install

Install using yarn is the preferred method.

```
yarn install
```

## Develop

To start the `webpack-dev-server`:

```
npm start
```

then open your browser to `http://localhost:8080`

## Required Tables
You should load the tables from the these geodata files for the queries to work.

https://s3.amazonaws.com/mapd-data/geodata/citylots.json - save as sf_citylots

https://s3.amazonaws.com/mapd-data/geodata/sffacs_current.zip - save as sf_facility

https://s3.amazonaws.com/mapd-data/geodata/SFMTA-Bikeway-Network.zip - save as sf_bikeway


## Author
Chris Henrick ([@clhenrick](http://github.com/clhenrick))
Veda Shankar ([@omveda](http://github.com/omveda))
