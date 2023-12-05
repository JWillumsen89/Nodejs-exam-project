<script>
    import { closeModal } from 'svelte-modals';
    import { onMount, createEventDispatcher } from 'svelte';
    import { slide } from 'svelte/transition';
    import { user } from '../../stores/userStore.js';

    export let isOpen;
    export let allEvents;
    export let onGoToEvent;
    export let employees;

    let searchResults = [];
    let searchTitle = '';
    let searchDescription = '';
    let searchStatus = '';
    let searchStartPeriodStart = '';
    let searchStartPeriodEnd = '';
    let searchEndPeriodStart = '';
    let searchEndPeriodEnd = '';
    let searchResource = '';
    let searchAppraised = null;
    let searchInitiated = false;
    const dispatch = createEventDispatcher();
    let isCollapseOpen = false;

    onMount(() => {});

    function formatDate(date) {
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    }
    function formatDateSubtractOneDay(date) {
        date = new Date(date);
        date.setDate(date.getDate() - 1);
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    }

    function subtractOneDay(dateString) {
        const date = new Date(dateString);
        date.setDate(date.getDate() - 1);
        return date;
    }

    function addOneDay(dateString) {
        const date = new Date(dateString);
        date.setDate(date.getDate() + 1);
        return date;
    }

    // @ts-ignore
    $: searchInitiated =
        searchTitle ||
        searchResource ||
        searchStartPeriodStart ||
        searchEndPeriodStart ||
        searchStartPeriodEnd ||
        searchEndPeriodEnd ||
        searchDescription ||
        searchStatus ||
        searchAppraised !== null;

    $: searchResults = allEvents.filter(event => {
        const adjustedStartPeriodStart = searchStartPeriodStart ? subtractOneDay(searchStartPeriodStart) : null;
        const adjustedEndPeriodEnd = searchEndPeriodEnd ? addOneDay(searchEndPeriodEnd) : null;
        const appraisedFilter = searchAppraised !== null ? Number(searchAppraised) : null;
        return (
            (!searchTitle || event.title.toLowerCase().includes(searchTitle.toLowerCase())) &&
            (!searchStartPeriodStart || new Date(event.start) >= adjustedStartPeriodStart) &&
            (!searchStartPeriodEnd || new Date(event.start) <= new Date(searchStartPeriodEnd)) &&
            (!searchEndPeriodStart || new Date(event.end) >= new Date(searchEndPeriodStart)) &&
            (!searchEndPeriodEnd || new Date(event.end) <= adjustedEndPeriodEnd) &&
            (!searchDescription || event.description.toLowerCase().includes(searchDescription.toLowerCase())) &&
            (!searchStatus || event.status.toLowerCase() === searchStatus.toLowerCase()) &&
            (appraisedFilter === null || event.appraised === appraisedFilter) &&
            (!searchResource || event.resourceId === searchResource)
        );
    });

    let activeDescriptionIndex = null;

    function toggleDescription(index) {
        activeDescriptionIndex = activeDescriptionIndex === index ? null : index;
    }

    function handleGoToEvent(eventId) {
        closeModal();
        if (onGoToEvent) {
            onGoToEvent(eventId);
        }
    }

    function clearSearch() {
        searchTitle = '';
        searchDescription = '';
        searchStatus = '';
        searchStartPeriodStart = '';
        searchStartPeriodEnd = '';
        searchEndPeriodStart = '';
        searchEndPeriodEnd = '';
        searchResource = '';
        searchAppraised = null;
    }

    const statusDisplayMap = {
        booked: 'Booked',
        arrived: 'Arrived',
        appraisal: 'Appraisal',
        awaitingappraiserapproval: 'Awaiting Appraiser Approval',
        awaitingcustomerapproval: 'Awaiting Customer Approval',
        disassembly: 'Disassembly',
        waitingforparts: 'Waiting For Parts',
        repair: 'Repair',
        painter: 'Painter',
        returnpainter: 'Return Painter',
        assembly: 'Assembly',
        preparation: 'Preparation',
        calledready: 'Called Ready',
        deliveredtocustomer: 'Delivered To Customer',
        totalloss: 'Total Loss',
    };

    function displayStatus(status) {
        return statusDisplayMap[status] || status;
    }

    function resourceName(id) {
        const employee = employees.find(employee => employee.id === id);
        return employee ? employee.title : '';
    }
</script>

