import { action, computed, makeObservable, observable } from 'mobx';

import { Dirent, ensureDir, readJSON, readdir, rmdir } from 'fs-extra';

import semver from 'semver';
import path from 'node:path';
import { Stores } from '../@types/stores.types';
import { ApiInterface } from '../api';
import { Actions } from '../actions/lib/actions';

import TypedStore from './lib/TypedStore';
import { ITheme } from '../models/Theme';
import { userDataThemesPath } from '../environment-remote';
import Request from './lib/Request';
import CachedRequest from './lib/CachedRequest';

const debug = require('../preload-safe-debug')('Ferdium:ThemesStore');

const THEMES_PATH = userDataThemesPath();

export default class ThemesStore extends TypedStore {
  @observable availableThemes: ITheme[] = [];

  @observable installedThemes: ITheme[] = [];

  @observable selectedTheme: ITheme | null = null;

  @observable isInstalling: boolean = false;

  @computed get needsUpdate(): ITheme[] {
    return this.installedThemes.filter(theme =>
      this.availableThemes.some(
        availableTheme =>
          availableTheme.id === theme.id &&
          availableTheme.version &&
          theme.version &&
          semver.gt(availableTheme.version, theme.version),
      ),
    );
  }

  @observable requestThemesRequest: CachedRequest = new CachedRequest(
    this.api.themes,
    'themes',
  );

  @observable downloadThemeRequest: Request = new Request(
    this.api.themes,
    'downloadTheme',
  );

  @computed get notInstalledThemes(): ITheme[] {
    return this.availableThemes.filter(
      theme =>
        !this.installedThemes.some(
          installedTheme => installedTheme.id === theme.id,
        ),
    );
  }

  constructor(stores: Stores, api: ApiInterface, actions: Actions) {
    super(stores, api, actions);

    makeObservable(this);

    // TODO: Reaction to auto-update themes. This is not working yet
    // autorun(() => {
    //   if (
    //     this.needsUpdate.length > 0
    //     // &&
    //     // this.stores.settings.all.app.autoUpdateThemes
    //   ) {
    //     this.updateAllThemes();
    //   }
    // });

    // Register action handlers
  }

  async setup(): Promise<void> {
    await this._loadThemes();
    await this.loadLocalThemes();
    await this._loadSelectedTheme();
  }

  // @action async updateAllThemes(): Promise<void> {
  //   for (const installedTheme of this.needsUpdate) {
  //     // eslint-disable-next-line no-await-in-loop
  //     await this.updateTheme(installedTheme);
  //   }
  // }

  @action async updateTheme(theme: ITheme): Promise<void> {
    await this.uninstallTheme(theme);
    await this.installTheme(theme);

    if (this.selectedTheme?.id === theme.id) {
      this.changeSelectedTheme(theme);
    }
  }

  @action async installTheme(theme: ITheme): Promise<void> {
    this.isInstalling = true;

    await this.downloadThemeRequest.execute(theme.id).promise;

    await this.loadLocalThemes();
    this.isInstalling = false;
  }

  @action async uninstallTheme(theme: ITheme): Promise<void> {
    const themePath = userDataThemesPath(
      theme.isDev ? `dev/${theme.id}` : theme.id,
    );
    await rmdir(themePath, { recursive: true });
    await this.loadLocalThemes();
  }

  @action async _loadSelectedTheme(): Promise<void> {
    const { selectedTheme } = this.stores.settings.all.app;

    if (selectedTheme && selectedTheme !== 'default') {
      this.selectedTheme =
        this.installedThemes.find(theme => theme.id === selectedTheme) || null;
      return;
    }

    this.selectedTheme = null;
  }

  @action async _loadThemes(): Promise<void> {
    // const data = this.requestThemesRequest.execute().result;
    debug('RUNNING!');

    debug('RUNNING!', this.requestThemesRequest);
    const data = await this.requestThemesRequest.execute().promise;
    if (data) {
      this.availableThemes = data;
    }
  }

  @action async loadLocalThemes(): Promise<void> {
    await ensureDir(THEMES_PATH);
    const themeFolders = await readdir(THEMES_PATH, { withFileTypes: true });

    this.installedThemes = [];

    let hasDev = themeFolders.some(folder => folder.name === 'dev');
    let devDir: Dirent[] = []; // Declare readDir here

    if (hasDev) {
      devDir = await readdir(userDataThemesPath('dev'), {
        withFileTypes: true,
      });
      hasDev = devDir.length > 0;
    } else {
      hasDev = false;
    }

    if (hasDev) {
      // eslint-disable-next-line unicorn/no-array-for-each
      devDir.forEach((folder: Dirent) => {
        // Explicitly define the type of folder
        if (folder.isFile()) return;

        themeFolders.push(folder);
      });
    }

    await Promise.all(
      themeFolders.map(async folder => {
        if (folder.isFile()) return;

        const isDev = path.basename(folder.path) === 'dev';

        const themePath = userDataThemesPath(
          isDev ? 'dev' : '',
          folder.name,
          'theme.json',
        );

        try {
          // For each folder in the themes directory, load the theme.json file and add it to the installed themes
          const theme = await readJSON(themePath);
          this.installedThemes.push({
            ...theme,
            isDev: isDev ? true : undefined,
          });
        } catch {
          debug('Error loading local theme', folder.name);
        }
      }),
    );

    debug('Installed themes loaded', this.installedThemes);
  }

  @action async changeSelectedTheme(theme: ITheme | null): Promise<void> {
    console.log('changeSelectedTheme', theme?.isDev);
    console.log(
      'changeSelectedTheme',
      theme ? (theme.isDev ? `dev/${theme.id}` : theme.id) : 'default',
    );
    this.actions!.settings.update({
      type: 'app',
      data: {
        selectedTheme: theme
          ? theme.isDev
            ? `dev/${theme.id}`
            : theme.id
          : 'default',
      },
    });
    this.actions.appearance.reload();
    this.selectedTheme = theme;
  }
}
