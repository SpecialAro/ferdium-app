export default class ThemesApi {
  server: any;

  constructor(server: any) {
    this.server = server;
  }

  themes() {
    return this.server.getThemes();
  }

  downloadTheme(themeId: string) {
    return this.server.downloadTheme(themeId);
  }
}
