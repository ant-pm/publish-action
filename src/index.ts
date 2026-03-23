import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';

async function run(): Promise<void> {
  try {
    const registryUrl = core.getInput('registry_url', { required: true });

    core.info('Requesting OIDC token...');
    const token = await core.getIDToken(registryUrl);

    const repo = process.env.GITHUB_REPOSITORY;
    if (!repo) {
      throw new Error('GITHUB_REPOSITORY environment variable is not set');
    }

    const archiveName = repo.replace('/', '-') + '.tar.gz';
    const archivePath = path.resolve(archiveName);

    if (!fs.existsSync(archivePath)) {
      throw new Error(`Archive not found: ${archivePath}`);
    }

    core.info(`Uploading ${archiveName} to ${registryUrl}/publish...`);
    const body = fs.readFileSync(archivePath);

    const response = await fetch(`${registryUrl}/publish`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/gzip',
      },
      body,
    });

    if (!response.ok) {
      const text = await response.text();
      core.setFailed(`Publish failed with status ${response.status}: ${text}`);
      return;
    }

    core.info('Package published successfully');
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('An unexpected error occurred');
    }
  }
}

run();
