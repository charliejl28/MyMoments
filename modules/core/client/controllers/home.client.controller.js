(function () {
  'use strict';

  angular
    .module('core')
    .controller('HomeController', HomeController);

  HomeController.$inject = ['$scope', '$state', 'Authentication', 'menuService'];

  function HomeController($scope, $state, Authentication, menuService) {
    var vm = this;

    vm.authentication = Authentication;
    vm.init = init;
    vm.tweets = [];
    vm.interests = [];
    vm.moments = [];

    init();

    function init() {
    	if (vm.authentication.user) {
    		getMoments();
    	};
    }

    function getMoments() {

    }
  }
}());
