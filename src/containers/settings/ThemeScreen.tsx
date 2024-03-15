import { Component, ReactElement } from 'react';
import { inject, observer } from 'mobx-react';
import { defineMessages, injectIntl, WrappedComponentProps } from 'react-intl';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  FormControl,
  FormControlLabel,
  IconButton,
  Radio,
  RadioGroup,
} from '@mui/material';
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
  radioShowAll: {
    id: 'settings.theme.radioShowAll',
    defaultMessage: 'Show all',
  },
  radioOnlyUpdates: {
    id: 'settings.theme.radioOnlyUpdates',
    defaultMessage: 'Only updates',
  },
  radioOnlyCustomThemes: {
    id: 'settings.theme.radioOnlyCustomThemes',
    defaultMessage: 'Only custom themes',
  },
});

interface ThemeScreenProps extends StoresProps, WrappedComponentProps {}

interface ThemeScreenState {
  search: string;
  activeSetttingsTab: string;
  isSearching: boolean;
  onlyCustomThemes: boolean;
  onlyUpdates: boolean;
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
      onlyCustomThemes: false,
      onlyUpdates: false,
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

    let filteredThemes = installedThemes;

    const devThemes = installedThemes.filter(
      theme => theme.isDev !== undefined,
    );

    if (
      this.state.onlyUpdates &&
      this.props.stores.themes.needsUpdate.length > 0
    ) {
      filteredThemes = this.props.stores.themes.needsUpdate;
    }

    if (this.state.onlyCustomThemes && devThemes.length > 0) {
      filteredThemes = devThemes;
    }

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

            {/* Filter */}
            {this.state.activeSetttingsTab === 'installed' &&
              (devThemes.length > 0 ||
                this.props.stores.themes.needsUpdate.length > 0) && (
                <FormControl
                  onChange={e => {
                    const { value } = e.target as HTMLInputElement;
                    this.setState({
                      onlyCustomThemes: value === 'custom',
                      onlyUpdates: value === 'updates',
                    });
                  }}
                  sx={{
                    height: 'fit-content',
                    width: '-webkit-fill-available',
                    marginBottom: '1.2rem',
                  }}
                >
                  <RadioGroup
                    aria-labelledby="demo-radio-buttons-group-label"
                    defaultValue="all"
                    name="radio-buttons-group"
                    sx={{
                      display: 'flex',
                      flexDirection: 'row',
                      gap: '1rem',
                      height: 'fit-content',
                      justifyContent: 'center',
                    }}
                  >
                    <FormControlLabel
                      value="all"
                      control={<Radio />}
                      label={intl.formatMessage(messages.radioShowAll)}
                    />
                    {this.props.stores.themes.needsUpdate.length > 0 && (
                      <FormControlLabel
                        value="updates"
                        control={<Radio />}
                        label={intl.formatMessage(messages.radioOnlyUpdates)}
                      />
                    )}
                    {devThemes.length > 0 && (
                      <FormControlLabel
                        value="custom"
                        control={<Radio />}
                        label={intl.formatMessage(
                          messages.radioOnlyCustomThemes,
                        )}
                      />
                    )}
                  </RadioGroup>
                </FormControl>
              )}

            {/* Installed */}
            {this.state.activeSetttingsTab === 'installed' && (
              <ThemeSelector
                {...this.props}
                themes={filteredThemes}
                searchTerm={this.state.search}
                activeSetttingsTab={this.state.activeSetttingsTab}
                hideDefaultTheme={
                  this.state.onlyCustomThemes || this.state.onlyUpdates
                }
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
