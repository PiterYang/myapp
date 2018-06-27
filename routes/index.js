var express = require('express');
var router = express.Router();
var  token = require('../utils/token');

var mysql = require('mysql');
var db = require('../config/db');
var pool = mysql.createPool(db.mysql);
const utils = require('../utils/responseJson');
const crypto = require('crypto');
var moment = require('moment')
/* GET home page. */

function MD5(str) {
    let hash = crypto.createHash('md5')
    let hashed = hash.update(str)
    return hashed.digest('base64')
}

router.post('/login/login', function(req, res, next) {

    const userData = {
        username:req.body.username,
        password:req.body.password
    }
    const hashPassword = MD5(userData.password)
    const myToken = token.createToken(userData, 60*60*24)
    req.getConnection(function (err, conn) {
        if(err) {
            return next(err);
        } else {
            conn.query(`SELECT * FROM users WHERE username= '${userData.username}'`, [], function (err,result) {
                if(err) {
                    res.json({
                        status: 0,
                        msg: '数据库查询连接出错'
                    })
                } else if(result.length == 0) {

                    conn.query(`INSERT INTO users (username, password) VALUE ('${userData.username}','${hashPassword}')`, function(err, result) {
                        if(err) {
                            res.json({
                                status: 0,
                                msg: '数据库查询连接出错'
                            })
                        } else {
                            req.session.username = req.body.username
                            res.json({
                                status: 1,
                                token: myToken,
                                msg: '登录成功！'
                            })
                        }
                    })
                } else {
                    var savePass = result[0].password.toString();
                    if(savePass != hashPassword.toString()) {
                        res.json({
                            status: 0,
                            msg: '用户名或者密码错误！'
                        })
                    } else {

                        req.session.username = req.body.username
                        res.json({
                            status: 1,
                            token: myToken,
                            msg: '登录成功！'
                        })
                    }
                }

            })

        }
    })

});

router.post('/getUserInfo', function (req, res, next) {


    res.send({roles:[req.session.username],status: 1})
})

// function dateFormat(date, fmt) {     if (null == date || undefined == date) return '';     var o = {         "M+": date.getMonth() + 1, //月份         "d+": date.getDate(), //日         "h+": date.getHours(), //小时         "m+": date.getMinutes(), //分         "s+": date.getSeconds(), //秒         "S": date.getMilliseconds() //毫秒     };     if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));     for (var k in o)         if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));     return fmt; } Date.prototype.toJSON = function () { return dateFormat(this,'yyyy-MM-dd hh:mm:ss')}
router.post('/role/getRoleList', function (req, res, next) {
    const pagesize = req.body.pagesize || 10;
    const page = req.body.page || 1;
    const point = (page - 1) * 10;
    const user = req.body.user;
    const address = req.body.address;
    let sql = `SELECT * FROM users WHERE id <= 
                (SELECT id FROM users ORDER BY id desc LIMIT ${point}, 1) ORDER BY id desc LIMIT ${pagesize}`
    let numSql = `SELECT count(*) AS total FROM users`
    if(user && address) {
        sql = `SELECT * FROM users WHERE id <= 
                (SELECT id FROM users ORDER BY id desc LIMIT ${point}, 1) AND username = '${user}' AND address = '${address}' ORDER BY id desc LIMIT ${pagesize}`
        numSql = `SELECT count(*) AS total FROM users WHERE username='${user}' AND address='${address}'`
    } else{
        if(user) {
            sql = `SELECT * FROM users WHERE id <= 
                (SELECT id FROM users ORDER BY id desc LIMIT ${point}, 1) AND username = '${user}'  ORDER BY id desc LIMIT ${pagesize}`
            numSql = `SELECT count(*) AS total FROM users WHERE username = '${user}'`
        }
        if(address){
          sql = `SELECT * FROM users WHERE id <= 
                (SELECT id FROM users ORDER BY id desc LIMIT ${point}, 1) AND address = '${address}'  ORDER BY id desc LIMIT ${pagesize}`
          numSql = `SELECT count(*) AS total FROM users WHERE address = '${address}'`
        }
    }
    req.getConnection(function (err, conn) {
        if(err) {
            next(err)
        } else {
            let resultPromise = new Promise((resolve,reject) => {
              conn.query(sql,function (err,result) {
                if(err) {
                  reject(err)
                } else {
                  for(var i = 0; i < result.length; i ++) {
                    result[i].updatetime = moment(result[i].updatetime).format('YYYY-MM-DD HH:mm:ss')
                    result[i].createdate = moment(result[i].createdate).format('YYYY-MM-DD HH:mm:ss')
                  }
                  resolve(result)
                }

              })
            })
            let totalPromise = new Promise((resolve, reject) => {
              conn.query(numSql, function (err,total) {
                if(err) {
                    reject(err)
                } else {
                    resolve(total)
                }
              })
            })
            Promise.all([resultPromise, totalPromise]).then(function (results) {
              res.json({
                status: 1,
                total: results[1][0].total,
                tableData:results[0],
                rowNum: pagesize
              })
            }).catch(function (err) {
              res.json({
                status: 0,
                msg: '连接数据库或查询失败'
              })
              throw err
            })
            /*new Promise(resolve => {
              conn.query(sql,function (err,result) {
                  console.log('结果',result)
                  for(var i = 0; i < result.length; i ++) {
                    result[i].updatetime = moment(result[i].updatetime).format('YYYY-MM-DD HH:mm:ss')
                    result[i].createdate = moment(result[i].createdate).format('YYYY-MM-DD HH:mm:ss')
                  }
                  resolve(result)
              })
            })
              .then(function (result) {
                console.log(22222222222222)
                console.log('传到第二个结果',result)
                return conn.query(numSql, function (err,total) {
                  console.log('mytotal',total)
                  res.json({
                    status: 1,
                    total: total[0].total,
                    tableData:result,
                    rowNum: pagesize
                  })
                })
              })
              .then(function (result) {

              })
              .catch(err => {
                  res.json({
                      status: 0,
                      msg: '连接数据库或查询失败'
                  })
                  throw(err)
              })*/
            /*conn.query(sql,function (err,result) {
                if(err) {
                    console.log(err)
                    res.json({
                        status: 0,
                        msg: '连接数据库或查询失败'
                    })
                } else {

                    console.log('结果',result)
                    for(var i = 0; i < result.length; i ++) {
                        result[i].updatetime = moment(result[i].updatetime).format('YYYY-MM-DD HH:mm:ss')
                        result[i].createdate = moment(result[i].createdate).format('YYYY-MM-DD HH:mm:ss')
                    }
                   conn.query(numSql, function (err,total) {
                       console.log('mytotal',total)
                       res.json({
                           status: 1,
                           total: total[0].total,
                           tableData:result,
                           rowNum: pagesize
                       })
                   })

                }
            })*/
        }

    })
    /*res.json({
        status: 1,
        total: 4,
        tableData:[{
            date: '2016-05-03',
            name: '王小虎',
            province: '上海',
            city: '普陀区',
            address: '上海市普陀区金沙江路 1518 弄',
            zip: 200333
        }, {
            date: '2016-05-02',
            name: '王小虎',
            province: '上海',
            city: '普陀区',
            address: '上海市普陀区金沙江路 1518 弄',
            zip: 200333
        }, {
            date: '2016-05-04',
            name: '王小虎',
            province: '上海',
            city: '普陀区',
            address: '上海市普陀区金沙江路 1518 弄',
            zip: 200333
        }, {
            date: '2016-05-01',
            name: '王小虎',
            province: '上海',
            city: '普陀区',
            address: '上海市普陀区金沙江路 1518 弄',
            zip: 200333
        }]
    })*/
})

