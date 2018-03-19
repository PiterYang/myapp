var express = require('express');
var router = express.Router();

var mysql = require('mysql');
var db = require('../config/db');
var pool = mysql.createPool(db.mysql);
const utils = '../utils/responseJson';

/* GET home page. */
router.post('/login/login', function(req, res, next) {
    pool.query('select * from admin_table', function (err, raws) {
        if(err) {
            throw err;
        }
        utils.responseJONS(res, raws);
    })
});

module.exports = router;
