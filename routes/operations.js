var express = require('express');
var redis = require('redis');
var router = express.Router();
var mongoose = require('mongoose');
var utils = require('../misc/utils');
var Client = require('node-rest-client').Client;
var Charge = require('../models/Charge');

var STATUS = utils.STATUS;
var GATEWAY = utils.GATEWAYS;
var BANCOMER_BINES = utils.BANCOMER_BINS;
var SANTANDER_BINES = utils.SANTANDER_BINS;
var BANCOMER_BINES_MSI = utils.BANCOMER_BINS_MSI;

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

    var to_token = card_number + '|' + card_expiry + '|' + card_cvc + '|' + card_name + '|' + card_type;

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

router.post('/pre_auth', function(req,res,next){
    var company = req.body.company;
    var token = req.body.token;
    var amount = req.body.amount;
    var currency = req.body.currency;
    var description = req.body.description;
    var promo_msi = req.body.promo_msi;
    var company = req.body.company;
    var currency = req.body.currency;
    var date = new Date();

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
        charge.save(function(err, charge_saved, total){
            if(err)
                res.json({error: err});

            console.log(charge_saved);

            //SELECT GATEWAY ACCORDING TO BIN
            var pasarela = Math.floor(Math.random() * 2) == 0 ? GATEWAY.BANCOMER : GATEWAY.SANTANDER;

            //Pay to gateway
            var rest_client = new Client();
            rest_client.post(pasarela+'/pre_auth', {}, function (data, response) {
                console.log(data);

                var change_status = data.result == 'accepted' ? STATUS.PRE_AUTH : STATUS.REJECTED;

                Charge.findOneAndUpdate({_id : charge_saved.id },{status : change_status}, {new: true}, function(err, doc) {
                    var message = change_status == STATUS.PRE_AUTH ? 'Preautorización realizada correctamente!.' : 'Preautorización rechazada';
                    res.json({status: 'OK', message: message, gateway : data.bank, gateway_result : data.result, card_type: doc.card_type, id:doc.id });
                });
            });
        });
    });
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
    var id = req.body.id;
    var date = new Date();

    //Check if token exist in memory.
    redis_client.get(token, function(err,reply){
        if(err){
            res.json({error:err, message: 'Invalid token.'});
        }
        console.log('ID->' + id);
        //Check if preauth charge
        Charge.findOne({_id : id }, function(err, doc) {
            console.log(doc);

            //SELECT RANDOM GATEWAY
            var pasarela = Math.floor(Math.random() * 2) == 0 ? GATEWAY.BANCOMER : GATEWAY.SANTANDER;

            if(doc) {
                console.log('IF');
                if(doc.status == STATUS.PRE_AUTH){
                    //Proceed to pay

                    //SELECT GATEWAY ACCORDING TO BIN RULES
                    if ( BANCOMER_BINES.indexOf(doc.card_bin) > -1 ||
                        doc.promo == 'true' && BANCOMER_BINES_MSI.indexOf(doc.card_bin) > -1 )
                        pasarela = GATEWAY.BANCOMER;
                    if( SANTANDER_BINES.indexOf(doc.card_bin) > -1)
                        pasarela = GATEWAY.SANTANDER;

                    //Pay to gateway
                    var rest_client = new Client();
                    rest_client.post(pasarela+'/pay', {}, function (data, response) {

                        //Update after gateway response.
                        var change_status = data.result == 'accepted' ? STATUS.PAID : STATUS.REJECTED;

                        Charge.findOneAndUpdate({id : id },{status : change_status}, {new: true}, function(err, doc2) {
                            doc2.gateway = data.bank;
                            doc2.gateway_result = data.result;
                            res.json(doc2);
                        });
                    });
                }
            } else {
                //New Charge
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
                charge.save(function(err, charge_saved, total){
                    if(err)
                        res.json({error: err});

                    //SELECT GATEWAY ACCORDING TO BIN RULES
                    if ( BANCOMER_BINES.indexOf(utils.get_bin(charge_info.card_bin)) > -1 ||
                        charge_info.promo == 'true' && BANCOMER_BINES_MSI.indexOf(utils.get_bin(charge_info.card_bin)) > -1 )
                        pasarela = GATEWAY.BANCOMER;
                    if( SANTANDER_BINES.indexOf(utils.get_bin(charge_info.card_bin)) > -1)
                        pasarela = GATEWAY.SANTANDER;

                    //Pay to gateway
                    var rest_client = new Client();
                    rest_client.post(pasarela+'/pay', {}, function (data, response) {

                        //Update after gateway response.
                        var change_status = data.result == 'accepted' ? STATUS.PAID : STATUS.REJECTED;

                        Charge.findOneAndUpdate({_id : charge_saved.id },{status : change_status}, {new: true}, function(err, doc2) {

                            charge_info.status = doc2.status;
                            charge_info.gateway = data.bank;
                            charge_info.gateway_result = data.result;
                            console.log(charge_info);
                            res.json(charge_info);
                        });
                    });

                });
            }
        });
    });
});

module.exports = router;