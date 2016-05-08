'use strict';

var should = require('should'),
  request = require('supertest'),
  path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  Moment = mongoose.model('Moment'),
  express = require(path.resolve('./config/lib/express'));

/**
 * Globals
 */
var app, agent, credentials, user, moment;

/**
 * Moment routes tests
 */
describe('Moment CRUD tests', function () {

  before(function (done) {
    // Get application
    app = express.init(mongoose);
    agent = request.agent(app);

    done();
  });

  beforeEach(function (done) {
    // Create user credentials
    credentials = {
      username: 'username',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    // Create a new user
    user = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test@test.com',
      username: credentials.username,
      password: credentials.password,
      provider: 'local'
    });

    // Save a user to the test db and create new Moment
    user.save(function () {
      moment = {
        name: 'Moment name'
      };

      done();
    });
  });

  it('should be able to save a Moment if logged in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new Moment
        agent.post('/api/moments')
          .send(moment)
          .expect(200)
          .end(function (momentSaveErr, momentSaveRes) {
            // Handle Moment save error
            if (momentSaveErr) {
              return done(momentSaveErr);
            }

            // Get a list of Moments
            agent.get('/api/moments')
              .end(function (momentsGetErr, momentsGetRes) {
                // Handle Moment save error
                if (momentsGetErr) {
                  return done(momentsGetErr);
                }

                // Get Moments list
                var moments = momentsGetRes.body;

                // Set assertions
                (moments[0].user._id).should.equal(userId);
                (moments[0].name).should.match('Moment name');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to save an Moment if not logged in', function (done) {
    agent.post('/api/moments')
      .send(moment)
      .expect(403)
      .end(function (momentSaveErr, momentSaveRes) {
        // Call the assertion callback
        done(momentSaveErr);
      });
  });

  it('should not be able to save an Moment if no name is provided', function (done) {
    // Invalidate name field
    moment.name = '';

    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new Moment
        agent.post('/api/moments')
          .send(moment)
          .expect(400)
          .end(function (momentSaveErr, momentSaveRes) {
            // Set message assertion
            (momentSaveRes.body.message).should.match('Please fill Moment name');

            // Handle Moment save error
            done(momentSaveErr);
          });
      });
  });

  it('should be able to update an Moment if signed in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new Moment
        agent.post('/api/moments')
          .send(moment)
          .expect(200)
          .end(function (momentSaveErr, momentSaveRes) {
            // Handle Moment save error
            if (momentSaveErr) {
              return done(momentSaveErr);
            }

            // Update Moment name
            moment.name = 'WHY YOU GOTTA BE SO MEAN?';

            // Update an existing Moment
            agent.put('/api/moments/' + momentSaveRes.body._id)
              .send(moment)
              .expect(200)
              .end(function (momentUpdateErr, momentUpdateRes) {
                // Handle Moment update error
                if (momentUpdateErr) {
                  return done(momentUpdateErr);
                }

                // Set assertions
                (momentUpdateRes.body._id).should.equal(momentSaveRes.body._id);
                (momentUpdateRes.body.name).should.match('WHY YOU GOTTA BE SO MEAN?');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should be able to get a list of Moments if not signed in', function (done) {
    // Create new Moment model instance
    var momentObj = new Moment(moment);

    // Save the moment
    momentObj.save(function () {
      // Request Moments
      request(app).get('/api/moments')
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Array).and.have.lengthOf(1);

          // Call the assertion callback
          done();
        });

    });
  });

  it('should be able to get a single Moment if not signed in', function (done) {
    // Create new Moment model instance
    var momentObj = new Moment(moment);

    // Save the Moment
    momentObj.save(function () {
      request(app).get('/api/moments/' + momentObj._id)
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Object).and.have.property('name', moment.name);

          // Call the assertion callback
          done();
        });
    });
  });

  it('should return proper error for single Moment with an invalid Id, if not signed in', function (done) {
    // test is not a valid mongoose Id
    request(app).get('/api/moments/test')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'Moment is invalid');

        // Call the assertion callback
        done();
      });
  });

  it('should return proper error for single Moment which doesnt exist, if not signed in', function (done) {
    // This is a valid mongoose Id but a non-existent Moment
    request(app).get('/api/moments/559e9cd815f80b4c256a8f41')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'No Moment with that identifier has been found');

        // Call the assertion callback
        done();
      });
  });

  it('should be able to delete an Moment if signed in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new Moment
        agent.post('/api/moments')
          .send(moment)
          .expect(200)
          .end(function (momentSaveErr, momentSaveRes) {
            // Handle Moment save error
            if (momentSaveErr) {
              return done(momentSaveErr);
            }

            // Delete an existing Moment
            agent.delete('/api/moments/' + momentSaveRes.body._id)
              .send(moment)
              .expect(200)
              .end(function (momentDeleteErr, momentDeleteRes) {
                // Handle moment error error
                if (momentDeleteErr) {
                  return done(momentDeleteErr);
                }

                // Set assertions
                (momentDeleteRes.body._id).should.equal(momentSaveRes.body._id);

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to delete an Moment if not signed in', function (done) {
    // Set Moment user
    moment.user = user;

    // Create new Moment model instance
    var momentObj = new Moment(moment);

    // Save the Moment
    momentObj.save(function () {
      // Try deleting Moment
      request(app).delete('/api/moments/' + momentObj._id)
        .expect(403)
        .end(function (momentDeleteErr, momentDeleteRes) {
          // Set message assertion
          (momentDeleteRes.body.message).should.match('User is not authorized');

          // Handle Moment error error
          done(momentDeleteErr);
        });

    });
  });

  it('should be able to get a single Moment that has an orphaned user reference', function (done) {
    // Create orphan user creds
    var _creds = {
      username: 'orphan',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    // Create orphan user
    var _orphan = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'orphan@test.com',
      username: _creds.username,
      password: _creds.password,
      provider: 'local'
    });

    _orphan.save(function (err, orphan) {
      // Handle save error
      if (err) {
        return done(err);
      }

      agent.post('/api/auth/signin')
        .send(_creds)
        .expect(200)
        .end(function (signinErr, signinRes) {
          // Handle signin error
          if (signinErr) {
            return done(signinErr);
          }

          // Get the userId
          var orphanId = orphan._id;

          // Save a new Moment
          agent.post('/api/moments')
            .send(moment)
            .expect(200)
            .end(function (momentSaveErr, momentSaveRes) {
              // Handle Moment save error
              if (momentSaveErr) {
                return done(momentSaveErr);
              }

              // Set assertions on new Moment
              (momentSaveRes.body.name).should.equal(moment.name);
              should.exist(momentSaveRes.body.user);
              should.equal(momentSaveRes.body.user._id, orphanId);

              // force the Moment to have an orphaned user reference
              orphan.remove(function () {
                // now signin with valid user
                agent.post('/api/auth/signin')
                  .send(credentials)
                  .expect(200)
                  .end(function (err, res) {
                    // Handle signin error
                    if (err) {
                      return done(err);
                    }

                    // Get the Moment
                    agent.get('/api/moments/' + momentSaveRes.body._id)
                      .expect(200)
                      .end(function (momentInfoErr, momentInfoRes) {
                        // Handle Moment error
                        if (momentInfoErr) {
                          return done(momentInfoErr);
                        }

                        // Set assertions
                        (momentInfoRes.body._id).should.equal(momentSaveRes.body._id);
                        (momentInfoRes.body.name).should.equal(moment.name);
                        should.equal(momentInfoRes.body.user, undefined);

                        // Call the assertion callback
                        done();
                      });
                  });
              });
            });
        });
    });
  });

  afterEach(function (done) {
    User.remove().exec(function () {
      Moment.remove().exec(done);
    });
  });
});
