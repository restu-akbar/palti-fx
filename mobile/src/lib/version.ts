import versionData from '../../version.json';

export const APP_VERSION = `v${versionData.versionName}`;
export const VERSION_CODE = versionData.versionCode;
export const APP_NAME = 'PALTI FX';

export function getFullVersionString(): string {
  return `${APP_VERSION} · ${APP_NAME}`;
}

export default {
  version: APP_VERSION,
  versionName: versionData.versionName,
  versionCode: VERSION_CODE,
  appName: APP_NAME,
  getFullVersionString,
};