{#if isOpen}
    <div role="dialog" class="search-modal">
        <div class="content">
            <div class="search-div">
                <h2>Search For Events</h2>
                <div class="row">
                    <div class="form-group">
                        <label for="event-title">Event Title:</label>
                        <input id="event-title" type="text" placeholder="Search by title" bind:value={searchTitle} />
                    </div>
                    <div class="form-group">
                        <label for="resource-select">Resource:</label>
                        {#if $user.user.role === 'user'}
                            <input id="resource-select" type="text" value={$user.user.username} disabled />
                        {:else if $user.user.role === 'admin'}
                            <select id="resource-select" bind:value={searchResource}>
                                <option value={''} disabled>Select Resource</option>
                                {#each employees as employee}
                                    <option value={employee.id}>{employee.title}</option>
                                {/each}
                            </select>
                        {/if}
                    </div>
                </div>

                <div class="search-actions">
                    <button on:click={() => (isCollapseOpen = !isCollapseOpen)}>
                        {isCollapseOpen ? 'Hide Advanced Search' : 'Show Advanced Search'}
                    </button>
                    <button on:click={clearSearch}>Clear Search</button>
                </div>
                <div in:slide={{ duration: 300 }} class="collapsible-content" class:visible={isCollapseOpen}>
                    <div class="row">
                        <div class="form-group">
                            <label for="description">Description:</label>
                            <input id="description" type="text" placeholder="Search by description" bind:value={searchDescription} />
                        </div>
                    </div>
                    <div class="dates-group">
                        <div class="date-range-box">
                            <label for="start-date-range">Start Date Range:</label>
                            <div class="date-range-inputs">
                                <div>
                                    <label for="start-start-date">Start:</label>
                                    <input id="start-start-date" type="date" bind:value={searchStartPeriodStart} />
                                </div>
                                <div>
                                    <label for="start-end-date">End:</label>
                                    <input id="start-end-date" type="date" bind:value={searchStartPeriodEnd} />
                                </div>
                            </div>
                        </div>
                        <div class="date-range-box">
                            <label for="end-date-range">End Date Range:</label>
                            <div class="date-range-inputs">
                                <div>
                                    <label for="start-end-date">Start:</label>
                                    <input id="start-end-date" type="date" bind:value={searchEndPeriodStart} />
                                </div>
                                <div>
                                    <label for="end-end-date">End:</label>
                                    <input id="end-end-date" type="date" bind:value={searchEndPeriodEnd} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="form-group">
                            <label for="status">Status:</label>
                            <select id="status" bind:value={searchStatus}>
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
                            <select id="appraised" bind:value={searchAppraised}>
                                <option value={null}>Select Appraised Status</option>
                                <option value={0}>No</option>
                                <option value={1}>Yes</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {#if searchInitiated}
                {#if searchResults.length === 0}
                    <p class="error-message">No results found.</p>
                {:else}
                    <div class="table-div">
                        <table>
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Resource</th>
                                    <th>Status</th>
                                    <th>Description</th>
                                    <th>Appraised</th>
                                    <th>Go To Event</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each searchResults as result, index}
                                    <tr>
                                        <td>{result.title}</td>
                                        <td>{formatDate(new Date(result.start))}</td>
                                        <td>{formatDateSubtractOneDay(new Date(result.end))}</td>
                                        <td>{resourceName(result.resourceId)}</td>
                                        <td>{displayStatus(result.status)}</td>
                                        <td>
                                            <button class="search-result-btn" on:click={() => toggleDescription(index)}> Show Description </button>
                                            {#if activeDescriptionIndex === index}
                                                <div class="description-tooltip">
                                                    {result.description}
                                                </div>
                                            {/if}
                                        </td>
                                        <td>{result.appraised == 1 ? 'Yes' : 'No'}</td>
                                        <td><button class="search-result-btn" on:click={() => handleGoToEvent(result.id)}>Go To Event</button></td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                {/if}
            {:else}
                <p class="error-message">No results found.</p>
            {/if}
            <button type="button" on:click={closeModal}>Close</button>
        </div>
    </div>
{/if}

<style>
    .search-modal {
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

    .content {
        background: #2d2d2d;
        width: 70vw;
        min-width: 800px;
        padding: 20px;
        padding-top: 10px;
        overflow-y: auto;
        max-height: 80vh;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        pointer-events: auto;
    }

    .row {
        display: flex;
        justify-content: space-between;
    }

    .row .form-group {
        flex: 1;
        margin-right: 10px;
    }

    .row .form-group:last-child {
        margin-right: 0;
    }
    .table-div {
        overflow-y: auto;
        max-height: 80vh;
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
        width: 50%;
        margin: 0 auto;
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

    .dates-group {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        margin-bottom: 10px;
    }

    .date-range-box {
        flex: 1;
        border: 1px solid #666;
        padding: 10px;
        border-radius: 5px;
        background-color: #333;
        margin-right: 10px;
    }

    .date-range-inputs {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
    }

    .date-range-inputs > div {
        display: flex;
        align-items: center;
    }

    .date-range-inputs > div:first-child {
        justify-content: start;
    }

    .date-range-inputs > div:last-child {
        justify-content: end;
    }

    .date-range-inputs label {
        margin-right: 10px;
    }

    .date-range-inputs input {
        flex-grow: 1;
        padding: 8px;
        border-radius: 4px;
        border: 1px solid #555;
        background-color: #333;
        color: #fff;
    }

    .date-range-box:last-child {
        margin-right: 0;
    }

    .table-div {
        overflow-y: auto;
        min-height: 300px;
        margin: 20px auto;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        border-radius: 8px;
        padding: 10px;
        padding-top: 0;
        background-color: #333;
    }

    table {
        border-collapse: collapse;
        width: 100%;
        margin: auto;
        border-radius: 8px;
        box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);
        overflow-y: auto;
    }

    thead th {
        position: sticky;
        top: 0;
        background-color: #3a3a3a;
        color: #ff9500;
        font-weight: bold;
        z-index: 10;
    }

    tbody tr {
        z-index: 1;
    }

    th,
    td {
        padding: 15px;
        text-align: left;
        border-bottom: 1px solid #444;
    }

    tr:hover td {
        background-color: #4a4a4a;
    }

    .error-message {
        color: #ff9500;
        text-align: center;
    }

    .description-tooltip {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: #fff;
        color: #333;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 20px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
        z-index: 20;
        max-width: 500px;
        max-height: 80%;
        overflow-y: auto;
    }
    .collapsible-content {
        overflow: hidden;
        transition: max-height 0.3s ease-out;
        max-height: 0;
    }

    .collapsible-content.visible {
        max-height: 500px; /* Adjust this value based on the content */
    }
    .search-actions {
        display: flex;
        justify-content: center;
        gap: 10px; /* Adjust the spacing between buttons */
        margin-bottom: 20px; /* Space before the collapsible content or search results */
    }
    .search-result-btn {
        width: 100%;
    }
    .search-div {
        width: 60%;
        min-width: 700px;
        margin: 0 auto;
    }
</style>
