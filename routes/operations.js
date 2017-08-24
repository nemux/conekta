var express = require('express');
var redis = require('redis');
var router = express.Router();
var mongoose = require('mongoose');
var utils = require('../misc/utils');
var Charge = require('../models/Charge');
var STATUS = utils.STATUS;

//Configure redis
var redis_client = redis.createClient();

/*
* POST Card information to get a Token
* */
router.post('/token', function(req, res, next){

    var card_number = req.body.card_number;
    var card_expiry = req.body.exp_month + '/' + req.body.exp_year;
    var card_cvc = req.body.card_cvc;
    var card_name = req.body.card_name;
    var card_type = req.body.card_type;
    var date = new Date();

    var to_token = card_number + '|' + card_expiry + '|' + card_cvc + '|' + card_name + '|' + card_type + '|' +date;

    var cipher_data = utils.cipher(to_token);
    var token = utils.create_token(cipher_data);

    //Send to redis {token : encoded_data}
    redis_client.set(token,cipher_data, function(err, reply){
        console.log('Stored in REDIS-> ' + reply);
        if (err)
            res.json({error: err});

        redis_client.set(token,cipher_data,'EX',600);
    });

    res.json({token: token});

});

router.post('/charge', function(req,res,next){
    var company = req.body.company;
    var token = req.body.token;
    var amount = req.body.amount;
    var currency = req.body.currency;
    var description = req.body.description;
    var promo_msi = req.body.promo_msi;
    var company = req.body.company;
    var currency = req.body.currency;
    var date = new Date();

    console.log(req.body);

    //Check if token exist
    redis_client.get(token, function(err,reply){
        if(err){
            res.json({error:err});
        }
         var card_info = utils.decode_card_info(reply);
         var charge_info = {
            company: company,
            token: token,
            amount: amount,
            currency: currency,
            description: description,
            purchase_date: date,
            status: STATUS.PENDING_PAYMENT,
            promo: promo_msi,
            card_name: card_info.card_name,
            card_bin: utils.get_bin(card_info.card_number),
            card_last4: utils.get_last4(card_info.card_number),
            card_type: card_info.card_type
        };

        var charge = new Charge(charge_info);
        charge.save(function(err, todo, count){
            if(err)
                res.json({error: err});

        });


        res.json(card_info);
    });
});


module.exports = router;