router.post('/role/roleEdit',function(req, res, next){
  let id = [req.body.id];
  let sql = `SELECT username FROM users WHERE id = ?`
  req.getConnection(function(err, conn){
    if(err) {
      next(err)
    } else{
      conn.query(sql, id, function (err,result) {
        if(err) {
          next(err)
        } else {
          console.log(result[0])
          if(result.length == 0 || result[0].username == req.body.username) {
            next()
          } else{
            res.json({
              status: 0,
              msg: '用户名已存在！'
            })
          }
        }

      })
    }
  })
},function (req, res, next) {
  const updateData = req.body
  let updatetime = moment(updateData.updatetime).format('YYYY-MM-DD HH:mm:ss')
  console.log(updateData)
  let sql = `UPDATE users SET 
             username='${updateData.username}',
             address='${updateData.address}',
             province='${updateData.province}',
             city='${updateData.city}',
             zip='${updateData.zip}',
             updatetime='${updatetime}',
             roles='${updateData.roles}' 
             WHERE id=${updateData.id}`
  req.getConnection(function (err, conn) {
    if(err) {
      next(err)
    } else {
      conn.query(sql, function (err, result) {
        if(err) {
          next(err)
        } else {
          console.log(result)
          res.json({
            status: 1,
            data: result
          })
        }
      })
    }
  })

})

router.post('/role/roleAdd',function(req, res, next){
  let username = [req.body.username];
  let sql = `SELECT username FROM users WHERE username = ?`
  req.getConnection(function(err, conn){
    if(err) {
      next(err)
    } else{
      conn.query(sql,username, function (err,result) {
        if(err) {
          next(err)
        } else {
          if(result.length == 0) {
            next()
          } else{
            res.json({
              status: 0,
              msg: '用户名已存在！'
            })
          }
        }

      })
    }
  })
},function (req, res, next) {
  const addData = req.body
  let addTime = moment(addData.updatetime).format('YYYY-MM-DD HH:mm:ss')
  console.log(addData)
  let hashPassword = MD5(addData.password)

  let dataArr = [addData.username,addData.address,addData.city,addData.roles,addData.province,addTime,addTime,addData.zip,hashPassword]
  let sql =  `INSERT INTO users
              (
                username,
                address,
                city,
                roles,
                province,
                createdate,
                updatetime,
                zip,
                password
              )
              VALUES(?,?,?,?,?,?,?,?,?)`

  req.getConnection(function (err, conn) {
    if(err) {
      next(err)
    } else {
      conn.query(sql,dataArr, function (err, result) {
        if(err) {
          next(err)
          res.json({
            status: 0,
            msg: '数据库查询或连接失败'
          })
        } else {
          res.json({
            status: 1,
            msg: '添加成功'
          })
        }
      })
    }
  })
})

module.exports = router;
