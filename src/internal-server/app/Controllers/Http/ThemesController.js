const fs = require('fs-extra');
const path = require('node:path');

const Helpers = use('Helpers');
const { validateAll } = use('Validator');

const FERDIUM_THEMES_PATH = path.join(
  Helpers.appRoot(),
  '../',
  'ferdium-themes',
);

class ThemesController {
  // List official and custom recipes
  async list({ response }) {
    const officialThemes = fs.readJsonSync(
      path.join(FERDIUM_THEMES_PATH, 'all.json'),
    );

    return response.send(officialThemes);
  }

  // Download a theme
  async download({ response, params }) {
    // Validate user input
    const validation = await validateAll(params, {
      themeId: 'required|accepted',
    });
    if (validation.fails()) {
      return response.status(401).send({
        message: 'Please provide a theme ID',
        messages: validation.messages(),
        status: 401,
      });
    }

    const { themeId } = params;

    // Check for invalid characters
    if (/\.+/.test(themeId) || /\/+/.test(themeId)) {
      return response.send('Invalid theme name');
    }

    // Check if theme exists in theme folder
    const themePath = path.join(FERDIUM_THEMES_PATH, `${themeId}.tar.gz`);

    if (await fs.exists(themePath)) {
      return response.type('.tar.gz').send(await fs.readFile(themePath));
    }

    return response.status(400).send({
      message: 'Theme not found',
      code: 'theme-not-found',
    });
  }
}

module.exports = ThemesController;
