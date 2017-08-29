

// POST Operations/token
describe('/operations routes', function(){
    it('Tokenize a Credit Card', function () {
        request.post('/operations/token')
            .send({
               card_number: '5319670733147404',
               exp_month: '12',
               exp_year: '2021',
               card_cvc: '123',
               card_name: 'Josue Araujo',
               card_type: 'mastercard'
            })
            .expect(200)
            .end(function(err, res){
                expect(res.body).have.property('token')
                done(err);
            });
    });

    it('Makes a pre_auth',function(){
        //First tokenize a card
        request.post('/operations/token')
            .send({
                card_number: '5319670733147404',
                exp_month: '12',
                exp_year: '2021',
                card_cvc: '123',
                card_name: 'Josue Araujo',
                card_type: 'mastercard'
            })
            .expect(200)
            .end(function(err, res){
                //Once tokenized proceed to pre_auth
                request.post('/operations/pre_auth')
                    .send({
                        company : 'Playeras Conekta',
                        token: res.body.token,
                        amount: '1000.00',
                        currency: 'MXN',
                        description: 'Playeras de algodon',
                        promo_msi: false,
                        date : new Date()
                    })
                    .expect(200)
                    .end(function(err,res){
                        expect(res.body.status).is('OK');
                        done(err);
                    });
            });
    });

    it('Makes a Charge',function(){
        //First tokenize a card
        request.post('/operations/token')
            .send({
                card_number: '5319670733147404',
                exp_month: '12',
                exp_year: '2021',
                card_cvc: '123',
                card_name: 'Josue Araujo',
                card_type: 'mastercard'
            })
            .expect(200)
            .end(function(err, res){
                //Once tokenized proceed to pre_auth
                request.post('/operations/charge')
                    .send({
                        company : 'Playeras Conekta',
                        token: res.body.token,
                        amount: '1000.00',
                        currency: 'MXN',
                        description: 'Playeras de algodon',
                        promo_msi: false,
                        date : new Date()
                    })
                    .expect(200)
                    .end(function(err,res){
                        expect(res.body).has.property('_id');
                        done(err);
                    });
            });
    });

    it('Makes a void', function() {
        //First tokenize a card
        request.post('/operations/token')
            .send({
                card_number: '5319670733147404',
                exp_month: '12',
                exp_year: '2021',
                card_cvc: '123',
                card_name: 'Josue Araujo',
                card_type: 'mastercard'
            })
            .expect(200)
            .end(function(err, res){
                //Once tokenized proceed to pre_auth
                request.post('/operations/pre_auth')
                    .send({
                        company : 'Playeras Conekta',
                        token: res.body.token,
                        amount: '1000.00',
                        currency: 'MXN',
                        description: 'Playeras de algodon',
                        promo_msi: false,
                        date : new Date()
                    })
                    .expect(200)
                    .end(function(err,res){
                        //Once pre_auth makes a Void
                        request.get('/operations/void?id=' +res._id )
                            .expect(200)
                            .end(function(err,res){
                                done(err);
                            });
                    });
            });
    });

    it('Makes a Refund',function(){
        //First tokenize a card
        request.post('/operations/token')
            .send({
                card_number: '5319670733147404',
                exp_month: '12',
                exp_year: '2021',
                card_cvc: '123',
                card_name: 'Josue Araujo',
                card_type: 'mastercard'
            })
            .expect(200)
            .end(function(err, res){
                //Once tokenized proceed to pre_auth
                request.post('/operations/charge')
                    .send({
                        company : 'Playeras Conekta',
                        token: res.body.token,
                        amount: '1000.00',
                        currency: 'MXN',
                        description: 'Playeras de algodon',
                        promo_msi: false,
                        date : new Date()
                    })
                    .expect(200)
                    .end(function(err,res){
                        //Once charge makes a Refund
                        request.get('/operations/refund?id=' +res._id )
                            .expect(200)
                            .end(function(err,res){
                                done(err);
                            });
                    });
            });
    });

});