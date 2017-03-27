
var express = require('express');
var logger = require('morgan');



var routes = require('./modules/api/routes/index');


var app = express();

// view engine setup


app.use(logger('dev'));


app.use('/', routes);

module.exports = app;
