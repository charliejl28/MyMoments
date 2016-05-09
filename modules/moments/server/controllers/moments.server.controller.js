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
var cnn = require('cnn-news');
var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var keyword_extractor = require("keyword-extractor");

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
      // console.log(tweets);
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
    if (res[i] == 'RT' || res[i].indexOf('@') == 0 || url(res[i]) || res[i].length == 1)
      res[i] = '';
    else {
      if (res[i].indexOf('#') == 0) res[i] = res[i].substring(1);
      res[i].replace(/[^a-zA-Z ]/g, '');
    }
  };
  return res;
}

var getTokenFrequencies = function(tweets){
  var words = {};
  for (var j = 0; j < tweets.length; j++) {
    var tokens = parser(tweets[j].text);
    for (var i = 0; i < tokens.length; i++) {
      var w = tokens[i];
      if (w != '') {
        if (w in words) words[w] += 1;
        else words[w] = 1;
      }
    };
  }
  return words;
};

var getDMOZForTerm = function(term, callback){
  var url = 'https://www.dmoz.org/search?q=' + term + '&start=0&type=more&all=no&cat=';

  // get the first page
  request(url, function(error, response, html) {
    if (!error) {
      var $ = cheerio.load(html);

      // check if there are any results
      if ($('ol.dir').length) {

        // store first page results
        var result = [];

        // get categories from first page
        $('li').each(function(i, element){
          var categories = $(this).children().first().children().text().split(':');
          for (var k = 0; k < categories.length; k++) {
            var cat = categories[k].trim();
            if (cat.length != 1) result.push(cat);
          }
        });
        return callback(null, result);
      }
    }
    callback(error, null);
  })
}; 

var CNN_CATEGORIES = ['top', 'world', 'us', 'business', 'politics', 
  'technology', 'health', 'entertainment', 'travel', 'living', 'video', 
  'studentNews', 'latest', 'ireport'];
var NUM_MOMENTS = 19.;

var getInterestsFromTweets = function(user, tweets, interestsCallback) {
  
  // step 1: generate a dictionary of most frequent tokens
  var tokenFrequencies = getTokenFrequencies(tweets);

  // step 2: retrieve DMOZ categories for each token
  var words = Object.keys(tokenFrequencies);
  var cnnFrequencies = {}
  var finished = 0;
  console.log(words.length, ' words');
  async.each(words, function(word, eachCallback){
    console.log('word: ', word);
    getDMOZForTerm(word, function(error, categories){
      // console.log(word, 'DMOZ categories: ', categories);
      finished += 1;
      console.log(finished, 'finished');

      // step 3: count appearances of CNN categories in DMOZ categories
      if (categories){
        for (var i = 0; i < categories.length; i++) {
          var category = categories[i].trim().toLowerCase();
          if (CNN_CATEGORIES.indexOf(category) >= 0) {
            console.log('* found ', category,'!');
            if (category in cnnFrequencies) {
              cnnFrequencies[category] += tokenFrequencies[word];
            }
            else {
              cnnFrequencies[category] = tokenFrequencies[word];
            }
          };
        };
      }

      eachCallback();
    });
  }, function(err){

    // Create items array
    var items = Object.keys(cnnFrequencies).map(function(key) {
        return [key, cnnFrequencies[key]];
    });

    // Sort the array based on the second element
    items.sort(function(first, second) {
        return second[1] - first[1];
    });

    console.log('cnn counts: ', items);

    var totalCount = 0;
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      totalCount += item[1];
    }
    console.log('total: ', totalCount)

    var interests = []
    var totalMoments = 0;
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      console.log(item[0], ': ', item[1]);
      var numMomentsForCurrentTopic = Math.round(Math.max(NUM_MOMENTS*1.0*item[1]/totalCount, 1));
      interests.push({
        topic: item[0],
        count: numMomentsForCurrentTopic
      });
      totalMoments += numMomentsForCurrentTopic
      if (totalMoments >= NUM_MOMENTS) {  break;  };
    }

    console.log('interests: ', interests)
    interestsCallback(null, interests);
  });


  var fakeInterests = [
    {
      topic: 'technology',
      count: 4
    },
    {
      topic: 'health',
      count: 2
    },
    {
      topic: 'top',
      count: 2
    }
  ];

  // interestsCallback(null, fakeInterests);

  return;
};

var getMomentsFromInterests = function(user, interests, callback) {

  var momentsByTopic = {}

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
        console.log('* adding ', count, interest.topic, ' articles');
        var topicMoments = [];
        for (var i = 0; i < count; i++) {
          var article = articles[i];
          article.description = article.description.split('<')[0];
          topicMoments.push(article);
        };
        momentsByTopic[interest.topic] = topicMoments;
      }
      eachCallback();
    });
  }, function(err){
    if (err) {  
      console.log(err); 
    }
    else {
      console.log(Object.keys(momentsByTopic));
      // console.log('moments by topic: ', momentsByTopic);
      var moments = [];
      console.log('interests: ', interests.length);
      for (var i = 0; i < interests.length; i++){
        var interest = interests[i];
        var momentsForTopic = momentsByTopic[interest.topic];
        console.log('* ', momentsForTopic.length, interest.topic, ' articles');
        for (var j = 0; j < momentsForTopic.length; j++) {
          var moment = momentsForTopic[j];
          console.log('** ', moment.title);
          moments.push(moment);
        }; 
      }
      // console.log('all moments: ', moments);
      callback(null, moments);
    }
  });

}

var getMomentsForUser = function(user, callback){
  getTweets(user, function(error, tweets){
    getInterestsFromTweets(user, tweets, function(error, interests){
      getMomentsFromInterests(user, interests, function(error, moments){
        callback({
          tweets: tweets,
          interests: interests,
          moments: moments
        });
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