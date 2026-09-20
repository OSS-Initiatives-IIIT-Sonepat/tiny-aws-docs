import fs from "node:fs";
import path from "node:path";
import type { SyncConfig } from "./types";
import { getConfigPath } from "./paths";
import { validateSyncConfig } from "./validate-config";

export function configExists(rootDir: string) {
  return fs.existsSync(getConfigPath(rootDir));
}

export function loadSyncConfig(rootDir: string): SyncConfig {
  const configPath = getConfigPath(rootDir);

  if (!fs.existsSync(configPath)) {
    throw new Error(
      `Missing sync config at ${configPath}. Copy .vengeance/config.example.json to .vengeance/config.json and set vaultPath.`,
    );
  }

  const raw = fs.readFileSync(configPath, "utf8");
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Invalid JSON in sync config: ${configPath}`);
  }

  const config = validateSyncConfig(parsed);

  if (!path.isAbsolute(config.vaultPath)) {
    throw new Error(
      `vaultPath must be an absolute path. Got: ${config.vaultPath}`,
    );
  }

  if (!fs.existsSync(config.vaultPath)) {
    throw new Error(`Obsidian vault not found at: ${config.vaultPath}`);
  }

  return config;
}

export function writeSyncConfig(rootDir: string, config: SyncConfig) {
  const configPath = getConfigPath(rootDir);
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}
