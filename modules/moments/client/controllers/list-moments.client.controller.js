(function () {
  'use strict';

  angular
    .module('moments')
    .controller('MomentsListController', MomentsListController);

  MomentsListController.$inject = ['MomentsService'];

  function MomentsListController(MomentsService) {
    var vm = this;

    vm.moments = MomentsService.query();
  }
})();
