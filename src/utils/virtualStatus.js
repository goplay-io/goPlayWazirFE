export function isVirtualEvent(event) {
    if (!event) return false;
    if (Number(event.provider_id) === 5) return true;
    return String(event?.provider_name || '').trim().toLowerCase() === 'virtual';
}
