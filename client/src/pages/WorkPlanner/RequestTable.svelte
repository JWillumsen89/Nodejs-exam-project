<script>
    import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
    import { faCheck, faX, faCircle } from '@fortawesome/free-solid-svg-icons';
    import { user } from '../../stores/userStore.js';
    import { BASE_URL } from '../../components/Urls.js';
    import { Modals, openModal, closeModal } from 'svelte-modals';
    import RejectionReasonModal from './RejectionReasonModal.svelte';

    export let requests = [];
    export let goToEvent;
    export let getEmployeeUsernameFromId;
    export let openEventModalFromRequestsList;
    export let type;

    async function updateEventRequestStatus(eventRequestId, status, reasonForRejection) {
        console.log('updateEventRequestStatus', eventRequestId, status, reasonForRejection);

        const data = {
            handledById: $user.user.id,
            status,
        };

        if (status === 'rejected') {
            data.reasonForRejection = reasonForRejection;
        }

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

    function formatDate(dateString, withTime) {
        const date = new Date(dateString);

        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();

        if (withTime) {
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');

            return `${day}/${month}-${year} ${hours}:${minutes}`;
        } else {
            return `${day}/${month}-${year}`;
        }
    }

    function handleRejectionReason(eventRequestId, reason) {
        updateEventRequestStatus(eventRequestId, 'rejected', reason);
    }

    function handleBackdropClick() {
        closeModal();
    }

    function handleBackdropKeyDown(event) {
        if (event.key === 'Enter' || event.key === 'Space') {
            closeModal();
        }
    }

    async function openRejectionReasonModal(eventRequestId) {
        openModal(RejectionReasonModal, {
            onSubmit: reason => handleRejectionReason(eventRequestId, reason),
        });
    }

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
</script>

{#if requests.length > 0}
    <table class="request-table">
        <thead>
            <tr>
                <th>Status</th>
                <th>Request By</th>
                <th>Request Created</th>
                <th>Change Reason</th>
                <th>New End Date</th>
                <th>Event Title</th>
                <th>Event Details</th>
                <th>Go To Event</th>
                <th>Handled By</th>
                <th>Handled (Date)</th>
                <th>Rejection Reason</th>

                <th>Approve/Reject</th>
            </tr>
        </thead>
        <tbody>
            {#each requests as request}
                <tr>
                    <td>{capitalizeFirstLetter(request.handleStatus)}</td>
                    <td>{request.requesterUsername}</td>
                    <td>{formatDate(request.createdAt, true)}</td>
                    <td>{request.reasonForChange}</td>
                    <td>{formatDate(request.requestNewEndDate, false)}</td>
                    <td>{request.eventTitle}</td>
                    <td><button class="table-btn" on:click={() => openEventModalFromRequestsList(request.eventId)}>Event Details</button></td>
                    <td><button class="table-btn" on:click={() => goToEvent(request.eventId)}>Go To Event</button></td>
                    {#if type === 'pending'}
                        <td></td>
                        <td></td>
                    {:else}
                        <td>{getEmployeeUsernameFromId(request.handledById)}</td>
                        <td>{formatDate(request.handleAt, true)}</td>
                    {/if}
                    {#if type === 'rejected'}
                        <td>{request.reasonForRejection}</td>
                    {:else}
                        <td></td>
                    {/if}

                    {#if type === 'pending'}
                        <td>
                            <div class="approve-reject-group">
                                <button class="approve-btn" on:click={() => updateEventRequestStatus(request.id, 'approved')}
                                    ><FontAwesomeIcon icon={faCheck} size="lg" />
                                </button>
                                <button class="reject-btn" on:click={() => openRejectionReasonModal(request.id)}>
                                    <FontAwesomeIcon icon={faX} size="lg" /></button
                                >
                            </div>
                        </td>
                    {:else}
                        <td></td>
                    {/if}
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
                </tr>
            {/each}
        </tbody>
    </table>
{:else}
    <p>No requests.</p>
{/if}

<style>
    .request-table tr:hover td {
        background-color: #4a4a4a; /* Hover color for all cells */
    }

    .request-table {
        table-layout: fixed;
        width: 98%;
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

    .approve-reject-group {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 10px;
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
        min-width: 0;
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

    @media (max-width: 767px) {
        /* Responsive styles */
        .request-table,
        .request-table thead,
        .request-table tbody,
        .request-table th,
        .request-table td,
        .request-table tr {
            display: block;
        }

        .request-table thead tr {
            position: absolute;
            top: -9999px;
            left: -9999px;
        }

        tr {
            margin-bottom: 10px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
            border-radius: 8px;
            background-color: #333;
            overflow: hidden;
        }

        td {
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

        /* Custom content for each td:before based on your table structure */
        td:nth-of-type(1):before {
            content: 'Request By: ';
        }
        td:nth-of-type(2):before {
            content: 'Request Created: ';
        }
        td:nth-of-type(3):before {
            content: 'Request Handled By: ';
        }
        td:nth-of-type(4):before {
            content: 'Request Handled: ';
        }
        td:nth-of-type(5):before {
            content: 'Reason For Rejection: ';
        }
        td:nth-of-type(6):before {
            content: 'Status: ';
        }
        td:nth-of-type(7):before {
            content: 'New End Date: ';
        }
        td:nth-of-type(8):before {
            content: 'Reason For Change: ';
        }
        td:nth-of-type(9):before {
            content: 'Event Title: ';
        }
        td:nth-of-type(10):before {
            content: 'See Event Details: ';
        }
        td:nth-of-type(11):before {
            content: 'Go To Event: ';
        }
        td:nth-of-type(12):before {
            content: 'Approve/Reject: ';
        }
    }
</style>
