//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

//Require the dev-dependencies
var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../server');
var db = require('../routes/db');
var fs = require('fs');
var logger = require('../utils/logger');

var should = chai.should();

chai.use(chaiHttp);

// Our parent block
describe('Images', () => {
    beforeEach((done) => { //Before each test we empty the database
        db.clearDatabase(function() {
           done();
        });
    });

    /*
      * Test the /GET route
      */
    describe('/GET image', () => {
        it('it should GET all the images for the specified event', (done) => {
            var event = {
                code: 1000,
                optPassword: null,
                adminPassword: null,
                startDate: null,
                endDate: null,
                location: null,
                description: null

            };
            var image = {
                name: 'test.jpg',
                path: 'test/test.jpg',
                size: '23423'
            };
            db.insertEvent(event);
            db.insertImage(1000, image, function(id){});
            chai.request(server)
                .get('/api/events/1000/images')
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('array');
                    res.body.length.should.be.eql(1);
                    done();
                });
        });
        it('it should GET a 204 if the event has no images', (done) => {
            var event = {
                code: 100,
                optPassword: null,
                adminPassword: null,
                startDate: null,
                endDate: null,
                location: null,
                description: null

            };
            db.insertEvent(event);

            chai.request(server)
                .get('/api/events/100/images')
                .end((err, res) => {
                    res.should.have.status(204);
                    done();
                });
        });
        it('it should GET a 404 if the eventcode does not exist', (done) => {
            chai.request(server)
                .get('/api/events/10/images')
                .end((err, res) => {
                    res.should.have.status(404);
                    done();
                });
        });
        it('it should GET the image for the specified event and the specified id', (done) => {
            var event = {
                code: 1000,
                optPassword: null,
                adminPassword: null,
                startDate: null,
                endDate: null,
                location: null,
                description: null

            };
            var image = {
                name: 'test.jpg',
                path: 'test/test.jpg',
                size: '23423'
            };
            db.insertEvent(event);
            db.insertImage(1000, image, function(id) {
                chai.request(server)
                    .get('/api/events/1000/images/'+id)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.be.a('object');
                        res.body.should.have.property("path");
                        done();
                    });
            });
        });
        it('it should GET a 404 if the image with the specified id does not exist', (done) => {
            var event = {
                code: 1000,
                optPassword: null,
                adminPassword: null,
                startDate: null,
                endDate: null,
                location: null,
                description: null

            };
            var image = {
                name: 'test.jpg',
                path: 'test/test.jpg',
                size: '23423'
            };
            db.insertEvent(event);

            chai.request(server)
                .get('/api/events/1000/images/1')
                .end((err, res) => {
                    res.should.have.status(404);
                    done();
                });
    });
    });
    describe('/POST image', () => {
        it('it should POST an image and return status 201', (done) => {
            var event = {
                code: 1000,
                optPassword: null,
                adminPassword: null,
                startDate: null,
                endDate: null,
                location: null,
                description: null
            };
            db.insertEvent(event);
            chai.request(server)
                .post('/api/events/1000/images')
                // .type('form')
                // .send({'file': 'dog.jpg'})
                .attach('file', fs.readFileSync('dog.jpg'), 'dog.jpg')
                .end((err, res) => {
                    res.should.have.status(201);
                    res.header.location.should.contain("/api/events/1000/images/");
                    done();
                });
        });
    });
});