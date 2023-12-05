<script>
    // @ts-nocheck

    import io from 'socket.io-client';
    const socket = io('http://localhost:3000');
    import FullCalendar from 'svelte-fullcalendar';
    import interactionPlugin from '@fullcalendar/interaction';
    import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
    import Select from 'svelte-select';
    import { Modals, openModal, closeModal } from 'svelte-modals';
    import { pageTitle } from '../../stores/pageTitleStore.js';
    import { dynamicTitlePart, getFullTitle } from '../../stores/htmlTitleStore.js';
    import { onMount, onDestroy } from 'svelte';
    import { writable } from 'svelte/store';
    import { user } from '../../stores/userStore.js';
    import { BASE_URL } from '../../components/Urls.js';
    import { notificationStore } from '../../stores/notificationStore.js';
    import 'material-icons/iconfont/material-icons.css';

    import EventModal from './EventModal.svelte';
    import SearchResultModal from './SearchResultModal.svelte';

    $: pageTitle.set('Work Planner'), dynamicTitlePart.set($pageTitle), (document.title = getFullTitle($dynamicTitlePart));

    let calendarRef;
    let calendarApi;
    let allEvents = [];
    let allResources = [];
    let selectedEventId = '';
    let resources;
    let selectedResourceIds = [];
    let requestedData = [];

    const requestCount = writable(0);

    let windowWidth = writable(window.innerWidth);
    let windowHeight = writable(window.innerHeight);

    function updateWidth() {
        windowWidth.set(window.innerWidth);
        windowHeight.set(window.innerHeight);
    }

    onMount(() => {
        window.addEventListener('resize', updateWidth);
    });

    onDestroy(() => {
        window.removeEventListener('resize', updateWidth);
    });

    onMount(async () => {
        if (calendarRef) {
            calendarApi = calendarRef.getAPI();
        }

        if (!$user) {
            return;
        }

        let endpointUsersData = $user.user.role === 'admin' ? '/admin/get-all-users' : '/user/profile';
        await fetchUsersData(endpointUsersData);
        let endpointEventsData = $user.user.role === 'admin' ? '/admin/get-all-events' : '/user/get-events';

        await fetchEventsData(endpointEventsData);
    });

    $: selectOptions = allResources.map(resource => ({
        value: resource.id,
        label: resource.title,
    }));

    socket.on('user_signup', async () => {
        if ($user.user.role === 'admin') {
            await fetchUsersData('/admin/get-all-users');
            await fetchEventsData('/admin/get-all-events');
        }
    });

    socket.on('event_created', async () => {
        if ($user.user.role === 'admin') {
            await fetchEventsData('/admin/get-all-events');
        } else if ($user.user.role === 'user') {
            await fetchEventsData('/user/get-events');
        }
    });

    socket.on('event_updated', async () => {
        if ($user.user.role === 'admin') {
            await fetchEventsData('/admin/get-all-events');
        } else if ($user.user.role === 'user') {
            await fetchEventsData('/user/get-events');
        }
    });

    socket.on('event_deleted', async () => {
        if ($user.user.role === 'admin') {
            await fetchEventsData('/admin/get-all-events');
        } else if ($user.user.role === 'user') {
            await fetchEventsData('/user/get-events');
        }
    });

    socket.on('requested_changes', data => {
        console.log('requested_changes', data);
        requestedData = [...requestedData, data];
        requestCount.update(n => n + 1);
    });

    $: {
        if ($user.user.role === 'admin' && Array.isArray(selectedResourceIds) && selectedResourceIds.length > 0) {
            let manipulatedSelectedResourceIds = selectedResourceIds.map(id => parseInt(id.value));
            if (manipulatedSelectedResourceIds.includes('')) {
                resources = allResources;
            } else {
                resources = allResources.filter(resource => manipulatedSelectedResourceIds.includes(resource.id));
            }
        } else {
            resources = allResources;
        }
    }

    async function fetchUsersData(endpoint) {
        try {
            let response = await fetch(BASE_URL + endpoint, {
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }

            const result = await response.json();
            if ($user.user.role === 'admin') {
                const transformedData = result.data.map(user => ({
                    id: user.id,
                    title: user.username,
                }));
                transformedData.sort((a, b) => (a.title > b.title ? 1 : -1));

                allResources = transformedData;
            } else if ($user.user.role === 'user') {
                const resource = {
                    id: $user.user.id,
                    title: $user.user.username,
                };
                calendarApi.addResource(resource);
                allResources = [...allResources, resource];
            }
        } catch (error) {
            notificationStore.set({ message: error.message || 'Failed to fetch data', type: 'error' });
        }
    }

    async function fetchEventsData(endpoint) {
        try {
            let response = await fetch(BASE_URL + endpoint, {
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }

            const result = await response.json();
            const transformedData = result.data.map(event => ({
                id: event.id,
                resourceId: event.resource_id,
                start: event.start,
                end: event.end,
                title: event.title,
                status: event.status,
                description: event.description,
                appraised: event.appraised,
                classNames: `event-${event.status}`,
            }));
            allEvents = transformedData;
        } catch (error) {
            notificationStore.set({ message: error.message || 'Failed to fetch data', type: 'error' });
        }
    }

    function openEventModal(info) {
        let modalProps = {
            initialResource: {
                resourceId: info.resource ? info.resource.id : null,
                start: info.start,
                end: info.end,
                status: '',
            },
            employees: allResources,
        };

        if (info.event && info.event.id) {
            modalProps.initialResource.eventId = info.event.id;
        }

        openModal(EventModal, modalProps);
    }

    function openSearchResultModal() {
        let modalProps = {
            allEvents: allEvents,
            onGoToEvent: handleGoToEventFromModal,
            employees: allResources,
        };

        openModal(SearchResultModal, modalProps);
    }

    function handleGoToEventFromModal(eventId) {
        goToEvent({ eventId });
    }

    function formatDate(date) {
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    }

    async function updateEventInDatabase(eventInfo, calendarApi) {
        const event = calendarApi.getEventById(eventInfo.event.id);

        const updatedEvent = {
            id: event.id,
            title: event.title,
            start: formatDate(event.start),
            end: formatDate(event.end),
            resourceId: event.getResources().map(resource => resource.id)[0],
            description: event.extendedProps.description,
            status: event.extendedProps.status,
            appraised: event.extendedProps.appraised,
        };

        try {
            const response = await fetch(BASE_URL + '/admin/update-event', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedEvent),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const result = await response.json();
            notificationStore.set({ message: 'Event updated successfully', type: 'success' });
        } catch (error) {
            notificationStore.set({ message: error.message || 'Failed to update event', type: 'error' });
        }
    }

    $: options = {
        plugins: [resourceTimelinePlugin, interactionPlugin],
        schedulerLicenseKey: 'CC-Attribution-NonCommercial-NoDerivatives',
        initialView: 'resourceTimelineWeek',
        height: 'auto',
        contentHeight: 'auto',
        views: {
            resourceTimelineWeek: {
                type: 'resourceTimeline',
                buttonText: 'Uge',
            },
            twoWeeksTimeline: {
                type: 'resourceTimeline',
                duration: { weeks: 2 },
                buttonText: '2 Uger',
            },
            threeWeeksTimeline: {
                type: 'resourceTimeline',
                duration: { weeks: 3 },
                buttonText: '3 Uger',
            },
            resourceTimelineMonth: {
                type: 'resourceTimeline',
                duration: { months: 1 },
                buttonText: 'Måned',
            },
        },
        buttonText: {
            today: 'I dag',
        },
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'resourceTimelineWeek,twoWeeksTimeline,threeWeeksTimeline,resourceTimelineMonth',
        },
        locale: 'da',
        firstDay: 1,
        hiddenDays: [0, 6],
        editable: $user.user.role === 'admin',
        eventResizableFromStart: $user.user.role === 'admin',
        droppable: $user.user.role === 'admin',
        eventResourceEditable: $user.user.role === 'admin',
        eventDrop: $user.user.role === 'admin' ? eventInfo => updateEventInDatabase(eventInfo, calendarApi) : null,
        eventResize: $user.user.role === 'admin' ? eventInfo => updateEventInDatabase(eventInfo, calendarApi) : null,
        eventClick: function (clickInfo) {
            const event = clickInfo.event;
            const resourceIds = event._def.resourceIds;

            const eventData = {
                id: event.id,
                title: event.title,
                start: event.start,
                end: event.end,
                resourceId: resourceIds && resourceIds.length > 0 ? resourceIds[0] : null,
                description: event.extendedProps.description,
                status: event.extendedProps.status,
                appraised: event.extendedProps.appraised,
            };

            openModal(EventModal, {
                initialResource: eventData,
                employees: allResources,
                isEditMode: true,
            });
        },
        selectable: $user.user.role === 'admin',
        select: $user.user.role === 'admin' ? openEventModal : null,
        resources: resources,
        resourceOrder: 'title',
        events: allEvents,
        eventContent: function (arg) {
            const element = document.createElement('div');
            element.setAttribute('data-event-id', arg.event.id);

            if (parseInt(arg.event.id) === selectedEventId) {
                element.style.border = '10px solid #ff9500';
                element.style.padding = '10px';
                element.style.borderRadius = '4px';
                const arrowElement = document.createElement('span');
                arrowElement.className = 'event-arrow';
                arrowElement.innerHTML = '🡆';
                arrowElement.style.fontSize = '24px';
                arrowElement.style.color = 'red';
                element.appendChild(arrowElement);
            }

            const titleElement = document.createElement('span');
            titleElement.textContent = arg.event.title;
            element.appendChild(titleElement);
            switch (arg.event.extendedProps.status) {
                case 'booked':
                    element.classList.add('event-booked');
                    break;
                case 'arrived':
                    element.classList.add('event-arrived');
                    break;
                case 'appraisal':
                    element.classList.add('event-appraisal');
                    break;
                case 'awaitingappraiserapproval':
                    element.classList.add('event-awaitingappraiserapproval');
                    break;
                case 'awaiting customer approval':
                    element.classList.add('event-awaitingcustomerapproval');
                    break;
                case 'disassembly':
                    element.classList.add('event-disassembly');
                    break;
                case 'waiting for parts':
                    element.classList.add('event-waitingforparts');
                    break;
                case 'repair':
                    element.classList.add('event-repair');
                    break;
                case 'painter':
                    element.classList.add('event-painter');
                    break;
                case 'returned painter':
                    element.classList.add('event-returnpainter');
                    break;
                case 'assembly':
                    element.classList.add('event-assembly');
                    break;
                case 'preparation':
                    element.classList.add('event-preparation');
                    break;
                case 'called ready':
                    element.classList.add('event-calledready');
                    break;
                case 'delivered to customer':
                    element.classList.add('event-deliveredtocustomer');
                    break;
                case 'total loss':
                    element.classList.add('event-totalloss');
                    break;
            }

            if (arg.event.extendedProps.appraised === 1) {
                const iconElement = document.createElement('span');
                iconElement.className = 'event-icon';
                iconElement.innerHTML = ' ✔️';
                element.appendChild(iconElement);
            }

            return { domNodes: [element] };
        },

        slotLabelFormat: getSlotLabelFormat(window.innerWidth),
        resourceAreaHeaderContent: 'Smede:',
        slotDuration: { days: 1 },
        resourceAreaWidth: '190px',
        displayEventTime: false,
        slotLabelDidMount: function (arg) {
            const currentDate = new Date();
            if (
                arg.date.getFullYear() === currentDate.getFullYear() &&
                arg.date.getMonth() === currentDate.getMonth() &&
                arg.date.getDate() === currentDate.getDate()
            ) {
                arg.el.style.backgroundColor = '#4d4d4d';
            }
        },
    };

    function getSlotLabelFormat(screenWidth) {
        if (screenWidth < 1200) {
            return [
                {
                    month: 'numeric',
                    day: 'numeric',
                    omitCommas: true,
                    separator: ' ',
                },
            ];
        }
        if (screenWidth < 2000) {
            return [
                {
                    weekday: 'short',
                    month: 'numeric',
                    day: 'numeric',
                    omitCommas: true,
                    separator: ' ',
                },
            ];
        } else {
            return [
                {
                    weekday: 'long',
                    month: 'numeric',
                    day: 'numeric',
                    omitCommas: true,
                    separator: ' ',
                },
            ];
        }
    }

    function handleBackdropClick() {
        closeModal();
    }

    function handleBackdropKeyDown(event) {
        if (event.key === 'Enter' || event.key === 'Space') {
            closeModal();
        }
    }

    function clearSelections() {
        selectedResourceIds = [];
    }

    async function goToEvent(eventDetail) {
        let event = allEvents.find(e => e.id === eventDetail.eventId);

        calendarApi.gotoDate(event.start);
        let selectedEvent = await calendarApi.getEventById(eventDetail.eventId);
        selectedEventId = eventDetail.eventId;
    }

    function handleNotificationClick() {
        requestCount.set(0);
        console.log('requestedData', requestedData);
    }
</script>

<div class="spacer" />
<Modals>
    <div
        slot="backdrop"
        class="backdrop"
        on:click={handleBackdropClick}
        on:keydown={handleBackdropKeyDown}
        tabindex="0"
        role="button"
        aria-label="Close modal"
    />
</Modals>
{#if $windowWidth <= 650}
    <div class="rotate-device-message">
        <span class="material-icons custom-icon"> screen_rotation </span>
        <p>Please rotate your device to use the calendar.</p>
    </div>
{:else}
    <div class="header-controls">
        {#if $user.user.role === 'admin'}
            <div class="select-and-clear">
                {#if windowHeight > 600}
                    <Select
                        class="select-control"
                        items={selectOptions}
                        bind:value={selectedResourceIds}
                        placeholder="All Resources"
                        showChevron={true}
                        clearable={false}
                        multiple
                        --chevron-icon-width="20px"
                        --chevron-icon-colour="white"
                        --background="#ff9500"
                        --border="1px solid #6c6c6c"
                        --border-radius="4px"
                        --box-sizing="border-box"
                        --item-height="38px"
                        --item-hover-bg="#ff9500"
                        --item-hover-color="#fff"
                        --list-background="#3a3a3a"
                        --list-border="1px solid #6c6c6c"
                        --list-border-radius="4px"
                        --list-max-height="200px"
                        --list-z-index="100"
                        --placeholder-color="#fff"
                        --clear-icon-color="#ff9500"
                        --multi-item-bg="#2d2d2d"
                        --multi-item-color="#fff"
                        --multi-item-border-radius="4px"
                        --multi-item-clear-icon-color="#ff9500"
                        --border-focused="1px solid #ff9500"
                        --width="50%"
                    />
                {:else}
                    <Select
                        class="select-control"
                        items={selectOptions}
                        bind:value={selectedResourceIds}
                        placeholder="All Resources"
                        showChevron={true}
                        clearable={false}
                        multiple
                        --chevron-icon-width="12px"
                        --chevron-icon-colour="white"
                        --background="#ff9500"
                        --border="1px solid #6c6c6c"
                        --border-radius="4px"
                        --box-sizing="border-box"
                        --item-height="30px"
                        --item-hover-bg="#ff9500"
                        --item-hover-color="#fff"
                        --list-background="#3a3a3a"
                        --list-border="1px solid #6c6c6c"
                        --list-border-radius="4px"
                        --list-max-height="200px"
                        --list-z-index="100"
                        --placeholder-color="#fff"
                        --clear-icon-color="#ff9500"
                        --multi-item-bg="#2d2d2d"
                        --multi-item-color="#fff"
                        --multi-item-border-radius="4px"
                        --multi-item-clear-icon-color="#ff9500"
                        --border-focused="1px solid #ff9500"
                        --width="50%"
                        --font-size="12px"
                        --height="30px"
                    />
                {/if}

                <button class="clear-btn" on:click={clearSelections}>Clear</button>
            </div>
            <button class="create-event-btn" on:click={() => openEventModal({ resource: null })}>Create Event</button>
        {/if}
        <button on:click={() => openSearchResultModal()}>Search</button>
        {#if $user.user.role === 'admin'}
            <div class="reset-button-container">
                <button on:click={() => handleNotificationClick()}>Show Requests</button>
                {#if $requestCount > 0}
                    <div class="notification-icon" on:click={handleNotificationClick}>{$requestCount}</div>
                {/if}
            </div>
        {/if}
    </div>

    <FullCalendar bind:this={calendarRef} {options} class="my-calendar" />
{/if}

<style>
    :global(.my-calendar) {
        height: 80vh !important;
        width: 100% !important;
    }

    :global(.fc) {
        border-radius: 8px !important;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1) !important;
    }

    :global(.fc-resource-timeline .fc-scrollgrid-sync-table tr) {
        border-bottom: 5px solid #6c6c6c !important;
    }

    :global(.fc-resource-timeline .fc-scrollgrid-sync-table tr:not(.fc-col-header-row):nth-child(odd)) {
        background-color: #212121 !important;
        border-bottom: 5px solid #6c6c6c !important;
    }

    :global(.fc-resource-timeline .fc-scrollgrid-sync-table) {
        position: relative !important;
    }

    :global(.fc-resource-timeline .fc-scrollgrid-sync-table::after) {
        content: '' !important;
        display: block !important;
        height: 30px !important;
        position: absolute !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
    }

    :global(.fc-event) {
        margin: 10px !important;
        box-sizing: border-box !important;
        border: none !important;
        padding-left: 10px;
        border-radius: 6px;
    }

    :global(.fc-header-toolbar) {
        background-color: #2d2d2d !important;
        color: #ff9500 !important;
        padding: 10px !important;
        border: 2px solid #6c6c6c !important;
        border-radius: 8px !important;
    }

    :global(.fc-button) {
        background-color: #ff9500 !important;
        color: #fff !important;
        border: none !important;
        padding: 10px 20px !important;
        border-radius: 4px !important;
        font-size: 14px !important;
        margin: 0 5px !important;
    }

    :global(.fc-button.fc-button-active),
    :global(.fc-button.fc-state-active) {
        background: linear-gradient(to bottom, rgba(255, 255, 255, 0.1), rgba(200, 200, 200, 0.1)) !important;
        color: #888 !important;
    }

    :global(.fc-button.fc-button-active:hover),
    :global(.fc-button.fc-button-active:focus),
    :global(.fc-button.fc-state-active:hover),
    :global(.fc-button.fc-state-active:focus) {
        background: linear-gradient(to bottom, rgba(255, 255, 255, 0.1), rgba(200, 200, 200, 0.1)) !important;
        color: #888 !important;
    }

    :global(.fc-button:hover) {
        background-color: #cc7a00 !important;
    }

    :global(.fc-button:focus) {
        box-shadow: 0 0 3px #ff9500 !important;
        outline: none !important;
    }

    :global(.fc-button:disabled) {
        background: linear-gradient(to bottom, rgba(255, 255, 255, 0.1), rgba(200, 200, 200, 0.1)) !important;
        color: #888 !important;
    }

    :global(.fc .fc-scrollgrid) {
        background-color: #2d2d2d !important;
        color: #fff !important;
        border: 2px solid #6c6c6c !important;
        border-radius: 8px !important;
    }

    :global(.fc .fc-scrollgrid td, .fc .fc-scrollgrid th) {
        border-color: #6c6c6c !important;
    }

    :global(.fc .fc-col-header-cell) {
        background-color: #454545 !important;
        color: #ff9500 !important;
        border-radius: 8px !important;
        overflow: hidden !important;
    }

    :global(.fc .fc-resource-timeline .fc-scrollgrid-section > td) {
        background-color: #333333 !important;
    }

    :global(.event-booked) {
        background-color: lightblue;
        color: black;
    }

    :global(.event-arrived) {
        background-color: darkblue;
        color: white;
    }

    :global(.event-appraisal) {
        background-color: lavender;
        color: black;
    }
    :global(.event-awaitingappraiserapproval) {
        background-color: purple;
        color: white;
    }
    :global(.event-awaitingcustomerapproval) {
        background-color: brown;
        color: white;
    }
    :global(.event-disassembly) {
        background-color: orange;
        color: black;
    }
    :global(.event-waitingforparts) {
        background-color: coral;
        color: black;
    }
    :global(.event-repair) {
        background-color: red;
        color: white;
    }
    :global(.event-painter) {
        background-color: yellow;
        color: black;
    }
    :global(.event-returnpainter) {
        background-color: rgb(105, 103, 76);
        color: white;
    }
    :global(.event-assembly) {
        background-color: green;
        color: white;
    }
    :global(.event-preparation) {
        background-color: teal;
        color: white;
    }
    :global(.event-calledready) {
        background-color: rgb(145, 214, 41);
        color: black;
    }
    :global(.event-deliveredtocustomer) {
        background-color: rgba(255, 217, 0, 0.662);
        color: black;
    }
    :global(.event-totalloss) {
        background-color: grey;
        color: white;
    }

    :global(.fc .fc-resource-timeline .fc-scrollgrid-sync-table .fc-day-mon, .fc .fc-resource-timeline .fc-scrollgrid .fc-day-mon) {
        border-left: 10px solid #ff9500 !important;
    }

    .backdrop {
        position: fixed;
        top: 0;
        bottom: 0;
        right: 0;
        left: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 10;
    }
    button {
        padding: 10px 20px;
        background-color: #ff9500;
        color: #fff;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.3s ease;
    }

    button:hover {
        background-color: #cc7a00;
    }

    .header-controls {
        display: flex;
        align-items: start;
        gap: 10px;
        padding: 10px;
        background-color: #2d2d2d;
        border-radius: 8px;
        margin-bottom: 20px;
        border: 2px solid #6c6c6c;
        margin-top: 40px;
    }

    .select-and-clear {
        display: flex;
        flex-direction: row;
        align-items: start;
        width: 50%;
    }

    .clear-btn {
        margin-left: 10px;
    }

    .create-event-btn {
        margin-left: auto;
    }

    .custom-icon {
        font-size: 80px;
    }
    .rotate-device-message {
        margin-top: 150px;
        height: 80vh;
        color: #ff9500;
        font-size: 24px;
    }

    .reset-button-container {
        position: relative;
        display: inline-block;
    }

    .notification-icon {
        position: absolute;
        top: -10px;
        right: -10px;
        width: 25px;
        height: 25px;
        background-color: red;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        cursor: pointer;
    }

    @media screen and (max-height: 600px) {
        :global(.my-calendar) {
            height: 100vh !important;
            width: 100% !important;
            margin-bottom: 30px !important;
        }
        :global(.fc-header-toolbar) {
            background-color: #2d2d2d !important;
            color: #ff9500 !important;
            padding: 5px !important;
            border: 2px solid #6c6c6c !important;
            border-radius: 8px !important;
            font-size: 12px !important;
            margin-top: -15px;
        }
        :global(.fc-button) {
            background-color: #ff9500 !important;
            color: #fff !important;
            border: none !important;
            padding: 10px 20px !important;
            border-radius: 4px !important;
            font-size: 12px !important;
            margin: 0 5px !important;
        }

        :global(.fc-datagrid-cell-main) {
            font-size: 12px !important;
        }

        :global(.fc-event) {
            font-size: 11px !important;
        }

        :global(.fc-timeline-slot-frame) {
            font-size: 12px !important;
        }
        .spacer {
            margin-top: 0;
        }
        .header-controls {
            display: flex;
            align-items: start;
            gap: 10px;
            background-color: #2d2d2d;
            border-radius: 8px;
            border: 2px solid #6c6c6c;
            font-size: 12px;
            margin-top: 11px;
        }
    }
</style>
