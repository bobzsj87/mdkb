var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');
var when = require('when');
var nodefn = require('when/node');
var _ = require('lodash');
var ejs = require('ejs');
var locale = require("locale");
var marked = require('marked');

var helper = require('../helper');
var config = require('../config');
var supported = new locale.Locales(config.acceptedLocale);


router.use(function(req, res, next) {

  if (req.path == "/"){
    var locales = new locale.Locales(req.headers["accept-language"]);
    res.redirect(locales.best(supported)+"/");
  }
  else{
    if (!_.endsWith(req.path, "/")){
      res.redirect(req.path + "/")
    }
    else{
      var segs = _.trim(req.path, "/").split('/');
      res.locals.lang = segs[0];
      var breadcrumb = [];
      var before = "/";
      for (var i=0;i<segs.length;i++){
        var b = {
          anchor: i==0?"Help Center":helper.trimMD(decodeURI(segs[i])),
          href: before + segs[i] + "/",
          isCurrent: (i==segs.length-1)
        };
        before = b.href;
        breadcrumb.push(b);
      }
      res.locals.breadcrumb = breadcrumb;
      next();     
    }
  }  
});

router.get('*', function(req, res, next) {
  var relPath = decodeURI(req.path.substring(1)); // remove "/"
  var absPath = path.resolve(config.docpath, relPath);
  var layoutPath = path.resolve(config.docpath, "layout.ejs");
  var blockPath = path.resolve(config.docpath, "block.ejs");
  var indexPath = path.join(absPath, "index.ejs");
  var readFile = function(path){return nodefn.lift(fs.readFile)(path, {encoding: "utf-8"})};

  fs.exists(indexPath, function(exists){
    if (exists){
      readFile(indexPath).then(function(html){
        res.render(layoutPath, {body: html});
      });
    }
    else{
      nodefn.lift(fs.stat)(absPath)
        .then(function(stat){
          if (stat.isFile()){
            return readFile(absPath);
          }
          if (stat.isDirectory()){
            return when.join(nodefn.lift(fs.readdir)(absPath), readFile(blockPath));
          } 
        })
        .then(function(values){
          return when.promise(function(resolve, reject){
            if (_.isArray(values)){
              var items = [];
              var files = _.difference(values[0], config.excludes);
              files.sort().forEach(function(v){
                items.push({
                  anchor: helper.trimMD(v),
                  href: encodeURI(v)+"/",
                  isMD: helper.isMD(v)
                })
              })
              html = ejs.render(values[1], {locals: {items:items}});
              resolve(html);
            }
            else{
              if (path.extname(relPath) == config.mdExt){
                marked(values, function (err, content) {
                  if (err) reject(err);
                  else resolve(content);
                });
              }
              else{
                resolve(values);
              }
            }
          });
        })
        .done(function(html){
          res.render(layoutPath, {body: html}); 
        }, function(err){
          next(err);
        });
    }
  });
});


module.exports = router;
