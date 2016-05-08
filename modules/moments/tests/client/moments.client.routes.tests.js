(function () {
  'use strict';

  describe('Moments Route Tests', function () {
    // Initialize global variables
    var $scope,
      MomentsService;

    //We can start by loading the main application module
    beforeEach(module(ApplicationConfiguration.applicationModuleName));

    // The injector ignores leading and trailing underscores here (i.e. _$httpBackend_).
    // This allows us to inject a service but then attach it to a variable
    // with the same name as the service.
    beforeEach(inject(function ($rootScope, _MomentsService_) {
      // Set a new global scope
      $scope = $rootScope.$new();
      MomentsService = _MomentsService_;
    }));

    describe('Route Config', function () {
      describe('Main Route', function () {
        var mainstate;
        beforeEach(inject(function ($state) {
          mainstate = $state.get('moments');
        }));

        it('Should have the correct URL', function () {
          expect(mainstate.url).toEqual('/moments');
        });

        it('Should be abstract', function () {
          expect(mainstate.abstract).toBe(true);
        });

        it('Should have template', function () {
          expect(mainstate.template).toBe('<ui-view/>');
        });
      });

      describe('View Route', function () {
        var viewstate,
          MomentsController,
          mockMoment;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          viewstate = $state.get('moments.view');
          $templateCache.put('modules/moments/client/views/view-moment.client.view.html', '');

          // create mock Moment
          mockMoment = new MomentsService({
            _id: '525a8422f6d0f87f0e407a33',
            name: 'Moment Name'
          });

          //Initialize Controller
          MomentsController = $controller('MomentsController as vm', {
            $scope: $scope,
            momentResolve: mockMoment
          });
        }));

        it('Should have the correct URL', function () {
          expect(viewstate.url).toEqual('/:momentId');
        });

        it('Should have a resolve function', function () {
          expect(typeof viewstate.resolve).toEqual('object');
          expect(typeof viewstate.resolve.momentResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(viewstate, {
            momentId: 1
          })).toEqual('/moments/1');
        }));

        it('should attach an Moment to the controller scope', function () {
          expect($scope.vm.moment._id).toBe(mockMoment._id);
        });

        it('Should not be abstract', function () {
          expect(viewstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(viewstate.templateUrl).toBe('modules/moments/client/views/view-moment.client.view.html');
        });
      });

      describe('Create Route', function () {
        var createstate,
          MomentsController,
          mockMoment;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          createstate = $state.get('moments.create');
          $templateCache.put('modules/moments/client/views/form-moment.client.view.html', '');

          // create mock Moment
          mockMoment = new MomentsService();

          //Initialize Controller
          MomentsController = $controller('MomentsController as vm', {
            $scope: $scope,
            momentResolve: mockMoment
          });
        }));

        it('Should have the correct URL', function () {
          expect(createstate.url).toEqual('/create');
        });

        it('Should have a resolve function', function () {
          expect(typeof createstate.resolve).toEqual('object');
          expect(typeof createstate.resolve.momentResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(createstate)).toEqual('/moments/create');
        }));

        it('should attach an Moment to the controller scope', function () {
          expect($scope.vm.moment._id).toBe(mockMoment._id);
          expect($scope.vm.moment._id).toBe(undefined);
        });

        it('Should not be abstract', function () {
          expect(createstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(createstate.templateUrl).toBe('modules/moments/client/views/form-moment.client.view.html');
        });
      });

      describe('Edit Route', function () {
        var editstate,
          MomentsController,
          mockMoment;

        beforeEach(inject(function ($controller, $state, $templateCache) {
          editstate = $state.get('moments.edit');
          $templateCache.put('modules/moments/client/views/form-moment.client.view.html', '');

          // create mock Moment
          mockMoment = new MomentsService({
            _id: '525a8422f6d0f87f0e407a33',
            name: 'Moment Name'
          });

          //Initialize Controller
          MomentsController = $controller('MomentsController as vm', {
            $scope: $scope,
            momentResolve: mockMoment
          });
        }));

        it('Should have the correct URL', function () {
          expect(editstate.url).toEqual('/:momentId/edit');
        });

        it('Should have a resolve function', function () {
          expect(typeof editstate.resolve).toEqual('object');
          expect(typeof editstate.resolve.momentResolve).toEqual('function');
        });

        it('should respond to URL', inject(function ($state) {
          expect($state.href(editstate, {
            momentId: 1
          })).toEqual('/moments/1/edit');
        }));

        it('should attach an Moment to the controller scope', function () {
          expect($scope.vm.moment._id).toBe(mockMoment._id);
        });

        it('Should not be abstract', function () {
          expect(editstate.abstract).toBe(undefined);
        });

        it('Should have templateUrl', function () {
          expect(editstate.templateUrl).toBe('modules/moments/client/views/form-moment.client.view.html');
        });

        xit('Should go to unauthorized route', function () {

        });
      });

    });
  });
})();
