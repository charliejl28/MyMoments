//Moments service used to communicate Moments REST endpoints
(function () {
  'use strict';

  angular
    .module('moments')
    .factory('MomentsService', MomentsService);

  MomentsService.$inject = ['$resource'];

  function MomentsService($resource) {
    return $resource('api/moments/:momentId', {
      momentId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
})();
