import appJson from '../../app.json';

// Versi rilis diatur di app.json; nomor build dikelola EAS (appVersionSource: remote).
export const APP_VERSION = `v${appJson.expo.version}`;
export const APP_NAME = 'PALTI FX';

export function getFullVersionString(): string {
  return `${APP_VERSION} · ${APP_NAME}`;
}
