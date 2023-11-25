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
    import { onMount } from 'svelte';
    import { user } from '../../stores/userStore.js';
    import { BASE_URL } from '../../components/Urls.js';
    import { notificationStore } from '../../stores/notificationStore.js';

    import EventModal from './EventModal.svelte';

    $: pageTitle.set('Work Planner'), dynamicTitlePart.set($pageTitle), (document.title = getFullTitle($dynamicTitlePart));

    let calendarRef;
    let calendarApi;
    let allEvents = [];
    let allResources = [];
    let selectedResourceId = '';
    let resources;
    let selectedResourceIds = [];

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

    $: {
        // Check if the user is an admin and selectedResourceIds is defined and not empty
        if ($user.user.role === 'admin' && Array.isArray(selectedResourceIds) && selectedResourceIds.length > 0) {
            // Convert selectedResourceIds values to integers, assuming they are objects with a 'value' property
            let manipulatedSelectedResourceIds = selectedResourceIds.map(id => parseInt(id.value));

            // Check if the manipulated array includes an empty string
            if (manipulatedSelectedResourceIds.includes('')) {
                resources = allResources;
            } else {
                // Filter resources based on the IDs in manipulatedSelectedResourceIds
                resources = allResources.filter(resource => manipulatedSelectedResourceIds.includes(resource.id));
            }
        } else {
            // Default to all resources if the user is not an admin or selectedResourceIds is empty or undefined
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
                //Sort by title
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
            const response = await fetch(BASE_URL + '/user/update-event', {
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
        initialView: 'resourceTimelineWeek',
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
            element.innerText = arg.event.title;

            switch (arg.event.extendedProps.status) {
                case 'pending':
                    element.classList.add('event-pending');
                    break;
                case 'approved':
                    element.classList.add('event-approved');
                    break;
                case 'denied':
                    element.classList.add('event-denied');
                    break;
            }
            if (arg.event.extendedProps.appraised === 1) {
                const iconHTML = '<span class="event-icon"> ✔️</span>';
                element.innerHTML += iconHTML;
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
        if (screenWidth < 1000) {
            return [
                {
                    month: 'numeric',
                    day: 'numeric',
                    omitCommas: true,
                    separator: ' ',
                },
            ];
        } else {
            return [
                {
                    weekday: 'short',
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
{#if $user.user.role === 'admin'}
    <div class="header-controls">
        <div class="select-and-clear">
            <Select
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
                --placeholder-color="#fff"
                --clear-icon-color="#ff9500"
                --multi-item-bg="#2d2d2d"
                --multi-item-color="#fff"
                --multi-item-border-radius="4px"
                --multi-item-clear-icon-color="#ff9500"
                --border-focused="1px solid #ff9500"
                --width="50%"
            />
            <button class="clear-btn" on:click={clearSelections}>Clear Selected Resources</button>
        </div>
        <button class="create-event-btn" on:click={() => openEventModal({ resource: null })}>Create Event</button>
    </div>
{/if}

<FullCalendar bind:this={calendarRef} {options} class="my-calendar" />

<style>
    :global(.my-calendar) {
        height: 80vh !important;
        width: 100% !important;
        margin-bottom: 30px !important;
    }

    :global(.fc) {
        border-radius: 8px !important;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1) !important;
    }

    :global(.fc-scroller) {
        height: calc(100% - 30px) !important;
    }

    :global(.fc-resource-timeline .fc-scrollgrid-sync-table tr) {
        border-bottom: 5px solid #6c6c6c !important; /* Change border thickness as needed */
    }

    :global(.fc-resource-timeline .fc-scrollgrid-sync-table tr:not(.fc-col-header-row):nth-child(odd)) {
        background-color: #212121 !important;
        border-bottom: 5px solid #6c6c6c !important; /* Change border thickness as needed */
    }

    :global(.fc-resource-timeline .fc-scrollgrid-sync-table tr:last-child) {
        border-bottom: 2px solid #6c6c6c !important;
    }

    :global(.fc-resource-timeline .fc-scrollgrid-sync-table::after) {
        content: '' !important;
        display: block !important;
        height: 30px !important;
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

    :global(.fc .fc-resource-area td) {
        background-color: #3a3a3a !important;
    }

    :global(.event-pending) {
        background-color: yellow; /* Color for pending events */
        color: black; /* Contrasting font color */
    }

    :global(.event-approved) {
        background-color: green; /* Color for approved events */
        color: white; /* Contrasting font color */
    }

    :global(.event-denied) {
        background-color: red; /* Color for denied events */
        color: white; /* Contrasting font color */
    }

    .spacer {
        margin-top: 40px;
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
        align-items: start; /* Align the items to the start of the flex container */
        gap: 10px; /* Spacing between elements */
        padding: 10px;
        background-color: #2d2d2d;
        border-radius: 8px;
        margin-bottom: 20px;
        border: 2px solid #6c6c6c;
    }

    .select-and-clear {
        display: flex;
        flex-direction: row; /* Stack elements vertically */
        align-items: start; /* Align items to the start */
        width: 50%;
    }

    .clear-btn {
        margin-left: 10px; /* Adjust the space as needed */
    }

    .create-event-btn {
        margin-left: auto; /* Push the button to the right */
    }
</style>
