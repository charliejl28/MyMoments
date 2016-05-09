'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  Moment = mongoose.model('Moment'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  _ = require('lodash');

var Twitter = require('twitter');

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
  console.log('getting tweets for ', user.displayName);

  var twitterData = {
    consumer_key: '1eKxZupL5OxEMpY4L0fv7gixo',
    consumer_secret: 'GDDKbtLp2dU6oFxnVPLImdEysQsjAm5X84RuAMlFFES3H8WYj6',
    access_token_key: user.providerData.token,
    access_token_secret: user.providerData.tokenSecret
  };
  console.log(twitterData);

  var client = new Twitter(twitterData);
   
  var params = {screen_name: user.providerData.screen_name};
  client.get('statuses/user_timeline', params, function(error, tweets, response){
    if (!error) {
      console.log(tweets);
      for (var i = 0; i < tweets.length; i++) {
        var tweet = tweets[i];
        tweet.user = tweet.user.screen_name;
      };
      callback(null, tweets);
    }
    else {
      console.log(error);
    }
  });
};

var getInterests = function(user, tweets) {
  return [
    {
      topic: 'tech'
    },
    {
      topic: 'sports'
    }
  ];
};

var getMomentsFromInterests = function(user, interests, callback) {
  var moments = [      
          {
            title: 'first moment'
          },
          {
            title: 'second moment'
          }];

  callback(null, moments);
}

var getMomentsForUser = function(user, callback){
  getTweets(user, function(error, tweets){
    var interests = getInterests(user, tweets);
    getMomentsFromInterests(user, interests, function(error, moments){
      callback({
        tweets: tweets,
        interests: interests,
        moments: moments
      });
    });
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
