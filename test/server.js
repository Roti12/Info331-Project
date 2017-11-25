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
    after((done) => {
        var event = {
            code: 1000,
            optPassword: "123",
            adminPassword: "admin123",
            startDate: "2017-11-04",
            endDate: "2017-18-11",
            location: "norway",
            description: "bla",
            email: "test@gmail.com"
        };
        db.insertEvent(event, function() {
            done();
        });
    });
    /*
      * Test the /GET route for /api/events/:eventcode/images
      */
    describe('/GET /api/events/:eventcode/images', () => {
        it('it should GET all the images for the specified event', (done) => {
            var event = {
                code: 1000,
                optPassword: "123",
                adminPassword: "admin123",
                startDate: "2017-11-04",
                endDate: "2017-11-05",
                location: "norway",
                description: "bla",
                email: "test@gmail.com"

            };
            var image = {
                name: 'test.jpg',
                path: 'test/test.jpg',
                size: '23423'
            };
            db.insertEvent(event, function(err) {
                if(err) throw err;
                db.insertImage(1000, image, function(err, id){
                    if(err) throw err;
                    chai.request(server)
                        .get('/api/events/1000/images')
                        .end((err, res) => {
                            res.should.have.status(200);
                            res.body.should.be.a('array');
                            res.body.length.should.be.eql(1);
                            done();
                        });
                });
            });
        });
        it('it should GET a 204 if the event has no images', (done) => {
            var event = {
                code: 100,
                optPassword: "123",
                adminPassword: "admin123",
                startDate: "2017-11-04",
                endDate: "2017-11-05",
                location: "norway",
                description: "bla",
                email: "test@gmail.com"
            };
            db.insertEvent(event, function(err) {
                if(err) throw err;
                chai.request(server)
                    .get('/api/events/100/images')
                    .end((err, res) => {
                        res.should.have.status(204);
                        done();
                    });
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

    });

/*
  * Test the /GET route for /api/events/:eventcode/images/:imageid
  */
    describe('/GET /api/events/:eventcode/images/:imageid', () => {
        it('it should GET the image for the specified event and the specified id', (done) => {
            var event = {
                code: 1000,
                optPassword: "123",
                adminPassword: "admin123",
                startDate: "2017-11-04",
                endDate: "2017-11-05",
                location: "norway",
                description: "bla",
                email: "test@gmail.com"

            };
            var image = {
                name: 'test.jpg',
                path: 'test/test.jpg',
                size: '23423'
            };
            db.insertEvent(event, function(err) {
                if(err) throw err;
                db.insertImage(1000, image, function(err, id) {
                    if(err) throw err;
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
        });
        it('it should GET a 404 if the image with the specified id does not exist', (done) => {
            var event = {
                code: 1000,
                optPassword: "123",
                adminPassword: "admin123",
                startDate: "2017-11-04",
                endDate: "2017-11-05",
                location: "norway",
                description: "bla",
                email: "test@gmail.com"
            };
            db.insertEvent(event, function(err) {
                if(err) throw err;
                var imageId = 1;

                chai.request(server)
                    .get('/api/events/1000/images/' + imageId)
                    .end((err, res) => {
                        res.should.have.status(404);
                        res.text.should.contain(imageId);
                        done();
                    });
            });
        });
        it('it should GET a 404 if the event with the specified code does not exist', (done) => {
            var eventCode = 1000;
            chai.request(server)
                .get('/api/events/' + eventCode + '/images/1')
                .end((err, res) => {
                    res.should.have.status(404);
                    res.text.should.contain(eventCode);
                    done();
                });
        });
    });

    /*
  * Test the /GET route for /api/events/:eventcode
  */
    describe('/GET /api/events/:eventcode', () => {
        it('it should GET the event for the specified code', (done) => {
            var event = {
                code: 1000,
                optPassword: "123",
                adminPassword: "admin123",
                startDate: "2017-11-04",
                endDate: "2017-11-05",
                location: "norway",
                description: "bla",
                email: "test@gmail.com"
            };
            db.insertEvent(event, function(err) {
                if(err) throw err;
                chai.request(server)
                    .get('/api/events/1000')
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.be.a('object');
                        res.body.should.have.property("code");
                        res.body.code.should.equal(1000);
                        done();
                    });
            });
        });
        it('it should GET a 404 if the event with the specified code does not exist', (done) => {
            var eventCode = 1000;
            chai.request(server)
                .get('/api/events/' + eventCode)
                .end((err, res) => {
                    res.should.have.status(404);
                    res.text.should.contain(eventCode);
                    done();
                });
        });
    });
    /*
 * Test the /POST route for /api/events
 */
    describe('/POST /api/events', () => {
        it('it should POST an event and return status 201', (done) => {
            var event = {
                code: 1000,
                optPassword: "123",
                adminPassword: "admin123",
                startDate: "2017-11-04",
                endDate: "2017-11-05",
                location: "norway",
                description: "bla",
                email: "test@gmail.com"
            };
            chai.request(server)
                .post('/api/events')
                .send({event: event})
                .end((err, res) => {
                    res.should.have.status(201);
                    //res.header.location.should.contain("/api/events/1000/images/");
                    done();
                });
        });
    });
    /*
  * Test the /POST route for /api/events/:eventcode/images
  */
    describe('/POST image', () => {
        it('it should POST an image and return status 201', (done) => {
            var event = {
                code: 1000,
                optPassword: "123",
                adminPassword: "admin123",
                startDate: "2017-11-04",
                endDate: "2017-11-05",
                location: "norway",
                description: "bla",
                email: "test@gmail.com"
            };
            var fileMetadata = {
                name: "test.jpg",
                type: "image/jpeg",
                size: "5200"
            };
            db.insertEvent(event, function(err) {
                if(err) throw err;
                chai.request(server)
                    .post('/api/events/1000/images')
                    //.attach('file', fs.readFileSync('test/dog.jpg'), 'dog.jpg')
                    .send({fileMetadata: fileMetadata})
                    .end((err, res) => {
                        res.should.have.status(201);
                        res.header.location.should.contain("/api/events/1000/images/");
                        done();
                    });
            });
        });
    });
    /*
* Test the /PUT route for /api/events/:eventcode
*/
    describe('/PUT /api/events/:eventcode', () => {
        it('it should update an event and return status 201', (done) => {
            var event = {
                code: 1000,
                optPassword: "123",
                adminPassword: "admin123",
                startDate: "2017-11-04",
                endDate: "2017-11-05",
                location: "norway",
                description: "bla",
                email: "test@gmail.com"
            };
            var updatedEvent = {
                optPassword: "1234",
                adminPassword: "admin1234",
                startDate: "2017-11-04",
                endDate: "2017-11-05",
                location: "bergen",
                description: "update test",
                email: "test@gmail.com"
            };
            db.insertEvent(event, function(err) {
                if(err) throw err;
                chai.request(server)
                    .put('/api/events/1000')
                    .send({event: updatedEvent})
                    .end((err, res) => {
                        res.should.have.status(201);
                        done();
                    });
            });
        });
    });
    /*
* Test the /DELETE route for /api/events/:eventcode
*/
    describe('/DELETE /api/events/:eventcode', () => {
        it('it should DELETE the event with the specified code', (done) => {
            var event = {
                code: 1000,
                optPassword: "123",
                adminPassword: "admin123",
                startDate: "2017-11-04",
                endDate: "2017-11-05",
                location: "norway",
                description: "bla",
                email: "test@gmail.com"
            };
            db.insertEvent(event, function(err) {
                if(err) throw err;
                chai.request(server)
                    .delete('/api/events/1000/')
                    .end((err, res) => {
                        res.should.have.status(204);
                        done();
                    });
            });

        });
    });
    /*
* Test the /DELETE route for /api/events/:eventcode/images/:imageid
*/
    describe('/DELETE /api/events/:eventcode/images/:imageid', () => {
        it('it should DELETE the image with the specified id', (done) => {
            var event = {
                code: 1000,
                optPassword: "123",
                adminPassword: "admin123",
                startDate: "2017-11-04",
                endDate: "2017-11-05",
                location: "norway",
                description: "bla",
                email: "test@gmail.com"
            };
            var fileMetadata = {
                name: "test.jpg",
                type: "image/jpeg",
                size: "5200"
            };

            chai.request(server)
                .post('/api/events')
                .send({event: event})
                .end((err, res) => {
                    chai.request(server)
                        .post('/api/events/1000/images')
                        // .attach('file', fs.readFileSync('test/dog.jpg'), 'dog.jpg')
                        .send({fileMetadata: fileMetadata})
                        .end((err, res) => {
                            var uri = res.header.location;
                            var imageId = uri.substring(uri.lastIndexOf("/") + 1);
                            chai.request(server)
                                .delete('/api/events/1000/images/' + imageId)
                                .end((err, res) => {
                                    res.should.have.status(204);
                                    done();
                                });
                        });
                });
        });
    });
});