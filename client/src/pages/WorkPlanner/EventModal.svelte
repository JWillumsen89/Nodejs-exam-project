<script>
    import { notificationStore } from '../../stores/notificationStore.js';
    import { writable } from 'svelte/store';
    import { onMount } from 'svelte';
    import { BASE_URL } from '../../components/Urls.js';
    import { user } from '../../stores/userStore.js';
    import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
    import { faTrashAlt } from '@fortawesome/free-solid-svg-icons';
    import { Modals, openModal, closeModal } from 'svelte-modals';

    export let isOpen;
    export let initialResource;
    export let employees;
    export let isEditMode = false;

    let isUser = false;

    let showModal = false;

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
    });

    onMount(() => {
        const today = new Date();
        const defaultStartDate = formatDate(today);
        const defaultEndDate = formatDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1));

        const startDate = initialResource && initialResource.start ? formatDate(new Date(initialResource.start)) : defaultStartDate;
        const endDate = initialResource && initialResource.end ? formatDate(new Date(initialResource.end)) : defaultEndDate;

        eventFormData.set({
            ...$eventFormData,
            id: initialResource && initialResource.id ? initialResource.id : null,
            title: initialResource && initialResource.title ? initialResource.title : '',
            description: initialResource && initialResource.description ? initialResource.description : '',
            status: initialResource && initialResource.status ? initialResource.status : '',
            appraised: initialResource && initialResource.appraised ? initialResource.appraised : 0,
            startDate: startDate,
            endDate: subtractOneDayForDisplay(endDate),
            resourceId: initialResource && initialResource.resourceId ? parseInt(initialResource.resourceId) : null,
        });
    });

    $: if ($eventFormData.startDate && new Date($eventFormData.endDate) < new Date($eventFormData.startDate)) {
        $eventFormData.endDate = $eventFormData.startDate;
    }

    function subtractOneDayForDisplay(dateString) {
        const date = new Date(dateString);
        date.setDate(date.getDate() - 1);
        return formatDate(date);
    }

    function addOneDay(dateString) {
        const date = new Date(dateString);
        date.setDate(date.getDate() + 1);
        return formatDate(date);
    }

    function formatDate(date) {
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    }

    async function handleEventSubmission(event) {
        event.preventDefault();
        const { id, title, startDate, endDate, resourceId, description, status, appraised } = $eventFormData;

        if (!title || !startDate || !endDate || !resourceId || !description || !status) {
            notificationStore.set({ message: 'Please fill in all fields', type: 'error' });
            return;
        }

        const endDateTime = new Date(endDate);
        endDateTime.setDate(endDateTime.getDate() + 1);
        const actualEndDate = new Date($eventFormData.endDate);
        const adjustedEndDate = formatDate(actualEndDate);
        const startDateTime = new Date(startDate);
        const adjustedStartDate = formatDate(startDateTime);
        const addedOneDayToEndDate = addOneDay(adjustedEndDate);

        const eventData = {
            title,
            start: adjustedStartDate,
            end: addedOneDayToEndDate,
            resourceId,
            description,
            status,
            appraised,
        };

        if (isEditMode) {
            eventData.id = id;
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

            const data = await response.json();
        } catch (error) {
            notificationStore.set({ message: error.message, type: 'error' });
        } finally {
            closeModal();
            notificationStore.set({ message: `Event ${isEditMode ? 'updated' : 'created'} successfully!`, type: 'success' });
        }
    }
    function deleteEvent() {
        showModal = true;
    }

    async function sendRequest(event) {
        event.stopPropagation();
        try {
            const { id, title, startDate, endDate, resourceId, description, status, appraised } = $eventFormData;

            const endDateTime = new Date(endDate);
            endDateTime.setDate(endDateTime.getDate() + 1);
            const actualEndDate = new Date($eventFormData.endDate);
            const adjustedEndDate = formatDate(actualEndDate);
            const startDateTime = new Date(startDate);
            const adjustedStartDate = formatDate(startDateTime);
            const addedOneDayToEndDate = addOneDay(adjustedEndDate);

            const eventData = {
                title,
                start: adjustedStartDate,
                end: addedOneDayToEndDate,
                resourceId,
                description,
                status,
                appraised,
                id,
            };

            const response = await fetch(BASE_URL + '/user/send-request', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(eventData),
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
        <div class="modal-backdrop">
            <div class="confirmation-modal">
                <p>Are you sure you want to delete this event?</p>
                <button on:click={confirmDelete}>Yes, Delete</button>
                <button on:click={cancelAndCloseModal}>Cancel</button>
            </div>
        </div>
    {/if}
    <div role="dialog" class="modal">
        <div class="contents form-container">
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
                    <textarea id="description" bind:value={$eventFormData.description} placeholder="Enter Description..." />
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
                    <button type="button" on:click={closeModal}>Cancel</button>
                </div>
            </form>
            {#if $user.user.role === 'user'}
                <div class="request-btn-div">
                    <button on:click={event => sendRequest(event)}>Send Request</button>
                </div>
            {/if}
        </div>
    </div>
{/if}

<style>
    .modal {
        position: fixed;
        top: 0;
        bottom: 0;
        right: 0;
        left: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        pointer-events: none;
        z-index: 50;
        background: rgba(0, 0, 0, 0.5);
    }

    .contents {
        width: 40vw;
        min-width: 250px;
        max-width: 500px;
        padding: 20px;
        padding-top: 10px;
        background: #2d2d2d;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        pointer-events: auto;
        color: white;
        @media (max-height: 1200px) {
            max-height: 80vh;
            overflow-y: auto;
        }
        position: relative;
    }

    h2 {
        text-align: center;
        font-size: 24px;
        margin-bottom: 20px;
        margin-top: 0;
        color: #ff9500;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        margin-bottom: 15px;
    }

    .form-group label {
        margin-bottom: 5px;
        font-size: 16px;
        color: #fff;
    }

    input {
        width: 100%;
        padding: 10px;
        box-sizing: border-box;
        border-radius: 4px;
        border: 1px solid #555;
        background-color: #333;
        color: #fff;
        font-size: 14px;
    }

    input:focus {
        border-color: #ff9500;
        outline: none;
        box-shadow: 0 0 3px #ff9500;
    }

    input:disabled {
        background: linear-gradient(to bottom, rgba(255, 255, 255, 0.1), rgba(200, 200, 200, 0.1));
        color: #888;
    }

    button {
        padding: 10px 20px;
        background-color: #ff9500;
        color: #fff;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.3s ease;
        margin: 0 10px 0 10px;
    }

    button:hover {
        background-color: #cc7a00;
    }

    button:last-child {
        background-color: #404040;
    }

    button:last-child:hover {
        background-color: #777;
    }

    button:disabled {
        background-color: #777;
        cursor: default;
    }

    textarea {
        width: 100%;
        padding: 10px;
        box-sizing: border-box;
        border-radius: 4px;
        border: 1px solid #555;
        background-color: #333;
        color: #fff;
        font-size: 14px;
        line-height: normal;
        height: calc(1.2em * 15);
        resize: none;
    }

    textarea:focus {
        border-color: #ff9500;
        outline: none;
        box-shadow: 0 0 3px #ff9500;
    }

    textarea:disabled {
        background: linear-gradient(to bottom, rgba(255, 255, 255, 0.1), rgba(200, 200, 200, 0.1));
        color: #888;
    }

    select {
        width: 100%;
        padding: 10px;
        box-sizing: border-box;
        border-radius: 4px;
        border: 1px solid #555;
        background-color: #333;
        color: #fff;
        font-size: 14px;
        background-repeat: no-repeat;
        background-position: right 10px center;
    }

    select:focus {
        border-color: #ff9500;
        outline: none;
        box-shadow: 0 0 3px #ff9500;
    }

    select:hover {
        background-color: #444;
    }

    select:disabled {
        background: linear-gradient(to bottom, rgba(255, 255, 255, 0.1), rgba(200, 200, 200, 0.1));
        color: #888;
    }

    .dates-group,
    .status-group {
        display: flex;
        align-items: center;
        gap: 20px;
        justify-content: flex-start;
    }

    .delete-icon {
        background: none;
        border: none;
        top: 10px;
        right: 10px;
        cursor: pointer;
        color: #ff9500;
        position: absolute;
    }

    .delete-icon:hover {
        background: none;
        border: none;
        top: 10px;
        right: 10px;
        cursor: pointer;
        color: #ff9500;
        position: absolute;
    }
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
    }

    .confirmation-modal {
        width: 30vw;
        min-width: 200px;
        max-width: 400px;
        background: #2d2d2d;
        padding: 20px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        color: white;
    }

    .confirmation-modal p {
        text-align: center;
        margin-bottom: 20px;
    }

    .confirmation-modal button {
        padding: 10px 20px;
        margin: 0 10px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.3s ease;
    }

    .confirmation-modal button:hover {
        background-color: #cc7a00;
    }
    .request-btn-div {
        margin-top: 20px;
        display: flex;
        justify-content: center;
    }
    .request-btn-div button {
        padding: 10px 20px;
        background-color: #ff9500;
        color: #fff;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.3s ease;
        margin: 0 10px 0 10px;
    }
</style>
