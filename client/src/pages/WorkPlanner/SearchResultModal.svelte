<script>
    import { closeModal } from 'svelte-modals';
    import { slide } from 'svelte/transition';
    import { user } from '../../stores/userStore.js';
    import { formatDateEuropean, subtractOneDay, addOneDay } from '../../utils/dateFormatting.js';

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
    let isCollapseOpen = false;

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

    function resourceName(event) {
        const employee = employees.find(employee => employee.id === event.resourceId);
        return employee ? employee.title : event.resourceUsername;
    }
</script>

{#if isOpen}
    <div role="dialog" class="modal">
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
                    <button class="search-btn" on:click={() => (isCollapseOpen = !isCollapseOpen)}>
                        {isCollapseOpen ? 'Hide Advanced Search' : 'Show Advanced Search'}
                    </button>
                    <button class="search-btn grey-btn" on:click={clearSearch}>Clear Search</button>
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
                                        <td>{formatDateEuropean(new Date(result.start))}</td>
                                        <td>{formatDateEuropean(subtractOneDay(result.end))}</td>
                                        <td>{resourceName(result)}</td>
                                        <td>{displayStatus(result.status)}</td>
                                        <td>
                                            <button class="table-btn" on:click={() => toggleDescription(index)}> Show Description </button>
                                            {#if activeDescriptionIndex === index}
                                                <div class="description-tooltip">
                                                    {result.description}
                                                </div>
                                            {/if}
                                        </td>
                                        <td>{result.appraised == 1 ? 'Yes' : 'No'}</td>
                                        <td
                                            >{#if employees.find(employee => employee.id === result.resourceId)}
                                                <button class="table-btn" on:click={() => handleGoToEvent(result.id)}>Go To Event</button>
                                            {/if}</td
                                        >
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                {/if}
            {:else}
                <p class="error-message">No results found.</p>
            {/if}
            <button class="search-btn grey-btn" type="button" on:click={closeModal}>Close</button>
        </div>
    </div>
{/if}

<style>
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

    table {
        border-collapse: collapse;
        width: 100%;
        margin: auto;
        border-radius: 8px;
        box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);
        overflow-y: auto;
    }

    tr:hover td {
        background-color: #4a4a4a;
    }

    .search-btn {
        width: 50%;
        margin: 0 auto;
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

    .collapsible-content.visible {
        max-height: 500px;
    }

    .search-actions {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-bottom: 20px;
    }

    .search-div {
        width: 60%;
        min-width: 700px;
        margin: 0 auto;
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
</style>
