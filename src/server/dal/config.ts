import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'src', 'config', 'platform.json');

export interface PlatformConfig {
  betaModels: boolean;
  ssoEnforcement: boolean;
}

const DEFAULT_CONFIG: PlatformConfig = {
  betaModels: true,
  ssoEnforcement: false,
};

export async function getPlatformConfig(): Promise<PlatformConfig> {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, 'utf8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
    }
  } catch (e) {
    console.error('Failed to read platform config', e);
  }
  return DEFAULT_CONFIG;
}

export async function updatePlatformConfig(config: Partial<PlatformConfig>) {
  const current = await getPlatformConfig();
  const next = { ...current, ...config };

  // Ensure directory exists
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(CONFIG_PATH, JSON.stringify(next, null, 2), 'utf8');
  return next;
}
