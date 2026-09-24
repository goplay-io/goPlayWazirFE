import { resolveSrEventId } from '@/api/event/events.js';

const ABRACADABRA_SCORECARD_BASE = 'https://play.abracadabra.exchange/';

/** Extract numeric SR match id from sr:match:123456 (or sr_match_123456). */
export function getScorecardIdFromSrEvent(eventId) {
  if (eventId == null || eventId === '') return null;

  const normalized = String(eventId).replaceAll('_', ':');
  if (normalized.startsWith('sr:match:')) {
    return normalized.split(':')[2] || null;
  }

  const parts = normalized.split(':');
  return parts.length >= 3 ? parts[2] : null;
}

/** Build Abracadabra scorecard iframe URL. */
export function buildAbracadabraScorecardUrl(sportId, scorecardId) {
  const sport = String(sportId ?? '').trim();
  const event = String(scorecardId ?? '').trim();
  if (!sport || !event) return null;

  const url = new URL(ABRACADABRA_SCORECARD_BASE);
  url.searchParams.set('sportId', sport);
  url.searchParams.set('eventId', event);
  return url.toString();
}

/** Resolve numeric SR match id — direct sr:match or via mapping API. */
export async function resolveSrScorecardId(eventId) {
  if (eventId == null || eventId === '') return null;

  const normalized = String(eventId).replaceAll('_', ':');
  if (normalized.startsWith('sr:match:')) {
    return normalized.split(':')[2] || null;
  }

  try {
    const result = await resolveSrEventId(eventId);
    const sEventId = result?.data?.sEventId
      ?? result?.sEventId
      ?? result?.data?.data?.sEventId
      ?? null;
    return getScorecardIdFromSrEvent(sEventId);
  } catch {
    return null;
  }
}
