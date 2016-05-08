'use strict';

describe('Moments E2E Tests:', function () {
  describe('Test Moments page', function () {
    it('Should report missing credentials', function () {
      browser.get('http://localhost:3001/moments');
      expect(element.all(by.repeater('moment in moments')).count()).toEqual(0);
    });
  });
});
