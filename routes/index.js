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

var helper = require('../helper');
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
        anchor: helper.trimMD(segs[i]),
        href: before + segs[i] + "/",
        isCurrent: (i==segs.length-1)
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
  var indexPath = path.join(absPath, "index.ejs");
  var readFile = nodefn.lift(fs.readFile);
  var encoding = {encoding: "utf-8"};

  fs.exists(indexPath, function(exists){
    if (exists){
      fs.readFile(indexPath, encoding, function(err, html){
        res.render(layoutPath, {body: html});
      });
    }
    else{
      nodefn.lift(fs.stat)(absPath)
        .then(function(stat){
          if (stat.isFile()){
            return readFile(absPath, encoding);
          }
          if (stat.isDirectory()){
            return when.join(nodefn.lift(fs.readdir)(absPath), readFile(blockPath, encoding));
          } 
        })
        .done(function(values){
          var html;

          if (_.isArray(values)){
            var items = [];
            values[0].forEach(function(v){
              items.push({
                anchor: helper.trimMD(v),
                href: v+"/",
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
          res.status(500).send(err);
        });
    }
  });
});


module.exports = router;
