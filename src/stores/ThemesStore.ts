import { action, computed, makeObservable, observable } from 'mobx';

import { ensureDir, readJSON, readdir, rmdir } from 'fs-extra';

import { Stores } from '../@types/stores.types';
import { ApiInterface } from '../api';
import { Actions } from '../actions/lib/actions';

import TypedStore from './lib/TypedStore';
import { ITheme } from '../models/Theme';
import { userDataPath } from '../environment-remote';
import { downloadThemeFromGit } from '../helpers/themes-helpers';
import CachedRequest from './lib/CachedRequest';

const debug = require('../preload-safe-debug')('Ferdium:ThemesStore');

const THEMES_PATH = userDataPath('config', 'themes');

export default class ThemesStore extends TypedStore {
  @observable availableThemes: ITheme[] = [];

  @observable installedThemes: ITheme[] = [];

  @observable selectedTheme: ITheme | null = null;

  @observable isInstalling: boolean = false;

  @observable requestThemesRequest: CachedRequest = new CachedRequest(
    this.api.themes,
    'themes',
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

    // Register action handlers
  }

  async setup(): Promise<void> {
    await this._loadThemes();
    await this.loadLocalThemes();
    await this._loadSelectedTheme();
  }

  @action async installTheme(theme: ITheme): Promise<void> {
    this.isInstalling = true;
    const themePath = userDataPath('config', 'themes', theme.id);

    try {
      const GITHUB_BASE_PATH = `themes/${theme.id}`;
      await ensureDir(themePath);

      // Fetch the data from URL
      await downloadThemeFromGit(GITHUB_BASE_PATH);
    } catch (error) {
      await rmdir(themePath);
      debug('Error installing theme', error);
    }

    await this.loadLocalThemes();
    this.isInstalling = false;
  }

  @action async uninstallTheme(theme: ITheme): Promise<void> {
    const themePath = userDataPath('config', 'themes', theme.id);
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

    await Promise.all(
      themeFolders.map(async folder => {
        if (folder.isFile()) return;

        const themePath = userDataPath(
          'config',
          'themes',
          folder.name,
          'theme.json',
        );
        try {
          // For each folder in the themes directory, load the theme.json file and add it to the installed themes
          const theme = await readJSON(themePath);
          this.installedThemes.push(theme);
        } catch {
          debug('Error loading local theme', folder.name);
        }
      }),
    );

    debug('Installed themes loaded', this.installedThemes);
  }

  @action async changeSelectedTheme(theme: ITheme | null): Promise<void> {
    this.actions!.settings.update({
      type: 'app',
      data: {
        selectedTheme: theme ? theme.id : 'default',
      },
    });
    this.actions.appearance.reload();
    this.selectedTheme = theme;
  }
}
