/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2015 Canonical Ltd.

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

YUI.add('deployment-summary', function() {

  juju.components.DeploymentSummary = React.createClass({

    propTypes: {
      jem: React.PropTypes.object.isRequired,
      env: React.PropTypes.object.isRequired,
      appSet: React.PropTypes.func.isRequired,
      createSocketURL: React.PropTypes.func.isRequired,
      deploymentStorage: React.PropTypes.object.isRequired,
      users: React.PropTypes.object.isRequired,
      autoPlaceUnits: React.PropTypes.func.isRequired,
      changeDescriptions: React.PropTypes.array.isRequired,
      changeState: React.PropTypes.func.isRequired,
      ecsClear: React.PropTypes.func.isRequired,
      ecsCommit: React.PropTypes.func.isRequired,
      getUnplacedUnitCount: React.PropTypes.func.isRequired,
      modelCommitted: React.PropTypes.bool.isRequired,
      modelName: React.PropTypes.string.isRequired,
      numberOfChanges: React.PropTypes.number.isRequired
    },

    /**
      Close the summary.

      @method _close
    */
    _close: function() {
      this.props.changeState({
        sectionC: {
          component: null,
          metadata: {}
        }
      });
    },

    /**
      Handles calling to clear the ecs and then closing the deployment
      summary.

      @method _handleClear
    */
    _handleClear: function() {
      this.props.ecsClear();
      this._close();
    },

    /**
      Navigate to the choose cloud step.

      @method _handleChangeCloud
    */
    _handleChangeCloud: function() {
      this.props.changeState({
        sectionC: {
          component: 'deploy',
          metadata: {
            activeComponent: 'choose-cloud'
          }
        }
      });
    },

    /**
      Handle committing when the deploy button in the summary is clicked.

      @method _handleDeploy
    */
    _handleDeploy: function() {
      this.props.autoPlaceUnits();
      // The env is already bound to ecsCommit in app.js.
      // Generates an alphanumeric string
      var randomString = () => Math.random().toString(36).slice(2);
      var password = randomString() + randomString();
      this.props.jem.newEnvironment(
        this.props.users.jem.user,
        this.refs.modelName.value,
        this.props.deploymentStorage.templateName,
        // XXX Hardcoding the controller for now but it will be provided on load
        'yellow/aws-eu-central',
        password,
        (error, data) => {
          if (error) throw error;
          var pathParts = data['host-ports'][0].split(':');
          // Set the credentials in the env so that the GUI
          // is able to connect to the new model.
          this.props.env.setCredentials({
            user: 'user-' + data.user,
            password: data.password
          });
          var socketURL = this.props.createSocketURL(
            pathParts[0], // server
            pathParts[1], // port
            data.uuid
          );
          // Set the socket url in both the app and the env so we don't end
          // up with any confusion later on about which is which.
          this.props.appSet('socket_url', socketURL);
          this.props.env.set('socket_url', socketURL);
          this.props.env.connect();
          // After the model connects it will emit a login event, listen
          // for that event so that we know when to commit the changeset.
          this.props.env.on('login', (data) => {
            this.props.ecsCommit();
            this.setState({hasCommits: true}, () => {
              this._close();
            });
          });
        });
    },

    /**
      Handle navigating to the machine view.

      @method _handleViewMachinesClick
    */
    _handleViewMachinesClick: function() {
      this.props.changeState({
        sectionB: {
          component: 'machine',
          metadata: {}
        },
        sectionC: {
          component: null,
          metadata: {}
        }
      });
    },

    /**
      Generate the list of change items.

      @method _generateChangeItems
      @returns {Array} The collection of changes.
    */
    _generateChangeItems: function() {
      var changeList = this.props.changeDescriptions;
      var changes = [];
      changeList.forEach(function(change, i) {
        changes.push(
          <juju.components.DeploymentSummaryChangeItem
            key={i}
            change={change} />
          );
      }, this);
      return changes;
    },

    /**
      Generate a message if there are unplaced units.

      @method _generatePlacement
      @returns {Object} The placement markup.
    */
    _generatePlacement: function() {
      var unplacedCount = this.props.getUnplacedUnitCount();
      if (unplacedCount === 0) {
        return;
      }
      var plural = unplacedCount === 1 ? '' : 's';
      return (
        <div className="deployment-summary__placement twelve-col">
          <span>
            You have {unplacedCount.toString()} unplaced unit{plural} which will
            be automatically placed.
          </span>
          <span className="link" tabIndex="0" role="button"
            onClick={this._handleViewMachinesClick}>
            View machines
          </span>
        </div>);
    },

    /**
      Generate a clear changes control when showing the commit flow.

      @method _generateClearChanges
      @returns {Object} The clear changes control.
    */
    _generateClearChanges: function() {
      var modelCommitted = this.props.modelCommitted;
      // Don't show the clear changes control if we're deploying the model for
      // the first time.
      if (!modelCommitted) {
        return;
      }
      return (
        <span className="link deployment-panel__section-title-link"
          onClick={this._handleClear}
          role="button"
          tabIndex="0">
          Clear all changes&nbsp;&rsaquo;
        </span>);
    },

    render: function() {
      var listHeaderClassName = 'deployment-summary-change-item ' +
          'deployment-summary__list-header';
      var buttons = [];
      var modelCommitted = this.props.modelCommitted;
      if (!modelCommitted) {
        buttons.push({
          action: this._handleChangeCloud,
          title: 'Change cloud',
          type: 'inline-neutral'
        });
      }
      buttons.push({
        title: modelCommitted ? 'Commit' : 'Deploy',
        action: this._handleDeploy,
        disabled: this.props.numberOfChanges === 0,
        type: 'inline-positive'
      });
      return (
        <div className="deployment-panel__child">
          <juju.components.DeploymentPanelContent
            title="Deployment summary">
            <div className="deployment-panel__notice twelve-col">
              <juju.components.SvgIcon
                name="general-action-blue"
                size="16" />
              This deployment is free, you can deploy xxxxxxxxx more
            </div>
            <form className="six-col">
              <p>Name your model</p>
              <label className="deployment-panel__label"
                htmlFor="model-name">
                Model name
              </label>
              <input className="deployment-panel__input"
                defaultValue={this.props.modelName}
                id="model-name"
                placeholder="test_model_01"
                ref="modelName"
                required="required"
                type="text" />
            </form>
            <div className="six-col last-col">
              <p>Deploying to:</p>
              <div className="deployment-panel__box">
                [selected credential]
              </div>
            </div>
            {this._generatePlacement()}
            <h3 className="deployment-panel__section-title">
              Change log ({this.props.numberOfChanges})
              {this._generateClearChanges()}
            </h3>
            <ul className="deployment-summary__list">
              <li className={listHeaderClassName}>
                <span className="deployment-summary-change-item__change">
                  Change
                </span>
                <span className="deployment-summary-change-item__time">
                  Time
                </span>
              </li>
              {this._generateChangeItems()}
            </ul>
          </juju.components.DeploymentPanelContent>
          <juju.components.DeploymentPanelFooter
            buttons={buttons} />
        </div>
      );
    }
  });

}, '0.1.0', { requires: [
  'deployment-panel-content',
  'deployment-panel-footer',
  'deployment-summary-change-item',
  'svg-icon'
]});
