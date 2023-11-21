<script>
    import FullCalendar from 'svelte-fullcalendar';
    import interactionPlugin from '@fullcalendar/interaction';
    import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
    import { Modals, openModal, closeModal } from 'svelte-modals';
    import { pageTitle } from '../../stores/pageTitleStore.js';
    import { dynamicTitlePart, getFullTitle } from '../../stores/htmlTitleStore.js';
    import { onMount } from 'svelte';
    import { user } from '../../stores/userStore.js';
    import { BaseURL } from '../../components/Urls.js';

    import CreateEventModal from './CreateEventModal.svelte';
    import { droppedEvent, resizedEvent } from './eventDropResize.js';
    import { getEvents } from './events.js';

    $: pageTitle.set('Work Planner');
    $: dynamicTitlePart.set($pageTitle);
    $: document.title = getFullTitle($dynamicTitlePart);

    let calendarRef;
    let calendarApi;
    let errorMessage = '';
    let allResources = [];
    let selectedResourceId = '';
    let resources = allResources;

    onMount(async () => {
        if (calendarRef) {
            calendarApi = calendarRef.getAPI();
        }

        if ($user && $user.user.role === 'admin') {
            try {
                const response = await fetch(BaseURL + '/admin/getAllUsers', {
                    credentials: 'include',
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok: ' + response.statusText);
                }
                const result = await response.json();
                const transformedData = result.data.map(user => ({
                    id: user.id,
                    title: user.username,
                }));
                allResources = transformedData;
                console.log('first resource:', allResources[0]);
            } catch (error) {
                errorMessage = error.message || 'Failed to fetch data';
            }
        }
    });

    $: {
        if ($user && $user.user.role === 'admin') {
            if (selectedResourceId) {
                // @ts-ignore
                resources = allResources.filter(resource => resource.id === selectedResourceId);
            } else {
                resources = allResources;
            }
        }
        if ($user && $user.user.role === 'user') {
            const resource = {
                id: $user.user.id,
                title: $user.user.username,
            };
            allResources.push(resource);
            resources = allResources;
        }
    }

    function openCreateEventModal(info) {
        console.log('id:', info.resource.id);
        console.log('Name', info.resource.title);
        openModal(CreateEventModal, {
            calendar: calendarApi,
            initialResource: {
                id: info.resource.id,
                start: info.start,
                end: info.end,
                title: info.resource.title,
            },
            employees: allResources,
        });
    }

    $: options = {
        plugins: [resourceTimelinePlugin, interactionPlugin],
        initialView: 'resourceTimelineWeek',
        selectable: true,
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
        editable: true,
        eventResizableFromStart: true,
        droppable: true,
        eventResourceEditable: true,
        eventDrop: incomingInfo => droppedEvent(incomingInfo, calendarApi),
        eventResize: incomingInfo => resizedEvent(incomingInfo, calendarApi),
        select: openCreateEventModal,
        resources: resources,
        events: getEvents(),
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
                arg.el.style.backgroundColor = '#4d4d4d'; // or any color you prefer
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
    <div>
        <select bind:value={selectedResourceId}>
            <option value="">All Resources</option>
            {#each allResources as resource}
                <option value={resource.id}>{resource.title}</option>
            {/each}
        </select>
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
        overflow-y: auto !important;
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
        border-radius: 2px !important;
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

    select {
        background-color: #2d2d2d;
        color: #fff;
        border: 2px solid #6c6c6c;
        padding: 10px 20px;
        border-radius: 4px;
        font-size: 14px;
        margin-bottom: 10px;
        width: 30%;
        box-sizing: border-box;
    }

    select:hover {
        background-color: #454545;
    }

    select:focus {
        box-shadow: 0 0 3px #ff9500;
        outline: none;
    }
</style>
