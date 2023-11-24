<script>
    import { closeModal } from 'svelte-modals';
    import { notificationStore } from '../../stores/notificationStore.js';
    import { writable } from 'svelte/store';
    import { onMount } from 'svelte';
    import { BASE_URL } from '../../components/Urls.js';
    import { user } from '../../stores/userStore.js';

    export let isOpen;
    export let initialResource;
    export let employees;
    export let isEditMode = false;
    export let eventId;

    let isUser = false; // Initialize isUser to false by default

    // Check if the user's role is 'user' and set isUser accordingly
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
    });

    onMount(() => {
        console.log('initialResource', initialResource);
        console.log('Employees:', employees);

        const today = new Date();
        const defaultStartDate = formatDate(today);
        const defaultEndDate = formatDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)); // Default to tomorrow

        const startDate = initialResource && initialResource.start ? formatDate(new Date(initialResource.start)) : defaultStartDate;
        const endDate = initialResource && initialResource.end ? formatDate(new Date(initialResource.end)) : defaultEndDate;

        eventFormData.set({
            ...$eventFormData,
            id: initialResource && initialResource.id ? initialResource.id : null,
            title: initialResource && initialResource.title ? initialResource.title : '',
            description: initialResource && initialResource.description ? initialResource.description : '',
            status: initialResource && initialResource.status ? initialResource.status : '',
            startDate: startDate,
            endDate: endDate,
            resourceId: initialResource && initialResource.resourceId ? parseInt(initialResource.resourceId) : null,
        });
    });

    $: if ($eventFormData.startDate && new Date($eventFormData.endDate) < new Date($eventFormData.startDate)) {
        $eventFormData.endDate = $eventFormData.startDate;
    }

    function formatDate(date) {
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    }

    async function handleEventSubmission(event) {
        event.preventDefault();
        const { id, title, startDate, endDate, resourceId, description, status } = $eventFormData;

        if (!title || !startDate || !endDate || !resourceId || !description || !status) {
            notificationStore.set({ message: 'Please fill in all fields', type: 'error' });
            return;
        }

        const endDateTime = new Date(endDate);
        endDateTime.setDate(endDateTime.getDate() + 1);
        const adjustedEndDate = formatDate(endDateTime);
        const startDateTime = new Date(startDate);
        const adjustedStartDate = formatDate(startDateTime);

        const eventData = {
            title,
            start: adjustedStartDate,
            end: adjustedEndDate,
            resourceId,
            description,
            status,
        };

        if (isEditMode) {
            console.log('Event ID in edit mode:', eventId);
            eventData.id = id;
        }
        console.log('Event Data:', eventData);

        try {
            const endpoint = isEditMode ? '/user/update-event' : '/admin/create-event';
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
</script>

{#if isOpen}
    <div role="dialog" class="modal">
        <div class="contents form-container">
            <h2>{isEditMode ? 'Update Event' : 'Create Event'}</h2>
            <form on:submit={handleEventSubmission}>
                <div class="form-group">
                    <label for="eventTitle">Event Title:</label>
                    <input id="eventTitle" type="text" bind:value={$eventFormData.title} placeholder="Enter Event Title..." disabled={isUser} />
                </div>
                <div class="form-group">
                    <label for="startDate">Start Date:</label>
                    <input id="startDate" type="date" max={$eventFormData.endDate} bind:value={$eventFormData.startDate} disabled={isUser} />
                </div>
                <div class="form-group">
                    <label for="endDate">End Date:</label>
                    <input id="endDate" type="date" min={$eventFormData.startDate} bind:value={$eventFormData.endDate} disabled={isUser} />
                </div>
                <div class="form-group">
                    <label for="description">Description:</label>
                    <textarea id="description" bind:value={$eventFormData.description} placeholder="Enter Description..." />
                </div>
                <div class="form-group">
                    <label for="status">Status:</label>
                    <select id="status" bind:value={$eventFormData.status}>
                        <option value={''} disabled>Select Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="denied">Denied</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="resourceSelect">Resource:</label>
                    <select id="resourceSelect" bind:value={$eventFormData.resourceId} disabled={isUser} >
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
        height: calc(1.2em * 20);
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

    @media (max-width: 768px) {
        .contents {
            margin-top: 20px;
            width: 70%;
        }
    }
</style>
