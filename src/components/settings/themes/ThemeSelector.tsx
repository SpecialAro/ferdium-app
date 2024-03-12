import { useEffect, useState } from 'react';
import {
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
import InstallDesktopIcon from '@mui/icons-material/InstallDesktop';
import InfoIcon from '@mui/icons-material/Info';
import DeleteForeverOutlinedIcon from '@mui/icons-material/DeleteForeverOutlined';
import UpgradeIcon from '@mui/icons-material/Upgrade';
import { WrappedComponentProps } from 'react-intl';
import { observer } from 'mobx-react';
import { ITheme } from '../../../models/Theme';
import { StoresProps } from '../../../@types/ferdium-components.types';

interface MediaPProps extends StoresProps, WrappedComponentProps {
  themes: ITheme[];
  searchTerm: string;
  activeSetttingsTab: string;
}

const debug = require('../../../preload-safe-debug')('Ferdium:ThemeSelector');

const DIALOG_HEIGHT = 600;

function ThemeSelector(props: MediaPProps) {
  const { themes: initThemes, searchTerm, stores, activeSetttingsTab } = props;

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

  return (
    <>
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
        {showingInstalledThemes && page === 1 && (
          <Card
            key="default"
            className={`card ${selectedTheme === null ? 'selected' : ''}`}
          >
            <div
              onClick={() => handleThemeClick(null)}
              onKeyDown={() => handleThemeClick(null)}
              role="button"
              tabIndex={0}
            >
              <CardHeader
                title="Default Theme"
                // subheader={theme.version}
                sx={{ height: 'min-content' }}
              />
            </div>
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
                <CardHeader
                  title={theme.name}
                  subheader={`${theme.version}${updateTheme ? ` -> ${newVersion?.version}` : ''}`}
                  sx={{ height: 'min-content' }}
                />
                <CardMedia
                  component="img"
                  height="100"
                  src={theme.preview ?? 'https://via.placeholder.com/150'}
                  alt={theme.name}
                />
              </div>
              <CardActions sx={{ justifyContent: 'center' }}>
                {updateTheme && (
                  <IconButton
                    aria-label="update"
                    onClick={() => handleUpdateClick(theme)}
                  >
                    <UpgradeIcon />
                  </IconButton>
                )}
                <IconButton
                  aria-label="install"
                  onClick={() => handleInstallClick(theme)}
                >
                  {showingInstalledThemes ? (
                    <DeleteForeverOutlinedIcon />
                  ) : (
                    <InstallDesktopIcon />
                  )}
                </IconButton>
                <IconButton
                  aria-label="info"
                  onClick={() => handleInfoClick(theme)}
                >
                  <InfoIcon />
                </IconButton>
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
            {themeForDialog?.name}
            <div>
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
                  <DeleteForeverOutlinedIcon />
                ) : (
                  <InstallDesktopIcon />
                )}
              </IconButton>
            </div>
          </div>
        </DialogTitle>
        <DialogContent>
          {/* Display specific data for the selected theme here */}
          <CardMedia
            component="img"
            height="300"
            src={themeForDialog?.preview ?? 'https://via.placeholder.com/150'}
            alt={themeForDialog?.name}
          />
          <p>Version: {themeForDialog?.version}</p>
          <p>{themeForDialog?.description}</p>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default observer(ThemeSelector);
