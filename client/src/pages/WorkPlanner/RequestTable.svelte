<script>
    import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
    import { faCheck, faX } from '@fortawesome/free-solid-svg-icons';
    import { user } from '../../stores/userStore.js';
    import { BASE_URL } from '../../utils/urls.js';
    import { Modals, openModal, closeModal } from 'svelte-modals';
    import ReasonModal from './ReasonModal.svelte';
    import { formatDateEuropean, formatDateUS, addOneDay, subtractOneDay } from '../../utils/dateFormatting.js';
    import { capitalizeFirstLetter } from '../../utils/stringFormatting.js';
    import { notificationStore } from '../../stores/notificationStore.js';

    export let requests = [];
    export let goToEvent;
    export let getEmployeeUsernameFromId;
    export let openEventModalFromRequestsList;
    export let allEvents;
    export let type;

    let event = null;

    async function updateEventRequestStatus(eventRequestId, status, reason, handledByUsername) {
        const data = {
            handledById: $user.user.id,
            status,
            reason,
            handledByUsername,
        };

        try {
            const response = await fetch(BASE_URL + `/admin/update-event-request/${eventRequestId}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error(`Error updating event: ${response.statusText}`);
            }
        } catch (error) {
            throw error;
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

    async function openReasonCommentModal(type, request) {
        event = allEvents.find(event => event.id === request.eventId);
        console.log('all data', type, request, event);
        openModal(ReasonModal, {
            onSubmit: data => handleUpdates(request.id, type, data.reason, data.newEndDate, data.handledByUsername),
            type,
            event,
            request,
        });
    }

    async function handleUpdates(eventRequestId, type, reason, newEndDate, handledByUsername) {
        console.log('All parameters', eventRequestId, type, reason, newEndDate, handledByUsername);
        console.log('event', event);

        try {
            if (type === 'approved') {
                await updateEvent(newEndDate);
                updateEventRequestStatus(eventRequestId, type, reason, handledByUsername);
            } else {
                updateEventRequestStatus(eventRequestId, type, reason, handledByUsername);
            }
            notificationStore.set({ message: `Update successful!`, type: 'success' });
        } catch (error) {
            console.error('Error handling updates:', error);
            notificationStore.set({ message: error.message, type: 'error' });
        } finally {
            closeModal();
        }
    }

    async function updateEvent(newEndDate) {
        event.start = formatDateUS(new Date(event.start));
        event.end = formatDateUS(new Date(newEndDate));

        try {
            const response = await fetch(BASE_URL + '/admin/update-event', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(event),
            });

            if (!response.ok) {
                throw new Error(`Error updating event: ${response.statusText}`);
            }
        } catch (error) {
            throw error;
        }
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
                <th>{type === 'pending' ? '-' : 'Handled By'}</th>
                <th>{type === 'pending' ? '-' : 'Handled (Date)'}</th>
                <th>{type === 'rejected' ? 'Rejection Reason' : type === 'approved' ? 'Approval Comment' : '-'}</th>
                <th>{type === 'rejected' ? 'Rejected' : type === 'approved' ? 'Approved' : 'Approve/Reject'}</th>
            </tr>
        </thead>
        <tbody>
            {#each requests as request}
                <tr>
                    <td>{capitalizeFirstLetter(request.handleStatus)}</td>
                    <td>{request.requesterUsername}</td>
                    <td>{formatDateEuropean(request.createdAt, true)}</td>
                    <td>{request.reasonForChange}</td>
                    <td>{formatDateEuropean(subtractOneDay(request.requestNewEndDate), false)}</td>
                    <td>{request.eventTitle}</td>
                    <td><button class="table-btn" on:click={() => openEventModalFromRequestsList(request.eventId)}>Event Details</button></td>
                    <td><button class="table-btn" on:click={() => goToEvent(request.eventId)}>Go To Event</button></td>
                    {#if type === 'pending'}
                        <td></td>
                        <td></td>
                    {:else}
                        <td>{request.handledByUsername}</td>
                        <td>{formatDateEuropean(request.handleAt, true)}</td>
                    {/if}
                    <td>{(type === 'rejected' || type === 'approved') && request.reasonForRejection !== null ? request.reasonForRejection : ''}</td>

                    {#if type === 'pending'}
                        <td>
                            <div class="approve-reject-group">
                                <button class="approve-btn" on:click={() => openReasonCommentModal('approved', request)}
                                    ><FontAwesomeIcon icon={faCheck} size="lg" />
                                </button>
                                <button class="reject-btn" on:click={() => openReasonCommentModal('rejected', request)}>
                                    <FontAwesomeIcon icon={faX} size="lg" /></button
                                >
                            </div>
                        </td>
                    {:else if type === 'approved'}
                        <td><FontAwesomeIcon icon={faCheck} size="lg" /></td>
                    {:else if type === 'rejected'}
                        <td><FontAwesomeIcon icon={faX} size="lg" /></td>
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
    <p class="no-requests">No requests.</p>
{/if}

<style>
    .request-table tr:hover td {
        background-color: #4a4a4a;
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

    .no-requests {
        font-weight: bold;
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
