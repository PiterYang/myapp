var express = require('express');
var router = express.Router();

var mysql = require('mysql');
var db = require('../config/db');
var pool = mysql.createPool(db.mysql);
const utils = require('../utils/responseJson');
console.log(utils)
/* GET home page. */
router.post('/login/login', function(req, res, next) {
    pool.query('select * from admin_table', function (err, raws) {
        if(err) {
            throw err;
        }
        console.log(raws[0])
        utils.responseJONS(res, raws[0]);
    })
});

router.post('/getUserInfo', function (req, res, next) {
    res.send({roles:['admin']})
})

module.exports = router;
