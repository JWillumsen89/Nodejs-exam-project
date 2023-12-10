<script>
    import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
    import { faCheck, faX } from '@fortawesome/free-solid-svg-icons';
    import { user } from '../../stores/userStore.js';
    import { BASE_URL } from '../../components/Urls.js';
    export let requests = [];
    export let goToEvent;
    export let getEmployeeUsernameFromId;
    export let formatDate;
    export let openEventModalFromRequestsList;
    export let type;

    async function updateEventRequestStatus(eventRequestId, status) {
        console.log('updateEventRequestStatus', eventRequestId, status);
        const data = {
            handledById: $user.user.id,
            status,
        };
        const res = await fetch(BASE_URL + `/admin/update-event-request/${eventRequestId}`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (res.status === 200) {
            const updatedEventRequest = await res.json();
            console.log(updatedEventRequest);
        } else {
            console.log('Error updating event request status');
        }
    }
</script>

{#if requests.length > 0}
    <table>
        <thead>
            <tr>
                <th>Request By</th>
                {#if type !== 'pending'}
                    <th>Request Handled By</th>
                {/if}
                <th>Status</th>
                <th>New End Date</th>
                <th>Reason For Change</th>
                <th>Event Title</th>
                <th>See Event Details</th>
                <th>Go To Event</th>
                {#if type === 'pending'}
                    <th>Approve/Reject</th>
                {/if}
            </tr>
        </thead>
        <tbody>
            {#each requests as request}
                <tr>
                    <td>{request.requesterUsername}</td>
                    {#if type !== 'pending'}
                        <td>{getEmployeeUsernameFromId(request.handledById)}</td>
                    {/if}
                    <td>{request.handleStatus}</td>
                    <td>{formatDate(new Date(request.requestNewEndDate))}</td>
                    <td>{request.reasonForChange}</td>
                    <td>{request.eventTitle}</td>
                    <td><button class="table-btn" on:click={() => openEventModalFromRequestsList(request.eventId)}>See Event Details</button></td>
                    <td><button class="table-btn" on:click={() => goToEvent(request.eventId)}>Go To Event</button></td>
                    {#if type === 'pending'}
                        <td>
                            <div class="approve-reject-group">
                                <button class="approve-btn" on:click={() => updateEventRequestStatus(request.id, 'approved')}
                                    ><FontAwesomeIcon icon={faCheck} size="lg" />
                                </button>
                                <button class="reject-btn" on:click={() => updateEventRequestStatus(request.id, 'rejected')}
                                    ><FontAwesomeIcon icon={faX} size="lg" /></button
                                >
                            </div>
                        </td>
                    {/if}
                </tr>
            {/each}
        </tbody>
    </table>
{:else}
    <p>No requests.</p>
{/if}

<style>
    table {
        width: 95%;
        table-layout: fixed;
        border-collapse: collapse;
        margin: auto;
        border-radius: 8px;
        box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);
        overflow-y: auto;
    }

    th,
    td {
        background-color: #3a3a3a;
        overflow: hidden;
        word-wrap: break-word;
    }

    .approve-reject-group {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 10px; /* Space between buttons */
    }

    .approve-btn,
    .reject-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        border: none;
        padding: 0;
        border-radius: 50%;
        cursor: pointer;
        transition:
            background-color 0.3s,
            transform 0.3s;
    }

    .approve-btn {
        background-color: #4caf50;
        color: #fff;
    }

    .reject-btn {
        background-color: #f44336;
        color: #fff;
    }

    .approve-btn:hover {
        background-color: #66bb6a;
        transform: scale(1.3);
    }

    .reject-btn:hover {
        background-color: #ef5350;
        transform: scale(1.3);
    }

    th:nth-child(1),
    td:nth-child(1) {
        width: 15%;
    }
    th:nth-child(2),
    td:nth-child(2) {
        width: 15%;
    }
    th:nth-child(3),
    td:nth-child(3) {
        width: 15%;
    }
    th:nth-child(4),
    td:nth-child(4) {
        width: 15%;
    }
    th:nth-child(5),
    td:nth-child(5) {
        width: 40%;
    }
    th:nth-child(6),
    td:nth-child(6) {
        width: 12%;
    }
    th:nth-child(7),
    td:nth-child(7) {
        width: 12%;
    }
    th:nth-child(8),
    td:nth-child(8) {
        width: 12%;
    }
    th:nth-child(9),
    td:nth-child(9) {
        width: 12%;
    }

    @media (max-width: 767px) {
        table,
        thead,
        tbody,
        th,
        td,
        tr {
            display: block;
        }

        thead tr {
            position: absolute;
            top: -9999px;
            left: -9999px;
        }

        tr {
            border: none;
            margin-bottom: 10px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
            border-radius: 8px;
            background-color: #333;
            overflow: hidden;
        }

        td {
            border: none;
            text-align: left;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 15px;
            border-bottom: 1px solid #444;
        }

        tr:last-child td {
            border-bottom: none;
        }

        td:before {
            color: #ff9500;
            font-weight: bold;
            margin-right: 10px;
        }

        td:nth-of-type(1):before {
            content: 'Username: ';
        }
        td:nth-of-type(2):before {
            content: 'Email: ';
        }
        td:nth-of-type(3):before {
            content: 'Created At: ';
        }
        td:nth-of-type(4):before {
            content: 'Updated At: ';
        }
    }
</style>
