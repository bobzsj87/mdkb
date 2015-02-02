var express = require('express');
var router = express.Router();
var filewalker = require('filewalker');
var path = require('path');
var config = require('../config');


router.get('/:lang/all.json', function(req, res){
  var absPath = path.resolve(config.docpath, req.params.lang);
  var options = {
    maxPending: 10, // throttle handles 
  };
  var ret = [];

  filewalker(absPath, options)
    .on('stream', function(rs, p, s, fullPath) { 
      rs.on('data', function(data) {
        if (config.excludes.indexOf(path.basename(p)) == -1){
          ret.push({
            path: '/'+req.params.lang+'/'+p,
            title: path.basename(p),
            body: data.toString()
          });
        }
      });
    })
    .on('error', function(err) {
      console.error(err);
    })
    .on('done', function() {
      res.send(ret);
    })
  .walk();
});


module.exports = router;
