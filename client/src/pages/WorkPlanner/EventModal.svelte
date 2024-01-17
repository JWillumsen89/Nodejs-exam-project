<script>
    import { notificationStore } from '../../stores/notificationStore.js';
    import { writable } from 'svelte/store';
    import { onMount } from 'svelte';
    import { BASE_URL } from '../../utils/urls.js';
    import { user } from '../../stores/userStore.js';
    import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
    import { faTrashAlt } from '@fortawesome/free-solid-svg-icons';
    import { closeModal } from 'svelte-modals';
    import { slide } from 'svelte/transition';
    import { formatDateEuropean, formatDateUS, addOneDay, subtractOneDay } from '../../utils/dateFormatting.js';
    import { capitalizeFirstLetter } from '../../utils/stringFormatting.js';

    export let isOpen;
    export let initialResource;
    export let employees;
    export let isEditMode = false;
    export let eventRequests = [];

    let isCreateChangeRequestOpen = false;
    let isRequestHistoryOpen = false;
    let isUser = false;
    let showModal = false;
    let initialDescription = '';

    if ($user.user.role === 'user') {
        isUser = true;
    }

    const eventFormData = writable({
        id: null,
        title: '',
        startDate: null,
        endDate: null,
        resourceId: null,
        description: '',
        status: '',
        appraised: 0,
        resourceUsername: '',
    });

    const requestFormData = writable({
        reasonForChange: '',
        requestNewEndDate: null,
    });

    onMount(() => {
        const today = new Date();
        const defaultStartDate = formatDateUS(today);
        const defaultEndDate = formatDateUS(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1));

        const startDate = initialResource && initialResource.start ? formatDateUS(new Date(initialResource.start)) : defaultStartDate;
        const endDate = initialResource && initialResource.end ? formatDateUS(new Date(initialResource.end)) : defaultEndDate;

        initialDescription = initialResource && initialResource.description ? initialResource.description : '';

        eventFormData.set({
            ...$eventFormData,
            id: initialResource && initialResource.id ? initialResource.id : null,
            title: initialResource && initialResource.title ? initialResource.title : '',
            description: initialResource && initialResource.description ? initialResource.description : '',
            status: initialResource && initialResource.status ? initialResource.status : '',
            appraised: initialResource && initialResource.appraised ? initialResource.appraised : 0,
            startDate: startDate,
            endDate: formatDateUS(subtractOneDay(endDate)),
            resourceId: initialResource && initialResource.resourceId ? parseInt(initialResource.resourceId) : null,
            resourceUsername: initialResource && initialResource.resourceUsername ? initialResource.resourceUsername : '',
        });

        requestFormData.set({
            ...$requestFormData,
            requestNewEndDate: $eventFormData.endDate,
        });
    });

    $: if ($eventFormData.startDate && new Date($eventFormData.endDate) < new Date($eventFormData.startDate)) {
        $eventFormData.endDate = $eventFormData.startDate;
    }

    async function handleEventSubmission(event) {
        event.preventDefault();
        const { id, title, startDate, endDate, resourceId, description, status, appraised } = $eventFormData;

        if (!title || !startDate || !endDate || !resourceId || !description || !status) {
            notificationStore.set({ message: 'Please fill in all fields', type: 'error' });
            return;
        }

        const adjustedStartDate = formatDateUS(new Date(startDate));
        const addedOneDayToEndDate = formatDateUS(addOneDay(formatDateUS(new Date($eventFormData.endDate))));

        const employee = employees.find(employee => employee.id === resourceId);
        const resourceUsernameFromEmployee = employee.title;

        const eventData = {
            title,
            start: adjustedStartDate,
            end: addedOneDayToEndDate,
            resourceId,
            description,
            status,
            appraised,
            resourceUsername: resourceUsernameFromEmployee,
        };

        if (isEditMode) {
            eventData.id = id;
        }

        const descriptionChanged = $eventFormData.description !== initialDescription;

        if ($user.user.role === 'user' && descriptionChanged) {
            eventData.userUpdate = true;
        } else {
            eventData.userUpdate = false;
        }

        try {
            let endpoint = null;
            if ($user.user.role === 'user') {
                endpoint = '/user/update-event';
            } else if ($user.user.role === 'admin') {
                endpoint = isEditMode ? '/admin/update-event' : '/admin/create-event';
            }

            const response = await fetch(BASE_URL + endpoint, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(eventData),
            });

            if (!response.ok) {
                throw new Error(`Error ${isEditMode ? 'updating' : 'creating'} event ` + response.statusText);
            }
            notificationStore.set({ message: `Event ${isEditMode ? 'updated' : 'created'} successfully!`, type: 'success' });
        } catch (error) {
            notificationStore.set({ message: error.message, type: 'error' });
        } finally {
            closeModal();
        }
    }
    function deleteEvent() {
        showModal = true;
    }

    async function sendRequest(event) {
        event.stopPropagation();
        try {
            const addedOneDayToEndDate = formatDateUS(addOneDay(formatDateUS(new Date($requestFormData.requestNewEndDate))));

            const data = {
                eventId: $eventFormData.id,
                requesterId: $user.user.id,
                requesterUsername: $user.user.username,
                handleStatus: 'pending',
                handledById: null,
                reasonForChange: $requestFormData.reasonForChange,
                requestNewEndDate: addedOneDayToEndDate,
            };

            const response = await fetch(BASE_URL + '/user/send-request', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            notificationStore.set({ message: 'Event request successfully sent', type: 'success' });
        } catch (error) {
            notificationStore.set({ message: error.message || 'Failed to send event request', type: 'error' });
        }
    }

    async function confirmDelete() {
        try {
            const endpoint = '/admin/delete-event';
            const response = await fetch(BASE_URL + endpoint, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: $eventFormData.id }),
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            showModal = false;
            isOpen = false;
            notificationStore.set({ message: `Event deleted successfully!`, type: 'success' });
        } catch (error) {
            notificationStore.set({ message: error.message, type: 'error' });
        }
        showModal = false;
        closeModal();
    }

    function cancelAndCloseModal() {
        showModal = false;
    }

