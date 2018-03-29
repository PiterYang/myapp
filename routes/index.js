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
    const userData = {
        username:req.body.username,
        password:req.body.password
    }
    const myToken = token.createToken(userData, 60)
    res.json({
        status: 1,
        token: myToken,
        msg: '登录成功！'
    })
});

router.post('/getUserInfo', function (req, res, next) {
    if(req.method != 'OPTIONS') {
        var mytoken = req.headers['x-token']
        console.log('token',mytoken)
        console.log(token.checkToken(mytoken))
    }
    res.send({roles:['admin']})
})

module.exports = router;
