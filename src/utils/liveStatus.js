export function isTruthyInPlay(inPlay) {
    return inPlay === true || inPlay === 1 || inPlay === '1';
}

export function parseOpenDateMs(openDate) {
    if (openDate == null || openDate === '') return null;
    const ms = new Date(openDate).getTime();
    return Number.isFinite(ms) ? ms : null;
}

/** iLive: scheduled start has passed (open_date ≤ now). */
export function isILive({ openDate, now = Date.now() }) {
    const startMs = parseOpenDateMs(openDate);
    if (startMs == null) return false;

    return now >= startMs;
}

function normalizeLabel(value) {
    if (value == null) return '';
    return String(value).trim().toLowerCase();
}

/** Event title matches competition (trimmed, lowercase). */
export function isGoldenStarMatch({ eventName, competitionName }) {
    const event = normalizeLabel(eventName);
    const competition = normalizeLabel(competitionName);
    if (!event || !competition) return false;
    return event === competition;
}

/** @returns {'golden' | 'red' | 'green' | null} */
export function getLiveDotVariant({
    eventName,
    competitionName,
    inPlay,
    openDate,
    now = Date.now()
}) {
    if (isGoldenStarMatch({ eventName, competitionName })) return 'golden';
    if (isILive({ openDate, now })) return 'red';
    if (isTruthyInPlay(inPlay)) return 'green';
    return null;
}

export function isLiveDotVisible(params) {
    return getLiveDotVariant(params) !== null;
}

/** Red blinking dot only (excludes golden star). */
export function isRedLiveDot(params) {
    return getLiveDotVariant(params) === 'red';
}

/** Live INPLAY feed: red dot, or golden ★ when start time has also passed. */
export function isLiveFeedEvent(params) {
    if (isGoldenStarMatch(params) && isILive(params)) return true;
    return isRedLiveDot(params);
}
