import { ref } from 'vue';
import EventData from '@/utils/eventData';

export function useEvent() {
    const event = ref(null);
    const bm_active = ref(false);
    const inPlay = ref(false);
    const event_name = ref("Unknown event");
    const event_type_id = ref(null);
    const event_open_time = ref("Unknown time");
    const event_open_time_diff = ref("Unknown time");
    const latency = ref(0);

    const humanReadableDiff = (timeValue) => {
        // Prefer global helper if present to keep legacy behavior
        if (typeof window !== 'undefined' && typeof window.humanReadableDiff === 'function') {
            return window.humanReadableDiff(timeValue);
        }

        // Fallback: lightweight human-readable delta
        const target = new Date(timeValue);
        if (Number.isNaN(target.getTime())) return 'Unknown time';

        const diffMs = target.getTime() - Date.now();
        const absMinutes = Math.round(Math.abs(diffMs) / 60000);

        if (absMinutes < 1) return diffMs >= 0 ? 'now' : 'just now';
        if (absMinutes < 60) return diffMs >= 0 ? `in ${absMinutes}m` : `${absMinutes}m ago`;

        const absHours = Math.round(absMinutes / 60);
        if (absHours < 24) return diffMs >= 0 ? `in ${absHours}h` : `${absHours}h ago`;

        const absDays = Math.round(absHours / 24);
        return diffMs >= 0 ? `in ${absDays}d` : `${absDays}d ago`;
    };

    const constructEvent = () => {
        const safeEvent = event.value || {};
        const info = EventData.getEventInfo ? EventData.getEventInfo(safeEvent) : safeEvent;

        event_name.value = EventData.getEventName(safeEvent);
        event_open_time.value = EventData.getEventOpenTime(safeEvent);
        bm_active.value = EventData.getBMActive(safeEvent);
        event_type_id.value = EventData.getEventTypeId(safeEvent);

        const inPlayFlag = info?.in_play ?? info?.inPlay ?? info?.live;
        inPlay.value = Number(inPlayFlag) === 1 || inPlayFlag === true;

        event_open_time_diff.value = humanReadableDiff(event_open_time.value);
    };

    const updateEventTime = () => {
        event_open_time_diff.value = humanReadableDiff(event_open_time.value);
    };

    return {
        event,
        bm_active,
        inPlay,
        event_name,
        event_type_id,
        event_open_time,
        event_open_time_diff,
        latency,
        constructEvent,
        updateEventTime
    };
}
