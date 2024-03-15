import { ReactElement, useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardActions,
  CardHeader,
  CardMedia,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Pagination,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InstallDesktopIcon from '@mui/icons-material/InstallDesktop';
import InfoIcon from '@mui/icons-material/Info';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import DeleteForeverOutlinedIcon from '@mui/icons-material/DeleteForeverOutlined';
import UpgradeIcon from '@mui/icons-material/Upgrade';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { WrappedComponentProps, defineMessages, injectIntl } from 'react-intl';
import { observer } from 'mobx-react';
import { ITheme } from '../../../models/Theme';
import { StoresProps } from '../../../@types/ferdium-components.types';
import { H1 } from '../../ui/headline';
import { openPath } from '../../../helpers/url-helpers';
import { userDataThemesPath } from '../../../environment-remote';
import Tooltip from '../../ui/Tooltip/Tooltip';

interface MediaPProps extends StoresProps, WrappedComponentProps {
  themes: ITheme[];
  searchTerm: string;
  activeSetttingsTab: string;
}

const debug = require('../../../preload-safe-debug')('Ferdium:ThemeSelector');

const DIALOG_HEIGHT = 600;

const messages = defineMessages({
  defaultTheme: {
    id: 'settings.theme.defaultTheme',
    defaultMessage: 'Default',
  },
  customTheme: {
    id: 'settings.theme.dev',
    defaultMessage: 'Custom theme',
  },
  tooltipThemeFolder: {
    id: 'settings.theme.tooltip.themeFolder',
    defaultMessage: 'Go to folder',
  },
  tooltipInstall: {
    id: 'settings.theme.tooltip.tooltipInstall',
    defaultMessage: 'Install',
  },
  tooltipUninstall: {
    id: 'settings.theme.tooltip.tooltipUninstall',
    defaultMessage: 'Uninstall',
  },
  tooltipClose: {
    id: 'settings.theme.tooltip.tooltipClose',
    defaultMessage: 'Close',
  },
  tooltipUpdate: {
    id: 'settings.theme.tooltip.tooltipUpdate',
    defaultMessage: 'Update',
  },
  tooltipDetails: {
    id: 'settings.theme.tooltip.tooltipDetails',
    defaultMessage: 'More details',
  },
});

function ThemeSelector(props: MediaPProps) {
  const {
    themes: initThemes,
    searchTerm,
    stores,
    activeSetttingsTab,
    intl,
  } = props;

  const { selectedTheme, needsUpdate } = stores.themes;

  const showingInstalledThemes = activeSetttingsTab === 'installed';

  let themes = initThemes;

  if (searchTerm) {
    themes = initThemes.filter(theme => {
      return theme.name.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }

  const itemsPerPage = 6;
  const pageCount = Math.ceil(themes.length / itemsPerPage);

  const [page, setPage] = useState(1);

  // biome-ignore lint/correctness/useExhaustiveDependencies:
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setPage(value);
  };

  const start = (page - 1) * itemsPerPage;

  const end = start + itemsPerPage;

  const currentThemes = themes.slice(start, end);

  const [themeForDialog, setThemeForDialog] = useState<ITheme | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleInfoClick = (theme: ITheme) => {
    setThemeForDialog(theme);
    setDialogOpen(true);
  };

  const handleThemeClick = (theme: ITheme | null) => {
    if (!showingInstalledThemes && theme) {
      handleInfoClick(theme);
      return;
    }

    stores.themes.changeSelectedTheme(theme);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleInstallClick = (theme: ITheme) => {
    debug('Install theme:', showingInstalledThemes);
    if (showingInstalledThemes) {
      if (selectedTheme?.id === theme.id) {
        stores.themes.changeSelectedTheme(null);
      }

      stores.themes.uninstallTheme(theme);
      return;
    }

    stores.themes.installTheme(theme);
  };

  const handleUpdateClick = (theme: ITheme) => {
    stores.themes.updateTheme(theme);
  };

  const parseInfo = (theme: ITheme | null) => {
    if (!theme) return null;
    const keys = Object.keys(theme);

    // Keys to display (order matters)
    const themeKeys = ['isDev', 'version', 'author'];

    const filteredKeys = keys.filter(key => themeKeys.includes(key));

    // Order filterKeys in the same order as themeKeys
    filteredKeys.sort((a, b) => {
      return themeKeys.indexOf(a) - themeKeys.indexOf(b);
    });

    const element: ReactElement[] = [];
    for (const [index, key] of filteredKeys.entries()) {
      if (
        theme[key] !== '' &&
        theme[key] !== null &&
        theme[key] !== undefined
      ) {
        // if the last element, don't add a separator

        const addSeparator = index !== filteredKeys.length - 1;
        let elementToAdd = <span key={index}>{theme[key]}</span>;

        if (key === 'isDev') {
          elementToAdd = (
            <span
              key={index}
              style={{ fontWeight: 'bolder', fontStyle: 'italic' }}
            >
              {theme[key] ? intl.formatMessage(messages.customTheme) : ''}
            </span>
          );
        }

        element.push(elementToAdd);

        if (addSeparator) {
          element.push(<span key={index}>|</span>);
        }
      }
    }

    return element.map(el => {
      return el;
    });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        height: 'min-content',
      }}
    >
      {pageCount !== 0 && (
        <Pagination
          count={pageCount}
          page={page}
          onChange={handlePageChange}
          color="primary"
          className="pagination"
        />
      )}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          height: 'min-content',
          justifyContent: 'center',
        }}
      >
        {showingInstalledThemes && page === 1 && searchTerm === '' && (
          <Card
            key="default"
            className={`card ${selectedTheme === null ? 'selected' : ''}`}
            sx={{ height: 224, width: 160 }}
          >
            <Box
              onClick={() => handleThemeClick(null)}
              onKeyDown={() => handleThemeClick(null)}
              role="button"
              tabIndex={0}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <CardHeader
                title={intl.formatMessage(messages.defaultTheme)}
                sx={{ height: 'min-content' }}
              />
              <img
                src="./assets/images/logo.svg"
                width={50}
                alt="Ferdium logo"
              />
            </Box>
          </Card>
        )}
        {currentThemes.map(theme => {
          const newVersion = stores.themes.availableThemes.find(
            t => t.id === theme.id,
          );
          const updateTheme = needsUpdate.some(t => t.id === theme.id);
          return (
            <Card
              key={theme.id}
              className={`card ${theme.id === selectedTheme?.id ? 'selected' : ''}`}
            >
              <div
                onClick={() => handleThemeClick(theme)}
                onKeyDown={() => handleThemeClick(theme)}
                role="button"
                tabIndex={0}
              >
                <Box style={{ display: 'flex', gap: '1rem' }}>
                  <CardHeader
                    title={theme.name}
                    subheader={
                      theme.version
                        ? `${theme.version}${updateTheme ? ` -> ${newVersion?.version}` : ''}`
                        : null
                    }
                    sx={{ height: 'min-content' }}
                  />
                  <Box style={{ padding: 16 }}>
                    {theme.isDev ? (
                      <Tooltip
                        title={
                          <span style={{ fontSize: '1.3rem' }}>
                            {intl.formatMessage(messages.customTheme)}
                          </span>
                        }
                        arrow
                        placement="bottom"
                      >
                        <AutoAwesomeIcon color="warning" />
                      </Tooltip>
                    ) : undefined}
                  </Box>
                </Box>

                {theme.preview && (
                  <CardMedia
                    component="img"
                    className="theme-preview--small"
                    src={theme.preview}
                    alt={theme.name}
                  />
                )}
              </div>
              <CardActions sx={{ justifyContent: 'center' }}>
                {updateTheme && (
                  <Tooltip
                    title={
                      <span style={{ fontSize: '1.3rem' }}>
                        {intl.formatMessage(messages.tooltipUpdate)}
                      </span>
                    }
                    arrow
                    placement="top"
                  >
                    <IconButton
                      aria-label="update"
                      onClick={() => handleUpdateClick(theme)}
                    >
                      <UpgradeIcon color="success" />
                    </IconButton>
                  </Tooltip>
                )}
                {theme.isDev && (
                  <Tooltip
                    title={
                      <span style={{ fontSize: '1.3rem' }}>
                        {intl.formatMessage(messages.tooltipThemeFolder)}
                      </span>
                    }
                    arrow
                    placement="top"
                  >
                    <IconButton
                      aria-label="open folder"
                      onClick={() =>
                        openPath(userDataThemesPath(`dev/${theme.id}`))
                      }
                    >
                      <DriveFileMoveIcon color="warning" />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip
                  title={
                    <span style={{ fontSize: '1.3rem' }}>
                      {showingInstalledThemes
                        ? intl.formatMessage(messages.tooltipUninstall)
                        : intl.formatMessage(messages.tooltipInstall)}
                    </span>
                  }
                  arrow
                  placement="top"
                >
                  <IconButton
                    aria-label="install"
                    onClick={() => handleInstallClick(theme)}
                  >
                    {showingInstalledThemes ? (
                      <DeleteForeverOutlinedIcon color="error" />
                    ) : (
                      <InstallDesktopIcon color="success" />
                    )}
                  </IconButton>
                </Tooltip>
                <Tooltip
                  title={
                    <span style={{ fontSize: '1.3rem' }}>
                      {intl.formatMessage(messages.tooltipDetails)}
                    </span>
                  }
                  arrow
                  placement="top"
                >
                  <IconButton
                    aria-label="info"
                    onClick={() => handleInfoClick(theme)}
                  >
                    <InfoIcon color="info" />
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          );
        })}
      </div>

      {/* Dialog for Theme Info */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        className="dialog"
        sx={{
          zIndex: 10_000,
          height: DIALOG_HEIGHT,
          alignSelf: 'center',
          top: -DIALOG_HEIGHT * 2,
        }}
        scroll="paper"
      >
        <DialogTitle>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              {themeForDialog?.isDev ? (
                <Box
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: '1rem',
                    alignItems: 'center',
                  }}
                >
                  <AutoAwesomeIcon
                    color="warning"
                    sx={{ marginBottom: '10px', fontSize: '1.2rem' }}
                  />

                  <H1>{themeForDialog?.name}</H1>
                </Box>
              ) : (
                <H1>{themeForDialog?.name}</H1>
              )}

              <Box
                sx={{ display: 'flex', flexDirection: 'row', gap: '0.6rem' }}
              >
                {parseInfo(themeForDialog)}
              </Box>
            </Box>
            <div>
              {themeForDialog?.isDev && (
                <Tooltip
                  title={
                    <span style={{ fontSize: '1.3rem' }}>
                      {intl.formatMessage(messages.tooltipThemeFolder)}
                    </span>
                  }
                  arrow
                  placement="bottom"
                >
                  <IconButton
                    aria-label="open folder"
                    onClick={() =>
                      openPath(userDataThemesPath(`dev/${themeForDialog.id}`))
                    }
                  >
                    <DriveFileMoveIcon color="warning" />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip
                title={
                  <span style={{ fontSize: '1.3rem' }}>
                    {showingInstalledThemes
                      ? intl.formatMessage(messages.tooltipUninstall)
                      : intl.formatMessage(messages.tooltipInstall)}
                  </span>
                }
                arrow
                placement="bottom"
              >
                <IconButton
                  aria-label="install/uninstall"
                  onClick={() => {
                    if (themeForDialog) {
                      handleInstallClick(themeForDialog);
                      handleCloseDialog();
                    }
                  }}
                >
                  {showingInstalledThemes ? (
                    <DeleteForeverOutlinedIcon color="error" />
                  ) : (
                    <InstallDesktopIcon color="success" />
                  )}
                </IconButton>
              </Tooltip>
              <Tooltip
                title={
                  <span style={{ fontSize: '1.3rem' }}>
                    {intl.formatMessage(messages.tooltipClose)}
                  </span>
                }
                arrow
                placement="bottom"
              >
                <IconButton
                  aria-label="close"
                  onClick={() => {
                    handleCloseDialog();
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            </div>
          </div>
        </DialogTitle>
        <DialogContent>
          {themeForDialog?.preview && (
            <CardMedia
              className="theme-preview--info"
              component="img"
              src={themeForDialog?.preview}
              alt={themeForDialog?.name}
            />
          )}
          <Box
            sx={{
              marginTop: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              height: 'fit-content',
              textAlign: 'justify',
            }}
          >
            {themeForDialog?.description && (
              <p>{themeForDialog?.description}</p>
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default injectIntl(observer(ThemeSelector));
