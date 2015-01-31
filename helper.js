var config = require('./config');
var path = require('path');
var _ = require('lodash');

var helper = {};

helper.isMD = function(v){
  return path.extname(v) == config.mdExt;
}

helper.trimMD = function(v){
  v = this.transform(v);
  return this.isMD(v) ? _.trimRight(v, config.mdExt) : v;
}

helper.transform = function(v){
  return v.replace("_", " ");
}

module.exports = helper;