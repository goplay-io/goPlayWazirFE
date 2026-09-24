import * as events from './events';
import * as markets from './markets';
import * as odds from './odds';
import * as eventTypes from './eventTypes';
import * as tournaments from './tournaments';
import * as fancy from './fancy';
import * as marketTypes from './marketTypes';
import * as bet from './bet';
import * as races from './races';
import * as sportsbook from './sportsbook';

export default {
  ...events,
  ...markets,
  ...odds,
  ...eventTypes,
  ...tournaments,
  ...fancy,
  ...marketTypes,
  ...bet,
  ...races,
  ...sportsbook,
};

