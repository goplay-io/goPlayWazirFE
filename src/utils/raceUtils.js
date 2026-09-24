/**
 * Groups races by county/region and event name
 * @param {Array} races - Array of race events with markets
 * @returns {Object} Object grouped by country/region, then by event name
 * 
 * Structure: {
 *   "Country/Region": {
 *     "Event Name": [market1, market2, ...]
 *   }
 * }
 */
export function groupRacesByCounty(races) {
  const grouped = {};

  if (!Array.isArray(races) || races.length === 0) {
    return grouped;
  }

  races.forEach((event) => {
    // Prefer ISO/racing country_code so keys match getUniqueCountryCodes / region tabs
    const rawCountry = event.country_code || event.competition_country || 'Unknown';
    const country = String(rawCountry).trim().toUpperCase();
    const eventName = event.name || 'Unknown Event';

    // Initialize country group if it doesn't exist
    if (!grouped[country]) {
      grouped[country] = {};
    }

    // Initialize event group if it doesn't exist
    if (!grouped[country][eventName]) {
      grouped[country][eventName] = [];
    }

    // Add markets from this event to the appropriate group
    if (event.markets && Array.isArray(event.markets) && event.markets.length > 0) {
      event.markets.forEach((market) => {
        // Create a market object with event and market data
        const marketWithEvent = {
          ...market,
          event_id: event.event_id,
          event_name: event.name,
          competition_country: event.competition_country,
          country_code: event.country_code,
          market_start_time_format: market.market_start_time,
        };

        grouped[country][eventName].push(marketWithEvent);
      });
    }
  });

  return grouped;
}

/**
 * Formats a time string to a readable format
 * @param {string} timeString - ISO time string
 * @returns {string} Formatted time string (HH:mm)
 */
export function formatRaceTime(timeString) {
  if (!timeString) return '';
  
  try {
    const date = new Date(timeString);
    const options = { hour: '2-digit', minute: '2-digit' };
    return date.toLocaleString('en-GB', options);
  } catch (error) {
    console.error('Error formatting time:', error);
    return timeString;
  }
}

/**
 * Checks if a race market is available for betting
 * @param {Object} market - Market object
 * @returns {boolean} True if the race is available for betting
 */
export function isRaceAvailable(market) {
  if (!market) return false;
  
  // Check if betting is allowed
  if (market.bet_allow === 1) {
    return true;
  }
  
  // Check if market start time is in the future
  if (market.market_start_time_format) {
    try {
      const startTime = new Date(market.market_start_time_format);
      return startTime > new Date();
    } catch (error) {
      console.error('Error checking market start time:', error);
    }
  }
  
  return false;
}

/**
 * Groups races by event type name
 * @param {Array} eventTypeList - Array of event types
 * @param {Array} races - Array of race events with markets
 * @returns {Object} Object grouped by event type name
 * 
 * Structure: {
 *   "Event Type Name": [market1, market2, ...]
 * }
 */
export function groupRaces(eventTypeList, races) {
  const grouped = {};

  if (!Array.isArray(races) || races.length === 0) {
    return grouped;
  }

  // Create a map of event_type_id to event_type_name
  const eventTypeMap = {};
  if (Array.isArray(eventTypeList)) {
    eventTypeList.forEach((eventType) => {
      if (eventType.id && eventType.name) {
        eventTypeMap[eventType.id] = eventType.name;
      }
    });
  }

  races.forEach((event) => {
    // Get event type name from map or use event_type_name from event
    const eventTypeName = eventTypeMap[event.event_type_id] || event.event_type_name || 'Unknown';

    // Initialize event type group if it doesn't exist
    if (!grouped[eventTypeName]) {
      grouped[eventTypeName] = [];
    }

    // Add markets from this event to the appropriate group
    if (event.markets && Array.isArray(event.markets) && event.markets.length > 0) {
      event.markets.forEach((market) => {
        // Create a market object with event and market data
        const marketWithEvent = {
          ...market,
          event_id: event.event_id,
          event_name: event.name,
          event_type_id: event.event_type_id,
          event_type_name: eventTypeName,
          competition_country: event.competition_country,
          country_code: event.country_code,
          market_start_time_format: market.market_start_time,
          in_play: event.in_play,
        };

        grouped[eventTypeName].push(marketWithEvent);
      });
    }
  });

  return grouped;
}

