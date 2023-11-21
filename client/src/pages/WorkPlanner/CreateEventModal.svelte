<script>
    import { closeModal } from 'svelte-modals';
    import { notificationStore } from '../../stores/notificationStore.js';
    import { writable } from 'svelte/store';
    import { onMount } from 'svelte';

    export let isOpen;
    export let calendar;
    export let initialResource;

    export let employees;

    const eventFormData = writable({
        title: '',
        startDate: null,
        endDate: null,
        resourceId: null,
    });

    onMount(() => {
        const startDate = formatDate(initialResource.start);

        const endDate = new Date(initialResource.end);
        endDate.setDate(endDate.getDate() - 1);
        const formattedEndDate = formatDate(endDate);

        eventFormData.set({
            title: '',
            startDate: startDate,
            endDate: formattedEndDate,
            resourceId: parseInt(initialResource.id),
        });
        console.log('initialResource:', initialResource);
    });

    function formatDate(date) {
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    }

    async function createEvent(event) {
        event.preventDefault();
        const { title, startDate, endDate, resourceId } = $eventFormData;

        if (!title || !startDate || !endDate || !resourceId) {
            notificationStore.set({ message: 'Please fill in all fields', type: 'error' });
            return;
        }

        const endDateTime = new Date(endDate);
        endDateTime.setDate(endDateTime.getDate() + 1);
        const adjustedEndDate = formatDate(endDateTime);

        console.log('All data: ', title, startDate, adjustedEndDate, resourceId);
        calendar.addEvent({
            title: title,
            start: startDate,
            end: adjustedEndDate,
            resourceId: resourceId,
        });

        closeModal();
        notificationStore.set({ message: 'Event successfully created!', type: 'success' });
    }
</script>

{#if isOpen}
    <div role="dialog" class="modal">
        <div class="contents form-container">
            <h2>Create Event</h2>
            <form on:submit={createEvent}>
                <div class="form-group">
                    <label for="eventTitle">Event Title:</label>
                    <input id="eventTitle" type="text" bind:value={$eventFormData.title} placeholder="Event Title" />
                </div>
                <div class="form-group">
                    <label for="startDate">Start Date:</label>
                    <input id="startDate" type="date" bind:value={$eventFormData.startDate} />
                </div>
                <div class="form-group">
                    <label for="endDate">End Date:</label>
                    <input id="endDate" type="date" bind:value={$eventFormData.endDate} />
                </div>
                <div class="form-group">
                    <label for="resourceSelect">Resource:</label>
                    <select id="resourceSelect" bind:value={$eventFormData.resourceId}>
                        {#each employees as employee}
                            <option value={employee.id}>{employee.title}</option>
                        {/each}
                    </select>
                </div>
                <div class="actions">
                    <button type="submit">Create Event</button>
                    <button type="button" on:click={closeModal}>Cancel</button>
                </div>
            </form>
        </div>
    </div>
{/if}

<style>
    #calendar {
        max-width: 100%;
        margin: 0 auto;
        height: 85vh;
        background-color: #ffffff;
    }
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
        width: 400px;
        min-width: 250px;
        padding: 20px;
        background: #2d2d2d;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        pointer-events: auto;
        color: white;
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

    @media (max-width: 768px) {
        .contents {
            margin-top: 20px;
            width: 70%;
        }
    }
</style>
