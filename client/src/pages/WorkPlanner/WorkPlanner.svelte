<script>
    // @ts-nocheck

    import io from 'socket.io-client';
    import FullCalendar from 'svelte-fullcalendar';
    import interactionPlugin from '@fullcalendar/interaction';
    import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
    import Select from 'svelte-select';
    import { Modals, openModal, closeModal } from 'svelte-modals';
    import { onMount, onDestroy } from 'svelte';
    import { writable } from 'svelte/store';
    import { slide } from 'svelte/transition';
    import { tick } from 'svelte';
    import 'material-icons/iconfont/material-icons.css';
    
    import { BASE_URL } from '../../utils/urls.js';
    import { pageTitle } from '../../stores/pageTitleStore.js';
    import { dynamicTitlePart, getFullTitle } from '../../stores/htmlTitleStore.js';
    import { user } from '../../stores/userStore.js';
    import { notificationStore } from '../../stores/notificationStore.js';
    import { formatDateUS } from '../../utils/dateFormatting.js';
    import { checkSession } from '../../components/Authorization/Authorization.js';

    import EventModal from './EventModal.svelte';
    import SearchResultModal from './SearchResultModal.svelte';
    import RequestTable from './RequestTable.svelte';

    const socket = io(BASE_URL);

    $: pageTitle.set('Work Planner'), dynamicTitlePart.set($pageTitle), (document.title = getFullTitle($dynamicTitlePart));

    const isSessionChecked = writable(false);

    let calendarRef;
    let calendarApi = null;
    let allEvents = [];
    let allResources = [];
    let selectedEventId = '';
    let resources;
    let selectedResourceIds = [];
    let pendingRequests = [];
    let filteredPendingRequests = [];
    let approvedRequests = [];
    let filteredApprovedRequests = [];
    let rejectedRequests = [];
    let filteredRejectedRequests = [];
    let isCollapseOpen = false;
    let isPendingOpen = false;
    let isApprovedOpen = false;
    let isRejectedOpen = false;
    let searchInput = '';

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
        if (await checkSession()) {
            isSessionChecked.set(true);
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
            if ($user.user.role === 'admin') {
                await fetchAllEventRequests();
            }
        }
    });

    $: selectOptions = allResources.map(resource => ({
        value: resource.id,
        label: resource.title,
    }));

    socket.on('user_changed', async () => {
        if ($user.user.role === 'admin') {
            await fetchUsersData('/admin/get-all-users');
            await fetchEventsData('/admin/get-all-events');
        }
    });

    socket.on('event_changed', async () => {
        if ($user.user.role === 'admin') {
            await fetchEventsData('/admin/get-all-events');
        } else if ($user.user.role === 'user') {
            await fetchEventsData('/user/get-events');
        }
    });

    socket.on('requested_changes', async () => {
        if ($user.user.role === 'admin') {
            await fetchAllEventRequests();
        } else if ($user.user.role === 'user') {
        }
    });

    socket.on('event_request_updated', async () => {
        if ($user.user.role === 'admin') {
            await fetchAllEventRequests();
        } else if ($user.user.role === 'user') {
        }
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
                resourceId: event.resourceId,
                start: event.start,
                end: event.end,
                title: event.title,
                status: event.status,
                description: event.description,
                appraised: event.appraised,
                resourceUsername: event.resourceUsername,
                classNames: `event-${event.status}`,
                userUpdate: event.userUpdate,
            }));
            allEvents = transformedData;
        } catch (error) {
            notificationStore.set({ message: error.message || 'Failed to fetch data', type: 'error' });
        }
    }

    async function fetchAllEventRequests() {
        try {
            let response = await fetch(BASE_URL + '/admin/get-all-event-requests', {
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }

            const result = await response.json();
            const eventRequests = result.data.map(request => {
                const event = allEvents.find(e => e.id === request.eventId);
                return { ...request, eventTitle: event ? event.title : 'Unknown Event' };
            });

            pendingRequests = eventRequests.filter(request => request.handleStatus === 'pending');
            approvedRequests = eventRequests.filter(request => request.handleStatus === 'approved');
            rejectedRequests = eventRequests.filter(request => request.handleStatus === 'rejected');

            requestCount.set(pendingRequests.length);
        } catch (error) {
            notificationStore.set({ message: error.message || 'Failed to fetch data', type: 'error' });
        }
    }

    async function getEventById(eventId) {
        try {
            let response = await fetch(BASE_URL + `/admin/get-event/${eventId}`, {
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }

            const result = await response.json();
            return result.data.event;
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
        goToEvent(eventId);
    }

    function getEmployeeUsernameFromId(resourceId) {
        if (!resourceId) {
            return '';
        }
        const employee = allResources.find(employee => employee.id === resourceId);
        return employee.title;
    }

    async function updateEventInDatabase(eventInfo, calendarApi) {
        const event = calendarApi.getEventById(eventInfo.event.id);

        const resourceId = parseInt(event.getResources().map(resource => resource.id)[0]);
        const employee = allResources.find(employee => employee.id === resourceId);
        const resourceUsernameFromEmployee = employee.title;

        const updatedEvent = {
            id: event.id,
            title: event.title,
            start: formatDateUS(event.start),
            end: formatDateUS(event.end),
            resourceId: resourceId,
            description: event.extendedProps.description,
            status: event.extendedProps.status,
            appraised: event.extendedProps.appraised,
            resourceUsername: resourceUsernameFromEmployee,
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
            notificationStore.set({ message: 'Event updated successfully', type: 'success' });
        } catch (error) {
            notificationStore.set({ message: error.message || 'Failed to update event', type: 'error' });
        }
    }

    function goToNext() {
        let currentDate = calendarApi.getDate();
        if (calendarApi.view.type.includes('Week')) {
            // Move by one week
            let nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 7);
            calendarApi.gotoDate(nextDate);
        } else if (calendarApi.view.type.includes('Month')) {
            // Move by one month
            let nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate());
            calendarApi.gotoDate(nextMonth);
        }
    }

    // Custom function to navigate based on current view
    function goToPrev() {
        let currentDate = calendarApi.getDate();
        if (calendarApi.view.type.includes('Week')) {
            // Move by one week
            let prevDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7);
            calendarApi.gotoDate(prevDate);
        } else if (calendarApi.view.type.includes('Month')) {
            // Move by one month
            let prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate());
            calendarApi.gotoDate(prevMonth);
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
                buttonText: 'Week',
            },
            twoWeeksTimeline: {
                type: 'resourceTimeline',
                duration: { weeks: 2 },
                buttonText: '2 Weeks',
            },
            threeWeeksTimeline: {
                type: 'resourceTimeline',
                duration: { weeks: 3 },
                buttonText: '3 Weeks',
            },
            resourceTimelineMonth: {
                type: 'resourceTimeline',
                duration: { months: 1 },
                buttonText: 'Month',
            },
        },
        buttonText: {
            today: 'Today',
        },
        headerToolbar: {
            left: 'customPrev,customNext today',
            center: 'title',
            right: 'resourceTimelineWeek,twoWeeksTimeline,threeWeeksTimeline,resourceTimelineMonth',
        },
        customButtons: {
            customPrev: {
                text: '<',
                click: goToPrev,
            },
            customNext: {
                text: '>',
                click: goToNext,
            },
        },
        locale: 'en',
        firstDay: 1,
        hiddenDays: [0, 6],
        editable: $user.user.role === 'admin',
        eventResizableFromStart: $user.user.role === 'admin',
        droppable: $user.user.role === 'admin',
        eventResourceEditable: $user.user.role === 'admin',
        eventDrop: $user.user.role === 'admin' ? eventInfo => updateEventInDatabase(eventInfo, calendarApi) : null,
        eventResize: $user.user.role === 'admin' ? eventInfo => updateEventInDatabase(eventInfo, calendarApi) : null,
        eventClick: async function (clickInfo) {
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
                resourceUsername: event.extendedProps.resourceUsername,
            };

            openModal(EventModal, {
                initialResource: eventData,
                employees: allResources,
                isEditMode: true,
                eventRequests: await getAllEventRequestsById(event.id),
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
                arrowElement.style.textShadow = '0px 0px 3px #000000';
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

            if ($user.user.role === 'admin' && arg.event.extendedProps.userUpdate === 1) {
                const notification = document.createElement('div');
                notification.innerHTML = '!';
                notification.style.position = 'absolute';
                notification.style.top = '-10px';
                notification.style.right = '-10px';
                notification.style.width = '25px';
                notification.style.height = '25px';
                notification.style.backgroundColor = 'red';
                notification.style.color = 'white';
                notification.style.borderRadius = '50%';
                notification.style.display = 'flex';
                notification.style.alignItems = 'center';
                notification.style.justifyContent = 'center';
                notification.style.fontWeight = 'bold';
                notification.style.cursor = 'pointer';

                element.appendChild(notification);
            }

            return { domNodes: [element] };
        },

        slotLabelFormat: getSlotLabelFormat(window.innerWidth),
        resourceAreaHeaderContent: 'Employees:',
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

    async function goToEvent(eventId) {
        let event = allEvents.find(e => e.id === eventId);

        calendarApi.gotoDate(event.start);
        selectedEventId = eventId;

        await tick();
        scrollToCalendar();
    }

    function scrollToCalendar() {
        const calendarElement = document.getElementById('my-fullcalendar');
        if (calendarElement) {
            calendarElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    async function openEventModalFromRequestsList(eventId) {
        const event = await getEventById(eventId);

        const eventData = {
            id: event[0].id,
            title: event[0].title,
            start: event[0].start,
            end: event[0].end,
            resourceId: event[0].resource_id,
            description: event[0].description,
            status: event[0].status,
            appraised: event[0].appraised,
            resourceUsername: event[0].resource_username,
        };

        openModal(EventModal, {
            initialResource: eventData,
            employees: allResources,
            isEditMode: true,
            eventRequests: await getAllEventRequestsById(eventId),
        });
    }

    async function getAllEventRequestsById(eventId) {
        try {
            let response = await fetch(BASE_URL + `/user/get-all-event-requests-by-id/${eventId}`, {
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }

            const result = await response.json();

            return result.data;
        } catch (error) {
            notificationStore.set({ message: error.message || 'Failed to fetch data', type: 'error' });
        }
    }

    $: {
        if (searchInput.trim()) {
            const searchValue = searchInput.trim().toLowerCase();
            filteredRejectedRequests = rejectedRequests.filter(
                request =>
                    request.requesterUsername.toLowerCase().includes(searchValue) ||
                    request.reasonForChange.toLowerCase().includes(searchValue) ||
                    request.eventTitle.toLowerCase().includes(searchValue) ||
                    request.reasonForRejection.toLowerCase().includes(searchValue) ||
                    getEmployeeUsernameFromId(request.handledById)?.toLowerCase().includes(searchValue) ||
                    false
            );
            filteredApprovedRequests = approvedRequests.filter(
                request =>
                    request.requesterUsername.toLowerCase().includes(searchValue) ||
                    request.reasonForChange.toLowerCase().includes(searchValue) ||
                    request.eventTitle.toLowerCase().includes(searchValue) ||
                    request.reasonForRejection.toLowerCase().includes(searchValue) ||
                    getEmployeeUsernameFromId(request.handledById)?.toLowerCase().includes(searchValue) ||
                    false
            );
            filteredPendingRequests = pendingRequests.filter(
                request =>
                    request.requesterUsername.toLowerCase().includes(searchValue) ||
                    request.reasonForChange.toLowerCase().includes(searchValue) ||
                    request.eventTitle.toLowerCase().includes(searchValue) ||
                    request.reasonForRejection.toLowerCase().includes(searchValue) ||
                    getEmployeeUsernameFromId(request.handledById)?.toLowerCase().includes(searchValue) ||
                    false
            );
        } else {
            filteredRejectedRequests = rejectedRequests;
            filteredApprovedRequests = approvedRequests;
            filteredPendingRequests = pendingRequests;
        }
    }
</script>

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

                <button class=" grey-btn clear-btn" on:click={clearSelections}>Clear</button>
            </div>
            <button class="create-event-btn" on:click={() => openEventModal({ resource: null })}>Create Event</button>
        {/if}
        <button on:click={() => openSearchResultModal()}>Search</button>
        {#if $user.user.role === 'admin'}
            <div class="reset-button-container">
                <button on:click={() => (isCollapseOpen = !isCollapseOpen)}>{isCollapseOpen ? 'Hide Requests' : 'Show Requests'}</button>
                {#if $requestCount > 0}
                    <div class="notification-icon">{$requestCount}</div>
                {/if}
            </div>
        {/if}
    </div>
    <div in:slide={{ duration: 300 }} class="collapsible-content" class:visible={isCollapseOpen}>
        <div id="requests-div" class="requests-div">
            <input id="request-search-field" type="text" placeholder="Search Requests..." bind:value={searchInput} />
            <div class="request-section">
                <h4 class="request-header pending-requests-header">Pending Requests</h4>
                <button class="toggle-button pending-toggle" on:click={() => (isPendingOpen = !isPendingOpen)}
                    >{isPendingOpen ? 'Hide Pending Requests' : 'Show Pending Requests'}</button
                >
            </div>
            {#if isPendingOpen}
                <div in:slide={{ duration: 300 }}>
                    <RequestTable
                        type="pending"
                        requests={filteredPendingRequests}
                        {goToEvent}
                        {getEmployeeUsernameFromId}
                        {openEventModalFromRequestsList}
                        {allEvents}
                    />
                </div>
            {/if}
            <div class="request-section">
                <h4 class="request-header approved-requests-header">Approved Requests</h4>
                <button class="toggle-button approved-toggle" on:click={() => (isApprovedOpen = !isApprovedOpen)}
                    >{isApprovedOpen ? 'Hide Approved Requests' : 'Show Approved Requests'}</button
                >
            </div>
            {#if isApprovedOpen}
                <div in:slide={{ duration: 300 }}>
                    <RequestTable
                        type="approved"
                        requests={filteredApprovedRequests}
                        {goToEvent}
                        {getEmployeeUsernameFromId}
                        {openEventModalFromRequestsList}
                    />
                </div>
            {/if}

            <div class="request-section">
                <h4 class="request-header rejected-requests-header">Rejected Requests</h4>
                <button class="toggle-button rejected-toggle" on:click={() => (isRejectedOpen = !isRejectedOpen)}
                    >{isRejectedOpen ? 'Hide Rejected Requests' : 'Show Rejected Requests'}</button
                >
            </div>
            {#if isRejectedOpen}
                <div in:slide={{ duration: 300 }}>
                    <RequestTable
                        type="rejected"
                        requests={filteredRejectedRequests}
                        {goToEvent}
                        {getEmployeeUsernameFromId}
                        {openEventModalFromRequestsList}
                    />
                </div>
            {/if}
        </div>
    </div>
    <div id="my-fullcalendar">
        <FullCalendar bind:this={calendarRef} {options} class="my-calendar" />
    </div>
{/if}

<style>
    :global(.fc-resource-timeline) {
        border: 2px solid #6c6c6c !important;
        border-radius: 8px !important;
        padding: 5px;
    }

    :global(.my-calendar) {
        height: 80vh !important;
        width: 100% !important;
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
        border-left: 5px solid #ff9500 !important;
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

    .header-controls button {
        height: 40px;
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

    .collapsible-content {
        margin-bottom: 5px;
    }

    .collapsible-content.visible {
        background-color: #2d2d2d;
        border-radius: 8px;
        border: 2px solid #6c6c6c;
        min-height: 70vh;
        margin-top: 25px;
        margin-bottom: 20px;
        overflow: auto;
    }

    .requests-div {
        overflow: auto;
        padding-bottom: 20px;
        margin-bottom: 20px;
    }

    .request-header {
        font-size: 1.2em;
        font-weight: bold;
        margin: 10px 0;
        padding: 5px;
        border-radius: 4px;
        text-align: center;
        width: 20%;
        margin: 20px auto;
    }

    .pending-requests-header {
        background-color: #ff9500;
        color: #2d2d2d;
    }

    .approved-requests-header {
        background-color: #4caf50;
        color: #fff;
    }

    .rejected-requests-header {
        background-color: #f44336;
        color: #fff;
    }

    .request-section {
        align-items: center;
        justify-content: space-between;
        padding: 0 10px;
    }

    .toggle-button {
        padding: 5px 10px;
        border: none;
        cursor: pointer;
        border-radius: 4px;
        font-weight: bold;
        margin-left: 10px;
        margin-bottom: 15px;
    }

    .pending-toggle {
        background-color: #ff9500;
        color: #2d2d2d;
    }

    .approved-toggle {
        background-color: #4caf50;
        color: #fff;
    }

    .rejected-toggle {
        background-color: #f44336;
        color: #fff;
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
