/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2013 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

/**
 * Provide the OnboardingView class.
 *
 * @module onboarding
 * @submodule views.onboarding
 */

YUI.add('juju-view-onboarding', function(Y) {

  var views = Y.namespace('juju.views');
  var onboardingIndex = 0;

  /**
   * The OnboardingView class.
   *
   * @class OnboardingView
   */
  var OnboardingView = Y.Base.create('OnboardingView', Y.View, [views.JujuBaseView], {
    template: views.Templates.onboarding,
    events: {
      '.onboarding-close': {click: 'closeHandler'},
      '.onboarding-start': {click: 'nextHandler'},
      '.onboarding-next': {click: 'nextHandler'}
    },

    /**
     * Onboarding event handler. When clicking the close button,
     * remove the onboarding and put the user back into the environment,
     *
     * @method closeHandler
     * @param {Object} ev An event object (with a "currentTarget" attribute).
     * @return {undefined} Mutates only.
     */
    closeHandler: function(ev) {
      ev.halt();
      var env = this.get('env');
      var container = this.get('container');
      console.log('closing');
      container.hide();
    },

    /**
     * Onboarding event handler. When clicking the next button,
     * update the index counter, and update to the next step of onboarding.
     *
     * @method nextHandler
     * @param {Object} ev An event object (with a "currentTarget" attribute).
     * @return {undefined} Mutates only.
     */
    nextHandler: function(ev) {
      ev.halt();
      onboardingIndex++;
      console.log('Next hit '+onboardingIndex);
      console.log(ev);

      var container = this.get('container');
      var container_bg = container.one('#onboarding-background');

      container_bg.removeClass('state-0');
      container_bg.removeClass('state-1');
      container_bg.removeClass('state-2');
      container_bg.removeClass('state-3');
      container_bg.addClass('state-'+onboardingIndex);

    },

    /**
     * Render the page.
     *
     * Reveal the mask element, and show the onboarding window.
     *
     * @method render
     * @return {undefined} Mutates only.
     */
    render: function() {
      // In order to have the mask cover everything, it needs to be an
      // immediate child of the body.  In order for it to render immediately
      // when the app loads, it needs to be in index.html.
      var onboarding = Y.one('body > #onboarding');
      if (!onboarding) {
        // No mask in the DOM, as is the case in tests.
        return this;
      }
      onboarding.show();
      var env = this.get('env');

      this.get('container').setHTML(this.template());
      return this;
    }

  });

  views.onboarding = OnboardingView;

}, '0.1.0', {
  requires: [
    'view',
    'juju-view-utils',
    'node'
  ]
});
