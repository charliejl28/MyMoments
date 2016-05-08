'use strict';

/**
 * Module dependencies
 */
var momentsPolicy = require('../policies/moments.server.policy'),
  moments = require('../controllers/moments.server.controller');

module.exports = function(app) {
  // Moments Routes
  app.route('/api/moments').all(momentsPolicy.isAllowed)
    .get(moments.list)
    .post(moments.create);

  app.route('/api/moments/:momentId').all(momentsPolicy.isAllowed)
    .get(moments.read)
    .put(moments.update)
    .delete(moments.delete);

  // Finish by binding the Moment middleware
  app.param('momentId', moments.momentByID);
};
