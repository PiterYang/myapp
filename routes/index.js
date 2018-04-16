var express = require('express');
var router = express.Router();
var  token = require('../utils/token');

var mysql = require('mysql');
var db = require('../config/db');
var pool = mysql.createPool(db.mysql);
const utils = require('../utils/responseJson');
const crypto = require('crypto');
/* GET home page. */
router.post('/login/login', function(req, res, next) {
    pool.query('select * from admin_table', function (err, raws) {
        if(err) {
            throw err;
        }
        console.log(raws[0])
    })
    const userData = {
        username:req.body.username,
        password:req.body.password
    }
    const myToken = token.createToken(userData, 60*60*24)
    res.json({
        status: 1,
        token: myToken,
        msg: '登录成功！'
    })
});

router.post('/getUserInfo', function (req, res, next) {
    res.send({roles:['admin'],status: 1})
})

module.exports = router;
