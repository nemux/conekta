var base64 = require('base-64');
var utf8 = require('utf8');
var sha1 = require('sha1');

exports.cipher = function (text){
    var bytes = utf8.encode(text);
    var encoded_data = base64.encode(bytes);

    return encoded_data;
};

exports.create_token = function(cipher_data) {
    var token = sha1(cipher_data);
    return token;
};

exports.decode_card_info = function(cipher_data){
    var bytes = base64.decode(cipher_data);
    var text = utf8.decode(bytes);
    var info = text.split("|");

    return {card_number: info[0], card_expiry : info[1], card_cvc: info[2], card_name: info[3], card_type: info[4], date: info[5]};
};

exports.get_bin = function(string){
    return string.substring(0,6);
};

exports.get_last4 = function(string){
  return string.substring(string.length - 4);
};

exports.STATUS = {
    PENDING_PAYMENT: 'Pendiente de Pago',
    PRE_AUTH:'Pre Autorizado',
    PAID: 'Pagado',
    REFOUNDED: 'Refounded',
    VOID: 'Liberado'
};

