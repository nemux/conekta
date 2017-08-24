var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Charge = new Schema({
    company: String,
    token: String,
    amount: Number,
    currency: String,
    description: String,
    purchase_date: Date,
    status: String,
    promo: Boolean,
    card_name: String,
    card_bin: Number,
    card_last4: Number,
    card_type: String
});

module.exports = mongoose.model('Charge', Charge);