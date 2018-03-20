var express = require('express');
var router = express.Router();

/* GET users listing. */
router.post('/login/login', function(req, res, next) {
    pool.query('select * from admin_table', function (err, raws) {
        if(err) {
            throw err;
        }
        console.log(raws[0])
        utils.responseJONS(res, raws[0]);
    })
});

router.post('/', function(req, res, next) {
    res.send({'text':2})
});

module.exports = router;
