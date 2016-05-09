'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  mongoose = require('mongoose'),
  Moment = mongoose.model('Moment'),
  async = require('async'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  _ = require('lodash');

var Twitter = require('twitter');
var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var keyword_extractor = require("keyword-extractor");
var cnn = require('cnn-news');

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

var url = function ValidURL(str) {
  var pattern = new RegExp("(http|ftp|https)://");
  return pattern.test(str);
}

var parser = function(tweet) {
  var res = keyword_extractor.extract(tweet, {
                                              language:"english",
                                              remove_digits: true,
                                              return_changed_case:true,
                                              remove_duplicates: false
                                             });
  for (var i = 0; i < res.length; i++) {
    if (res[i] == 'RT' || res[i].indexOf('@') == 0 || url(res[i]))
      res[i] = '';
    else {
      if (res[i].indexOf('#') == 0) res[i] = res[i].substring(1);
      res[i].replace(/[^a-zA-Z ]/g, "");
    }
  };
  return res;
}

var getInterests = function(user, tweets) {
  var words = {};
  // step 1: generate a dictionary of most frequent terms
  for (var j = 0; j < 1; j++) {
    var tokens = parser(tweets[j]["text"]);
    for (var i = 0; i < tokens.length; i++) {
      var w = tokens[i];
      if (w != '') {
        if (w in words) words[w] += 1;
        else words[w] = 1;
      }
    };
  }
  
  // step 2: for each term, scrape DMOZ to find the categories
  var interests = {};
  var keyword;
  for (keyword in words) {
    var count = words[keyword];
    var url = 'https://www.dmoz.org/search?q=' + keyword + '&start=0&type=more&all=no&cat=';
    request(url, function(error, response, html) {
      if (!error) {
        var $ = cheerio.load(html);

        // check if there are any results
        if ($('ol.dir').length) {
          $('li').each(function(i, element){
            var categories = $(this).children().first().children().text().split(":");
            for (var k = 0; k < categories.length; k++) {
              var cat = categories[k].trim();
              // console.log(cat);
              interests[cat] = count;
            }
          });

          // if there are more than 25, keep crawling until finished
          var index = 25;
          var h3 = $('h3').children().first().next().text().split(" ");
          var end = parseInt(h3[2].substring(0, h3[2].length-1));

          while (index < end) {
            url = 'https://www.dmoz.org/search?q=' + keyword + '&start=' + index.toString() + '&type=more&all=no&cat=';
            request(url, function(error2, response2, html2) {
              if (!error2) {
                $ = cheerio.load(html2);
                $('li').each(function(j, element2){
                  var categories = $(this).children().first().children().text().split(":");
                  for (var m = 0; m < categories.length; m++) {
                    var cat = categories[m].trim();
                    // console.log(cat);
                    interests[cat] = count;
                  }
                });
              }
            })
            index += 25;
          }
        }
      }
    })
  }

  // var p;
  // console.log('===================');
  // for (p in words) {
  //   console.log(p);
  // }
  return interests;
  

  // step 3: once all categories have been found, do something.
  // return [
  //   {
  //     topic: 'tech'
  //   },
  //   {
  //     topic: 'sports'
  //   }
  // ];
};

var getMomentsFromInterests = function(user, interests, callback) {
  var moments = [];

  async.each(interests, function(interest, eachCallback){
    console.log('interest: ', interest);
    cnn[interest.topic](function(error, meta, articles){
      console.log(interest.topic, 'returned');
      if (error) {
        console.log(interest.topic, 'failed');
        console.log(error);

      }
      else {
        var count = Math.min(interest.count, articles.length);

        for (var i = 0; i < count; i++) {
          moments.push(articles[i]);
        };
      }
      eachCallback();
    });
  }, function(err){
    if (err) {  
      console.log(err); 
    }
    else {
      callback(null, moments);
    }
  });

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
