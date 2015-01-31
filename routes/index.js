var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');
var md = require("node-markdown").Markdown;
var when = require('when');
var nodefn = require('when/node');
var _ = require('lodash');
var ejs = require('ejs');
var locale = require("locale");

var config = require('../config');
var supported = new locale.Locales(config.acceptedLocale);


router.use(function(req, res, next) {

  if (req.path == "/"){
    var locales = new locale.Locales(req.headers["accept-language"]);
    res.redirect(locales.best(supported)+"/");
  }
  else{
    var segs = _.trim(req.path, "/").split('/');
    var breadcrumb = [];
    var before = "/";
    for (var i=0;i<segs.length;i++){
      var b = {
        anchor: segs[i],
        href: before + segs[i] + "/"
      };
      before = b.href;
      breadcrumb.push(b);
    }
    res.locals.breadcrumb = breadcrumb;
    next();
  }  
});


router.get('/*', function(req, res) {
  var relPath = req.path.substring(1); // remove "/"
  
  var absPath = path.resolve(config.docpath, relPath);
  var layoutPath = path.resolve(config.docpath, "layout.ejs");
  var blockPath = path.resolve(config.docpath, "block.ejs");

  var readFile = nodefn.lift(fs.readFile);
  var encoding = {encoding: "utf-8"};
  nodefn.lift(fs.stat)(absPath)
  .then(function(stat){
    if (stat.isFile()){
      return readFile(absPath, encoding);
    }
    if (stat.isDirectory()){
      return when.join(nodefn.lift(fs.readdir)(absPath), readFile(blockPath, encoding));
    } 
  })
  .then(function(values){
    var html;

    if (_.isArray(values)){
      var items = [];
      values[0].forEach(function(v){
        var isMD = path.extname(v) == config.mdExt;
        var anchor = isMD ? _.trimRight(v, config.mdExt) : v;
        items.push({
          anchor: anchor,
          href: v+"/",
          isMD: isMD
        })
      })
      html = ejs.render(values[1], {locals: {items:items}});
    }
    else{
      html = path.extname(relPath) == config.mdExt ? md(values) : values;
    }
    res.render(layoutPath, {body: html});   
  }, function(err){
    console.log(err);
    res.status(500).send('err');
  });


});


module.exports = router;
