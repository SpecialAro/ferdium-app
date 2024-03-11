/* eslint-disable no-await-in-loop */
import { Octokit } from '@octokit/rest';
import fs from 'fs-extra';
import path from 'node:path';
import { userDataPath } from '../environment-remote';
import { ITheme } from '../models/Theme';
import { serverBase } from '../api/apiBase';

const octokit = new Octokit({});

const owner = 'specialaro';
const repo = 'ferdium-themes';
const branch = 'main';

const PATH_NAME = userDataPath('config', 'themes', 'testing');

const debug = require('../preload-safe-debug')('Ferdium:ThemesHelper');

export async function downloadThemeFromGit(directoryPath: string) {
  try {
    // Step 1: Get the contents of the directory from the repository
    debug('Downloading theme from git:', directoryPath);
    const { data: contents } = await octokit.repos.getContent({
      owner,
      repo,
      path: directoryPath,
      ref: branch,
    });

    // Step 2: Iterate through the contents
    for (const item of contents) {
      if (item.type === 'file') {
        // Step 3: Get the content of each file

        const { data: file } = await octokit.repos.getContent({
          owner,
          repo,
          path: item.path,
          ref: branch,
        });

        // Step 4: Write file to specified path
        const filePath = userDataPath('config', item.path);
        const fileContent = Buffer.from(file.content, 'base64').toString(
          'utf8',
        );
        await fs.mkdir(path.dirname(filePath), { recursive: true }); // Create directory recursively
        await fs.writeFile(filePath, fileContent);
      } else {
        // Step 5: Create directory
        const directoryPath = PATH_NAME + item.path;
        await fs.mkdir(directoryPath, { recursive: true });
        await downloadThemeFromGit(item.path);
      }
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function getAvailableThemesList(): Promise<ITheme[]> {
  try {
    debug('Fetching available themes', `${serverBase()}/themes`);
    const response = await fetch(`${serverBase()}/themes`);

    const data = await response.json();

    return data;
  } catch (error) {
    debug('Error fetching available themes:', error);
    return [];
  }
}
