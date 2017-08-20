var express = require('express');
var router = express.Router();

/*
* POST Card information to get a Token
* */
router.post('/token', function(req, res, next){

    var base64 = require('base-64');
    var utf8 = require('utf8');
    var sha1 = require('sha1');

    var card_number = req.body.card_number;
    var expiration_date = req.body.expiration_date;
    var cvc = req.body.cvc;

    var to_token = card_number + '|' + expiration_date + '|' + cvc;

    var bytes = utf8.encode(to_token);
    var encoded_data = base64.encode(bytes);
    var token = sha1(encoded_data);

    //Send to redis {token : encoded_data}

    res.json({token: token});

});


module.exports = router;