(function () {
  'use strict';

  // Moments controller
  angular
    .module('moments')
    .controller('MomentsController', MomentsController);

  MomentsController.$inject = ['$scope', '$state', 'Authentication', 'momentResolve'];

  function MomentsController ($scope, $state, Authentication, moment) {
    var vm = this;

    vm.authentication = Authentication;
    vm.moment = moment;
    vm.error = null;
    vm.form = {};
    vm.remove = remove;
    vm.save = save;

    // Remove existing Moment
    function remove() {
      if (confirm('Are you sure you want to delete?')) {
        vm.moment.$remove($state.go('moments.list'));
      }
    }

    // Save Moment
    function save(isValid) {
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'vm.form.momentForm');
        return false;
      }

      // TODO: move create/update logic to service
      if (vm.moment._id) {
        vm.moment.$update(successCallback, errorCallback);
      } else {
        vm.moment.$save(successCallback, errorCallback);
      }

      function successCallback(res) {
        $state.go('moments.view', {
          momentId: res._id
        });
      }

      function errorCallback(res) {
        vm.error = res.data.message;
      }
    }
  }
})();
