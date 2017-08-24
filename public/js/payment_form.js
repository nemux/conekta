var $form = $('#payment-form');
$form.find('.pagar').on('click', pagarConMiniconekta);

function pagarConMiniconekta(e){
    e.preventDefault();

    if (!validator.form()) {
        return;
    }

    $form.find('.pagar').html('Validando... <i class="fa fa-spinner fa-pulse"></i>').prop('disabled', true);

    var expiry =$.payment.cardExpiryVal($('input[name=card_expiry]').val());

    var ccData = {
        "card_number": $form.find('[name=card_number]').val().replace(/\s/g,''),
        "card_cvc": $form.find('[name=card_cvc]').val(),
        "exp_month": expiry.month,
        "exp_year": expiry.year,
        "card_name": $form.find('[name=card_name]').val(),
        "card_type": $.payment.cardType($form.find('[name=card_number]').val().replace(/\s/g,''))
    };

    request_token = $.ajax({
        type: "POST",
        dataType: 'json',
        url: '/operations/token',
        data: ccData
    });


    request_token.done(function(response, textStatus, jqXHR){

        request_charge = $.ajax({
            type: "POST",
            dataType: 'json',
            url: '/operations/charge',
            data: {
                token: response.token,
                amount: $('input[name=amount]').val(),
                promo_msi : $('input[name=promo_msi]').is(':checked'),
                company : 'Playeras Conekta',
                currency : 'MXN',
                description :$('input[name=description]').val()
            }
        });

        request_charge.done(function(response, textStatus, jqXHR){
            $form.find('.pagar').html('Pagado <i class="fa fa-pulse"></i>').prop('disabled', true);
            alert('Pago realizado correctamente.');
            location.reload();
        });

        request_charge.fail(function(response, textStatus, jqXHR){
            $form.find('.pagar').html('Pagado <i class="fa fa-pulse"></i>').prop('disabled', true);
            alert('Error al realizar pago.');
            location.reload();
        });
    });

    request_token.fail(function(jqXHR, textstatus, errorThrown){
        // Log the error to the console
        console.error(
            "The following error occurred: "+
            textStatus, errorThrown
        );
        location.reload();
    });
}


$('input[name=card_number]').payment('formatCardNumber');
$('input[name=card_cvc]').payment('formatCardCVC');
$('input[name=card_expiry]').payment('formatCardExpiry');

jQuery.validator.addMethod("cardNumber", function(value, element) {
    return this.optional(element) || $.payment.validateCardNumber(value);
}, "Please specify a valid credit card number.");

jQuery.validator.addMethod("card_expiry", function(value, element) {
    value = $.payment.cardExpiryVal(value);
    return this.optional(element) || $.payment.validateCardExpity(value.month, value.year);
}, "Invalid expiration date.");

jQuery.validator.addMethod("cardCvc", function(value, element) {
    return this.optional(element) || $.payment.validateCardCVC(value);
}, "Invalid CVC.");

validator = $form.validate({
    rules: {
        cardNumber: {
            required: true,
            card_number: true
        },
        cardExpiry: {
            required: true,
            card_expiry: true
        },
        cardCvc: {
            required: true,
            card_cvc: true
        }
    },
    highlight: function(element) {
        $(element).closest('.form-control').removeClass('success').addClass('error');
    },
    unhighlight: function(element) {
        $(element).closest('.form-control').removeClass('error').addClass('success');
    },
    errorPlacement: function(error, element) {
        $(element).closest('.form-group').append(error);
    }
});

paymentFormReady = function() {
    if ($form.find('[name=card_number]').hasClass("success") &&
        $form.find('[name=card_expiry]').hasClass("success") &&
        $form.find('[name=card_cvc]').val().length > 1) {
        return true;
    } else {
        return false;
    }
}

$form.find('.pagar').prop('disabled', true);
var readyInterval = setInterval(function() {
    if (paymentFormReady()) {
        $form.find('.pagar').prop('disabled', false);
        clearInterval(readyInterval);
    }
}, 250);