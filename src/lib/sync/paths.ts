import path from "node:path";

export const VENGEANCE_DIR = ".vengeance";
export const CONFIG_FILE = "config.json";
export const MANIFEST_FILE = "sync-manifest.json";

export function getVengeanceDir(rootDir: string) {
  return path.join(rootDir, VENGEANCE_DIR);
}

export function getConfigPath(rootDir: string) {
  return path.join(getVengeanceDir(rootDir), CONFIG_FILE);
}

export function getManifestPath(rootDir: string) {
  return path.join(getVengeanceDir(rootDir), MANIFEST_FILE);
}
