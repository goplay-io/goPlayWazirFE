import * as login from './login';
import * as profile from './profile';
import * as logs from './logs';
import * as settings from './settings';
import * as banner from './banner';
import * as campaign from './campaign';
import * as info from './info';

export default {
  ...login,
  ...profile,
  ...logs,
  ...settings,
  ...banner,
  ...campaign,
  ...info,
};

export * from './login';
export * from './profile';
export * from './logs';
export * from './settings';
export * from './banner';
export * from './campaign';
export * from './info';

