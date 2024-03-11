import { Component, ReactElement } from 'react';
import { inject, observer } from 'mobx-react';
import { defineMessages, injectIntl, WrappedComponentProps } from 'react-intl';
import { StoresProps } from '../../@types/ferdium-components.types';
import ErrorBoundary from '../../components/util/ErrorBoundary';

import { H1, H5 } from '../../components/ui/headline';
import Input from '../../components/ui/input';
import MediaP from '../../components/settings/themes/MediaP';

const debug = require('../../preload-safe-debug')('Ferdium:ThemeScreen');

const messages = defineMessages({
  themesHeader: {
    id: 'settings.theme.themesHeader',
    defaultMessage: 'Theme Marketplace',
  },
  installedSection: {
    id: 'settings.theme.installedSection',
    defaultMessage: 'Installed',
  },
  notInstalledSection: {
    id: 'settings.theme.notInstalledSection',
    defaultMessage: 'Not installed',
  },
  headlineInstalled: {
    id: 'settings.theme.headlineInstalled',
    defaultMessage: 'Installed',
  },
  headlineNotInstalled: {
    id: 'settings.theme.headlineNotInstalled',
    defaultMessage: 'Not installed',
  },
});

interface ThemeScreenProps extends StoresProps, WrappedComponentProps {}

interface ThemeScreenState {
  search: string;
  activeSetttingsTab: string;
}

@inject('stores', 'actions')
@observer
class ThemeScreen extends Component<ThemeScreenProps, ThemeScreenState> {
  constructor(props) {
    super(props);

    this.state = {
      search: '',
      activeSetttingsTab: 'installed',
    };
  }

  setActiveSettingsTab(tab) {
    this.setState({
      activeSetttingsTab: tab,
    });
  }

  render(): ReactElement {
    const { intl } = this.props;

    const { installedThemes, notInstalledThemes } = this.props.stores.themes;

    return (
      <ErrorBoundary>
        <div className="settings__main">
          <div className="settings__header">
            <H1>{intl.formatMessage(messages.themesHeader)}</H1>
          </div>
          <div className="settings__body">
            {/* Titles */}
            <div className="recipes__navigation">
              <H5
                id="installed"
                className={
                  this.state.activeSetttingsTab === 'installed'
                    ? 'badge badge--primary'
                    : 'badge'
                }
                onClick={() => {
                  this.setActiveSettingsTab('installed');
                }}
              >
                {intl.formatMessage(messages.headlineInstalled)}
              </H5>
              <H5
                id="not-installed"
                className={
                  this.state.activeSetttingsTab === 'not-installed'
                    ? 'badge badge--primary'
                    : 'badge'
                }
                onClick={() => {
                  this.setActiveSettingsTab('not-installed');
                }}
              >
                {intl.formatMessage(messages.headlineNotInstalled)}
              </H5>
              <div
                style={{
                  height: 'min-content',
                  position: 'relative',
                }}
              >
                <Input
                  placeholder="Search"
                  onChange={e => {
                    this.setState({ search: e.target.value });
                  }}
                />
              </div>
            </div>

            {/* Themes */}

            {/* Installed */}
            {this.state.activeSetttingsTab === 'installed' && (
              <MediaP
                {...this.props}
                themes={installedThemes}
                searchTerm={this.state.search}
                activeSetttingsTab={this.state.activeSetttingsTab}
              />
            )}

            {/* Not installed */}
            {this.state.activeSetttingsTab === 'not-installed' && (
              <MediaP
                {...this.props}
                themes={notInstalledThemes}
                searchTerm={this.state.search}
                activeSetttingsTab={this.state.activeSetttingsTab}
              />
            )}

            {/* Updates */}
            {/* {this.state.activeSetttingsTab === 'updates' && (
              <MediaP
                themes={notInstalledThemes}
                searchTerm={this.state.search}
              />
            )} */}
          </div>
        </div>
      </ErrorBoundary>
    );
  }
}

export default injectIntl(ThemeScreen);
