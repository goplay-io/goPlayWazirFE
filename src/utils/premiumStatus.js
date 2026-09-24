const PREMIUM_PROVIDER_IDS = new Set([4, 7]);

export function isSrlCompetition(event) {
    if (!event) return false;
    const competitionName = String(
        event.competition_name ?? event.competitionName ?? '',
    )
        .trim()
        .toLowerCase();
    return competitionName.includes('srl');
}

export function isPremiumEvent(event) {
    if (!event) return false;
    if (isSrlCompetition(event)) return false;
    return PREMIUM_PROVIDER_IDS.has(Number(event.provider_id));
}
