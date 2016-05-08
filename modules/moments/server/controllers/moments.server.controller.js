'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  Moment = mongoose.model('Moment'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  _ = require('lodash');

/**
 * Create a Moment
 */
exports.create = function(req, res) {
  var moment = new Moment(req.body);
  moment.user = req.user;

  moment.save(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(moment);
    }
  });
};

/**
 * Show the current Moment
 */
exports.read = function(req, res) {
  // convert mongoose document to JSON
  var moment = req.moment ? req.moment.toJSON() : {};

  // Add a custom field to the Article, for determining if the current User is the "owner".
  // NOTE: This field is NOT persisted to the database, since it doesn't exist in the Article model.
  moment.isCurrentUserOwner = req.user && moment.user && moment.user._id.toString() === req.user._id.toString() ? true : false;

  res.jsonp(moment);
};

/**
 * Update a Moment
 */
exports.update = function(req, res) {
  var moment = req.moment ;

  moment = _.extend(moment , req.body);

  moment.save(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(moment);
    }
  });
};

/**
 * Delete an Moment
 */
exports.delete = function(req, res) {
  var moment = req.moment ;

  moment.remove(function(err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(moment);
    }
  });
};

var getTweets = function(user, callback) {

};

var getInterests = function(user, tweets) {

};

var getMomentsFromInterests = function(user, interests, callback) {

}

var getMomentsForUser = function(user, callback){

  callback({
    tweets: [],
    interests: [],
    moments: [      
      {
        title: 'first moment'
      },
      {
        title: 'second moment'
      }]
  });
}

/**
 * List of Moments
 */
exports.list = function(req, res) { 

  getMomentsForUser(req.user, function(data, err){
    res.jsonp(data);
  });

  // Moment.find().sort('-created').populate('user', 'displayName').exec(function(err, moments) {
  //   if (err) {
  //     return res.status(400).send({
  //       message: errorHandler.getErrorMessage(err)
  //     });
  //   } else {
  //     res.jsonp(moments);
  //   }
  // });
};

/**
 * Moment middleware
 */
exports.momentByID = function(req, res, next, id) {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Moment is invalid'
    });
  }

  Moment.findById(id).populate('user', 'displayName').exec(function (err, moment) {
    if (err) {
      return next(err);
    } else if (!moment) {
      return res.status(404).send({
        message: 'No Moment with that identifier has been found'
      });
    }
    req.moment = moment;
    next();
  });
};
