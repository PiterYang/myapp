var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var parseurl = require('parseurl');
var RedisStore = require('connect-redis')(session)
var redis = require('redis');
var index = require('./routes/index');
var myConnection = require('express-myconnection');
var users = require('./routes/users');
var mysql = require('mysql')
var db = require('./config/db');
var app = express();
app.use("*", function (req, res, next) { //跨域的解决方法
    res.header('Access-Control-Allow-Origin', '*');
    res.header("Access-Control-Allow-Headers", "Content-Type,Content-Length, Authorization, Accept,X-Requested-With,T-Token");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    if (req.method === 'OPTIONS') {
        res.sendStatus(200)
    } else {
        next()
    }
});

// view engine setup
var ejs = require('ejs');
app.set('views', path.join(__dirname, 'views'));
app.engine('.html', ejs.__express)
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

const client = redis.createClient({
    host: '127.0.0.1',
    port: "6379"
});

console.log('redis ready!')

client.on("error", function (err) {

    console.log("Error " + err);

});
app.use(session({
    store: new RedisStore({
        host: '127.0.0.1',
        port: 6379,
    }),
    resave: false,  //重新保存
    saveUninitialized: true, //
    secret: 'express admin',//通过设置的 secret 字符串，来计算 hash 值并放在 cookie 中，使产生的 signedCookie 防篡改。
    cookie:{ maxAge: 1000*60*60*24}//失效时间

}));
console.log('db info',db)
app.use(myConnection(mysql, db.mysql, 'single')); //作为中间件来使用

app.use("*", function (req, res, next) {
    var token = require('./utils/token');
    var mytoken = ''
    if(req.method != 'OPTIONS') {
        mytoken = req.headers['t-token']
    }
    var pathname = req.originalUrl;
    //判断是否登录入
    if(!mytoken){
        //未登录清空token输出给模板值
        token = req.session.token = null;
        res.locals.user=null;
        app.locals.user=null;
        //除了login的路径其他都要登录后才能进入
        if(/^\/login\/login/g.test(pathname)){
            //跳出
            next()
        }else{
            res.json({status: 2, msg: '登录超时，请重新登录'});
        }
    }else if(mytoken){
        //已登录
        //输出值到模板，res.locals，不前页面输出，app.locals是模板全局出输
        // res.locals.user=JSON.parse(token);
        // app.locals.user=JSON.parse(token);
        if(token.checkToken(mytoken)) { //如果token正确则返回数据
            next();
        } else {
            res.json({status: 2, msg: '登录超时，请重新登录'}) //token不正确 返回登陆超时
        }

    }
})
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function logError(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  console.log(err.stack)
  res.render('error');
});

module.exports = app;
