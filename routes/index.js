var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');
var md = require("node-markdown").Markdown;
var when = require('when');
var nodefn = require('when/node');
var _ = require('lodash');
var ejs = require('ejs');

var config = require('../config');

router.use(function(req, res, next) {
    if (req.path == "/"){
      res.redirect("/en");
    }
    else{
      next();
    }  
});


router.get('/*', function(req, res) {
  var relPath = req.path.substring(1); // remove "/"
  var segs = relPath.split('/');
  var absPath = path.resolve(config.docpath, relPath);
  var layoutPath = path.resolve(config.docpath, "layout.ejs");
  var blockPath = path.resolve(config.docpath, "block.ejs");

  var readFile = nodefn.lift(fs.readFile);

  nodefn.lift(fs.stat)(absPath)
  .then(function(stat){
    if (stat.isFile()){
      return readFile(absPath, {encoding: "utf-8"});
    }
    if (stat.isDirectory()){
      return when.join(nodefn.lift(fs.readdir)(absPath), readFile(blockPath, {encoding: "utf-8"}));
    } 
  })
  .then(function(values){
    var html;
    if (_.isArray(values)){
      html = ejs.render(values[1], {locals: {items:values[0]}});
    }
    else{
      html = md(values);
    }
    res.render(layoutPath, {body: html});   
  })


});


module.exports = router;