/**
 * Categorizes races by time periods
 * @param {Object} groupedRaces - Object with races grouped by event type
 * @returns {Object} Object with race counts categorized by time periods
 * 
 * Structure: {
 *   "Event Type Name": {
 *     now: number,
 *     startingSoon: number,
 *     in1Hour: number,
 *     in2Hours: number,
 *     today: number
 *   }
 * }
 */
export function categorizeRaceTimes(groupedRaces) {
  const categorized = {};
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  
  // Get start and end of today
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  Object.keys(groupedRaces).forEach((eventTypeName) => {
    const markets = groupedRaces[eventTypeName];
    
    let nowCount = 0;
    let startingSoonCount = 0;
    let in1HourCount = 0;
    let in2HoursCount = 0;
    let todayCount = 0;

    markets.forEach((market) => {
      if (!market.market_start_time_format) return;

      try {
        const marketTime = new Date(market.market_start_time_format);
        
        // Check if race is in play (now running)
        if (market.in_play === 1) {
          nowCount++;
        }
        
        // Check if starting soon (within next 5 minutes)
        const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
        if (marketTime > now && marketTime <= fiveMinutesFromNow) {
          startingSoonCount++;
        }
        
        // Check if in next hour
        if (marketTime > now && marketTime <= oneHourFromNow) {
          in1HourCount++;
        }
        
        // Check if in next 2 hours
        if (marketTime > now && marketTime <= twoHoursFromNow) {
          in2HoursCount++;
        }
        
        // Check if today
        if (marketTime >= todayStart && marketTime <= todayEnd) {
          todayCount++;
        }
      } catch (error) {
        console.error('Error processing market time:', error);
      }
    });

    categorized[eventTypeName] = {
      now: nowCount,
      startingSoon: startingSoonCount,
      in1Hour: in1HourCount,
      in2Hours: in2HoursCount,
      today: todayCount,
    };
  });

  return categorized;
}

/**
 * Extracts unique country codes from races array
 * @param {Array} races - Array of race events
 * @returns {Array} Array of unique country codes sorted alphabetically
 */
export function getUniqueCountryCodes(races) {
  if (!Array.isArray(races)) return [];
  
  const uniqueCodes = new Set();
  
  races.forEach((race) => {
    const code = race.country_code || race.competition_country;
    if (code) {
      uniqueCodes.add(String(code).trim().toUpperCase());
    }
  });
  
  return Array.from(uniqueCodes).sort();
}

/** Betfair-style racing country codes → ISO 3166-1 alpha-2 for flag icons */
const RACING_COUNTRY_TO_ISO = {
  GB: 'GB',
  UK: 'GB',
  IRE: 'IE',
  IE: 'IE',
  FRA: 'FR',
  FR: 'FR',
  AUS: 'AU',
  AU: 'AU',
  USA: 'US',
  US: 'US',
  UAE: 'AE',
  GER: 'DE',
  DE: 'DE',
  ITA: 'IT',
  IT: 'IT',
  SPA: 'ES',
  ESP: 'ES',
  ES: 'ES',
  NZL: 'NZ',
  NZ: 'NZ',
  SAF: 'ZA',
  RSA: 'ZA',
  ZA: 'ZA',
  HKG: 'HK',
  HK: 'HK',
  IND: 'IN',
  IN: 'IN',
  JPN: 'JP',
  JP: 'JP',
  CAN: 'CA',
  CA: 'CA',
  SWE: 'SE',
  SE: 'SE',
  NOR: 'NO',
  NO: 'NO',
  CHI: 'CL',
  CL: 'CL',
  ARG: 'AR',
  AR: 'AR',
  BRZ: 'BR',
  BRA: 'BR',
  BR: 'BR',
  TUR: 'TR',
  TR: 'TR',
  POL: 'PL',
  PL: 'PL',
  CZE: 'CZ',
  CZ: 'CZ',
  SGP: 'SG',
  SIN: 'SG',
  SG: 'SG',
};

/**
 * Maps a racing country/region code to an ISO flag code for Flag.vue
 * @param {string} code
 * @returns {string}
 */
export function getRacingFlagCode(code) {
  if (!code) return '';
  const key = String(code).trim().toUpperCase();
  if (RACING_COUNTRY_TO_ISO[key]) return RACING_COUNTRY_TO_ISO[key];
  // Already a 2-letter ISO code
  if (/^[A-Z]{2}$/.test(key)) return key;
  return key.slice(0, 2);
}