</script>

{#if isOpen}
    {#if showModal}
        <div class="confirmation-modal-backdrop">
            <div class="confirmation-modal">
                <p>Are you sure you want to delete this event?</p>
                <button on:click={confirmDelete}>Yes, Delete</button>
                <button class="grey-btn" on:click={cancelAndCloseModal}>Cancel</button>
            </div>
        </div>
    {/if}
    <div role="dialog" class="modal">
        <div class="content form-container">
            <h2>{isEditMode ? 'Update Event' : 'Create Event'}</h2>
            {#if $user.user.role === 'admin' && isEditMode}
                <button class="delete-icon" on:click={deleteEvent}>
                    <FontAwesomeIcon icon={faTrashAlt} size="lg" />
                </button>
            {/if}
            <form on:submit={handleEventSubmission}>
                <div class="form-group">
                    <label for="event-title">Event Title:</label>
                    <input id="event-title" type="text" bind:value={$eventFormData.title} placeholder="Enter Event Title..." disabled={isUser} />
                </div>
                <div class="dates-group">
                    <div class="form-group">
                        <label for="start-date">Start Date:</label>
                        <input id="start-date" type="date" bind:value={$eventFormData.startDate} disabled={isUser} />
                    </div>
                    <div class="form-group">
                        <label for="end-date">End Date:</label>
                        <input id="end-date" type="date" bind:value={$eventFormData.endDate} disabled={isUser} />
                    </div>
                </div>
                <div class="form-group">
                    <label for="description">Description:</label>
                    <textarea id="description" class="description-textarea" bind:value={$eventFormData.description} placeholder="Enter Description..." />
                </div>
                <div class="status-group">
                    <div class="form-group">
                        <label for="status">Status:</label>
                        <select id="status" bind:value={$eventFormData.status}>
                            <option value={''} disabled>Select Status</option>
                            <option value="booked">Booked</option>
                            <option value="arrived">Arrived</option>
                            <option value="appraisal">Appraisal</option>
                            <option value="awaitingappraiserapproval">Awaiting Appraiser Approval</option>
                            <option value="awaitingcustomerapproval">Awaiting Customer Approval</option>
                            <option value="disassembly">Disassembly</option>
                            <option value="waitingforparts">Waiting For Parts</option>
                            <option value="repair">Repair</option>
                            <option value="painter">Painter</option>
                            <option value="returnpainter">Return Painter</option>
                            <option value="assembly">Assembly</option>
                            <option value="preparation">Preparation</option>
                            <option value="calledready">Called Ready</option>
                            <option value="deliveredtocustomer">Delivered To Customer</option>
                            <option value="totalloss">Total Loss</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="appraised">Appraised:</label>
                        <select id="appraised" bind:value={$eventFormData.appraised}>
                            <option value={0}>No</option>
                            <option value={1}>Yes</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label for="resource-select">Resource:</label>
                    <select id="resource-select" bind:value={$eventFormData.resourceId} disabled={isUser}>
                        {#if initialResource === null}
                            <option value={null} disabled>Select Resource</option>
                        {/if}
                        {#each employees as employee}
                            <option value={employee.id}>{employee.title}</option>
                        {/each}
                    </select>
                </div>
                <div class="actions">
                    <button type="submit">{isEditMode ? 'Update' : 'Create'} Event</button>
                    <button class="grey-btn" type="button" on:click={closeModal}>Cancel</button>
                </div>
            </form>
            {#if $user.user.role === 'user'}
                <div class="request-div">
                    <div class="request-btn-div">
                        <button on:click={() => (isCreateChangeRequestOpen = !isCreateChangeRequestOpen)}
                            >{isCreateChangeRequestOpen ? 'Cancel Change Request' : 'Create Change Request'}</button
                        >
                    </div>
                    <div in:slide={{ duration: 300 }} class="collapsible-content" class:visible={isCreateChangeRequestOpen}>
                        <div class="requests-div">
                            <h2>Create Change Request</h2>
                            <form on:submit={event => sendRequest(event)}>
                                <div class="form-group">
                                    <label for="reason-for-change">Reason for Change:</label>
                                    <textarea
                                        class="request-textarea"
                                        id="reason-for-change"
                                        required
                                        bind:value={$requestFormData.reasonForChange}
                                        placeholder="Enter reason for change"
                                    />
                                </div>
                                <div class="form-group">
                                    <label for="new-end-date">New End Date:</label>
                                    <input id="new-end-date" type="date" min={$eventFormData.startDate} bind:value={$requestFormData.requestNewEndDate} />
                                </div>
                                <button type="submit">Send Request</button>
                            </form>
                        </div>
                    </div>
                </div>
            {/if}
            {#if isEditMode}
                <div class="request-div">
                    <div class="request-btn-div">
                        <button on:click={() => (isRequestHistoryOpen = !isRequestHistoryOpen)}
                            >{isRequestHistoryOpen ? 'Hide Request History' : 'Show Request History'}</button
                        >
                    </div>
                    <div in:slide={{ duration: 300 }} class="collapsible-content" class:visible={isRequestHistoryOpen}>
                        <div class="requests-div">
                            <h2>Request History</h2>
                            <table class="request-table">
                                <thead>
                                    <tr>
                                        <th>Status</th>
                                        <th>Request By</th>
                                        <th>Request Created</th>
                                        <th>Change Reason</th>
                                        <th>New End Date</th>
                                        <th>Handled By</th>
                                        <th>Handled (Date)</th>
                                        <th>Handling Reason/Comment</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {#each eventRequests as request}
                                        <tr>
                                            <td>{capitalizeFirstLetter(request.handleStatus)}</td>
                                            <td>{request.requesterUsername}</td>
                                            <td>{formatDateEuropean(request.createdAt, true)}</td>
                                            <td>{request.reasonForChange}</td>
                                            <td>{formatDateEuropean(subtractOneDay(request.requestNewEndDate), false)}</td>
                                            <td>{request.handledByUsername !== null ? request.handledByUsername : ''}</td>
                                            <td>{request.handleAt !== null ? formatDateEuropean(request.handleAt, true) : ''}</td>
                                            <td>{request.reason !== null ? request.reason : ''}</td>
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            {/if}
        </div>
    </div>
{/if}

<style>
    .content {
        width: 70vw;
        min-width: 250px;
        max-width: 1200px;
        padding: 20px;
        padding-top: 10px;
        background: #2d2d2d;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        pointer-events: auto;
        color: white;
        max-height: 80vh;
        overflow-y: auto;
        @media (max-height: 1200px) {
            max-height: 80vh;
            overflow-y: auto;
        }
        position: relative;
    }

    button {
        margin: 0 10px 0 10px;
    }

    .description-textarea {
        height: calc(1.2em * 15);
    }

    .request-textarea {
        height: calc(1.2em * 5);
    }

    .dates-group,
    .status-group {
        display: flex;
        align-items: center;
        gap: 20px;
        justify-content: flex-start;
    }

    .grey-btn {
        margin-top: 10px;
    }

    .request-div {
        margin-top: 30px;
        background: #232221;
        padding: 20px;
        border-radius: 8px;
    }

    .request-btn-div {
        display: flex;
        justify-content: center;
        margin-bottom: 20px;
    }

    .collapsible-content.visible {
        min-height: 400px;
        max-height: 600px;
        overflow-y: auto;
    }
    .request-table tr:hover td {
        background-color: #4a4a4a;
    }

    .request-table {
        table-layout: fixed;
        width: 100%;
        border-collapse: collapse;
        margin: auto;
        border-radius: 8px;
        box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);
        overflow-y: auto;
        display: table;
    }

    .request-table th,
    .request-table td {
        background-color: #3a3a3a;
        text-align: left;
        padding: 8px;
        border-bottom: 1px solid #444;
        min-width: 155px;
        max-width: 200px;
        word-wrap: break-word;
        overflow-wrap: break-word;
    }

    .request-table td:empty {
        background-color: #2e2e2e;
        color: #757575;
    }

    .request-table td:empty::before {
        content: 'None';
        display: block;
        text-align: center;
    }

    .request-table tr:hover td:empty {
        background-color: #414141;
    }
</style>
