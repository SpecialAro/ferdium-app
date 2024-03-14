import { Component, ReactElement } from 'react';
import { inject, observer } from 'mobx-react';
import { defineMessages, injectIntl, WrappedComponentProps } from 'react-intl';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import { Box, IconButton } from '@mui/material';
import { StoresProps } from '../../@types/ferdium-components.types';
import ErrorBoundary from '../../components/util/ErrorBoundary';

import { H1, H5 } from '../../components/ui/headline';
import Input from '../../components/ui/input';
import ThemeSelector from '../../components/settings/themes/ThemeSelector';

// const debug = require('../../preload-safe-debug')('Ferdium:ThemeScreen');

const messages = defineMessages({
  themesHeader: {
    id: 'settings.theme.themesHeader',
    defaultMessage: 'Themes Marketplace',
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
  isSearching: boolean;
}

@inject('stores', 'actions')
@observer
class ThemeScreen extends Component<ThemeScreenProps, ThemeScreenState> {
  constructor(props) {
    super(props);

    this.state = {
      search: '',
      activeSetttingsTab: 'installed',
      isSearching: false,
    };

    this.props.stores.themes.setup();
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
            {this.state.isSearching ? (
              <Box
                sx={{
                  display: 'flex',
                  height: 'min-content',
                  position: 'relative',
                  justifyContent: 'flex-end',
                  gap: '1rem',
                }}
              >
                <Input
                  placeholder="Search"
                  value={this.state.search}
                  onChange={e => {
                    this.setState({ search: e.target.value });
                  }}
                  className="search-input--themes"
                />
                <IconButton
                  onClick={() =>
                    this.setState({ search: '', isSearching: false })
                  }
                  type="button"
                >
                  <ClearIcon />
                </IconButton>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <H1>{intl.formatMessage(messages.themesHeader)}</H1>
                <IconButton
                  onClick={() => this.setState({ isSearching: true })}
                  type="button"
                >
                  <SearchIcon />
                </IconButton>
              </Box>
            )}
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
                {intl.formatMessage(messages.headlineInstalled)} (
                {installedThemes.length})
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
                {intl.formatMessage(messages.headlineNotInstalled)} (
                {notInstalledThemes.length})
              </H5>
            </div>

            {/* Themes */}

            {/* Installed */}
            {this.state.activeSetttingsTab === 'installed' && (
              <ThemeSelector
                {...this.props}
                themes={installedThemes}
                searchTerm={this.state.search}
                activeSetttingsTab={this.state.activeSetttingsTab}
              />
            )}

            {/* Not installed */}
            {this.state.activeSetttingsTab === 'not-installed' && (
              <ThemeSelector
                {...this.props}
                themes={notInstalledThemes}
                searchTerm={this.state.search}
                activeSetttingsTab={this.state.activeSetttingsTab}
              />
            )}

            {/* Updates */}
            {/* {this.state.activeSetttingsTab === 'updates' && (
              <ThemeSelector
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
