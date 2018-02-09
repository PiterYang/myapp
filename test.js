var mysql = require('mysql');
var db = require('config/db');
var pool = mysql.createPool(db.mysql);
pool.query('select * from admin_table', function (err, raws) {
    if(err) {
        throw err;
    }
    console.log('raws', raws);
})