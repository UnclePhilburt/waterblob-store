import { existsSync, renameSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const apiDir = 'src/app/api';
const hiddenApiDir = 'src/app/_api_disabled_for_pages';

if (existsSync(hiddenApiDir)) {
  throw new Error(`${hiddenApiDir} already exists. Remove it before building Pages.`);
}

try {
  if (existsSync(apiDir)) {
    renameSync(apiDir, hiddenApiDir);
  }

  const result = spawnSync(
    'npx',
    ['next', 'build'],
    {
      stdio: 'inherit',
      shell: process.platform === 'win32',
      env: {
        ...process.env,
        GITHUB_PAGES: 'true',
        NEXT_PUBLIC_API_BASE_URL:
          process.env.NEXT_PUBLIC_API_BASE_URL || 'https://waterblob-store.onrender.com',
      },
    }
  );

  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
  }
} finally {
  if (existsSync(hiddenApiDir)) {
    renameSync(hiddenApiDir, apiDir);
  }
}
