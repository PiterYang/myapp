var express = require('express');
var router = express.Router();

var mysql = require('mysql');
var db = require('../config/db');
var pool = mysql.createPool(db.mysql);


/* GET home page. */
router.get('/', function(req, res, next) {
    pool.query('select * from admin_table', function (err, raws) {
        if(err) {
            throw err;
        }
        console.log('raws',raws)
    })
    res.render('test.html',{title: 'express'});
});

module.exports = router;
