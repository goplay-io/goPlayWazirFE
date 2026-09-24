import { ref } from 'vue';
import { getEventsList } from '@/api/event/events';

export function useSports(event_type_id) {
    const events = ref([]);
    const finalData = ref();
    const loading = ref(false);
    const menuList = ref([]);
    const isLive = ref(false);

    const refreshData = async (event_type_id) => {
    

        if (events.value.length === 0) {
            return;
        }

        let eventsToProcess = events.value.data?.events?.
        filter(event => event.event_type_id === event_type_id);

        let market_ids = eventsToProcess.map(event => event.market_id);

        let realTimeData = window.processLiveData(await window.getRealTimeDataOfEvent(market_ids));
        finalData.value = window.mergeLiveData(eventsToProcess, realTimeData);
        finalData.value = window.groupByEventTypes(finalData.value, menuList.value);
    };

    const filterLiveEvents = (events) => {
        if (!isLive.value) return events;
        return events.filter(event => useMeta(event)?.inPlay);
    };

    const initializeEvents = async () => {
        loading.value = true;
        let res = await window.getEventTypes();
        menuList.value = res.data.menu;
        events.value = await getEventsList();
        refreshData(event_type_id);
        loading.value = false;
    };

    const startPolling = () => {
        const intervalId = setInterval(refreshData, 1000);
        return intervalId;
    };

    return {
        events,
        finalData,
        loading,
        menuList,
        isLive,
        refreshData,
        filterLiveEvents,
        initializeEvents,
        startPolling
    };
}
