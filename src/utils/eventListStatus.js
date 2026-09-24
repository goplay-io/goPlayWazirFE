/** Whether an event row from /events/list is exchange-active (replaces ?active=true server filter). */
export function isActiveListEvent(event) {
    const active = event?.active;
    if (active === false || active === 0 || active === '0') return false;
    return true;
}

export function filterActiveListEvents(list) {
    return (Array.isArray(list) ? list : []).filter(isActiveListEvent);
}
