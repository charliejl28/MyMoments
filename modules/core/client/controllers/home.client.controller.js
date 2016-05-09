(function () {
  'use strict';

  angular
    .module('core')
    .controller('HomeController', HomeController);

  HomeController.$inject = ['$scope', '$state', 'Authentication', 'menuService', 'MomentsService', '$http'];

  function HomeController($scope, $state, Authentication, menuService, Moments, $http) {
    var vm = this;

    vm.authentication = Authentication;
    vm.init = init;

    init();

    function init() {
    	if (vm.authentication.user) {
    		getMoments();
    	};
    }

    function getMoments() {
    	$http.get('/api/moments').success(function (response) {
        // If successful we assign the response to the global user model
	        vm.tweets = response.tweets;
	        vm.interests = response.interests;
	        vm.moments = response.moments;
	      }).error(function (response) {
	        vm.error = response.message;
      });
    }
  }
}());
