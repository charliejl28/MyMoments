(function () {
  'use strict';

  angular
    .module('moments')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('moments', {
        abstract: true,
        url: '/moments',
        template: '<ui-view/>'
      })
      .state('moments.list', {
        url: '',
        templateUrl: 'modules/moments/client/views/list-moments.client.view.html',
        controller: 'MomentsListController',
        controllerAs: 'vm',
        data: {
          pageTitle: 'Moments List'
        }
      })
      .state('moments.create', {
        url: '/create',
        templateUrl: 'modules/moments/client/views/form-moment.client.view.html',
        controller: 'MomentsController',
        controllerAs: 'vm',
        resolve: {
          momentResolve: newMoment
        },
        data: {
          roles: ['user', 'admin'],
          pageTitle : 'Moments Create'
        }
      })
      .state('moments.edit', {
        url: '/:momentId/edit',
        templateUrl: 'modules/moments/client/views/form-moment.client.view.html',
        controller: 'MomentsController',
        controllerAs: 'vm',
        resolve: {
          momentResolve: getMoment
        },
        data: {
          roles: ['user', 'admin'],
          pageTitle: 'Edit Moment {{ momentResolve.name }}'
        }
      })
      .state('moments.view', {
        url: '/:momentId',
        templateUrl: 'modules/moments/client/views/view-moment.client.view.html',
        controller: 'MomentsController',
        controllerAs: 'vm',
        resolve: {
          momentResolve: getMoment
        },
        data:{
          pageTitle: 'Moment {{ articleResolve.name }}'
        }
      });
  }

  getMoment.$inject = ['$stateParams', 'MomentsService'];

  function getMoment($stateParams, MomentsService) {
    return MomentsService.get({
      momentId: $stateParams.momentId
    }).$promise;
  }

  newMoment.$inject = ['MomentsService'];

  function newMoment(MomentsService) {
    return new MomentsService();
  }
})();
