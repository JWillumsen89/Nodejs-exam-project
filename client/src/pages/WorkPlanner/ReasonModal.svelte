<script>
    import { closeModal } from 'svelte-modals';
    import { formatDateEuropean, formatDateUS, addOneDay, subtractOneDay } from '../../utils/dateFormatting.js';
    import { user } from '../../stores/userStore.js';

    export let isOpen;
    export let onSubmit;
    export let type;
    export let event;
    export let request;

    let reason = '';
    let inputDateNewEndDate = formatDateUS(subtractOneDay(new Date(request.requestNewEndDate)));

    $: finalInputDateNewEndDate = formatDateUS(addOneDay(new Date(inputDateNewEndDate)));

    async function handleSubmission() {
        console.log('finalInputDateNewEndDate', finalInputDateNewEndDate);
        console.log('reason', reason);
        console.log('type', type);
        console.log('event', event);
        console.log('username', $user.user.username);

        let data = {
            reason,
            type,
            event,
            newEndDate: finalInputDateNewEndDate,
            handledByUsername: $user.user.username,
        };
        onSubmit(data);
        closeModal();
    }
</script>

{#if isOpen}
    <div class="modal">
        <div class="event-modal-content">
            <h2>{type === 'rejected' ? 'Reason For Rejection' : 'Comment To Approval'}</h2>
            <form on:submit|preventDefault={handleSubmission}>
                <label for="resource"
                    >Requester:
                    <p>{event.resourceUsername}</p>
                </label>
                <label for="event-title"
                    >Event Title:
                    <p>{event.title}</p>
                </label>
                <label for="event-description"
                    >Event Description:
                    <p>{event.description}</p>
                </label>
                <label for="event-start-date"
                    >Current Start Date:
                    <p>{formatDateEuropean(event.start, false)}</p>
                </label>
                <label for="event-end-date"
                    >Current End Date:
                    <p>{formatDateEuropean(subtractOneDay(event.end), false)}</p>
                </label>
                <label for="event-reason-for-change"
                    >Reason For Change:
                    <p>{request.reasonForChange}</p>
                </label>
                <label for="event-new-end-date"
                    >Requested - New End Date:
                    <p>{formatDateEuropean(subtractOneDay(request.requestNewEndDate), false)}</p>
                </label>
                {#if type === 'approved'}
                    <div class="form-group">
                        <div class="dates-group">
                            <input type="date" bind:value={inputDateNewEndDate} />
                        </div>
                    </div>
                {/if}
                <div class="form-group">
                    <textarea
                        bind:value={reason}
                        rows="4"
                        required
                        placeholder={type === 'rejected' ? 'Enter reason for rejection...' : 'Enter comment to approval...'}
                    ></textarea>
                </div>
                <div class="actions">
                    <button type="submit">{type === 'rejected' ? 'Reject Request' : 'Approve Request'}</button>
                    <button class="grey-btn" type="button" on:click={closeModal}>Cancel</button>
                </div>
            </form>
        </div>
    </div>
{/if}

<style>
    button {
        margin: 0 10px 0 10px;
    }
    .event-modal-content form label {
        display: flex;
        align-items: center;
        margin-bottom: -5px;
        margin-top: -5px;
        margin-left: 10px;
    }

    .event-modal-content form label p {
        margin: 0;
        padding-left: 12px;
        font-size: 16px;
    }

    .event-modal-content form label {
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        border-radius: 4px;
        padding: 10px;
    }

    @media screen and (min-width: 768px) {
        .event-modal-content form label {
            padding: 12px 16px;
        }
        .event-modal-content form label p {
            font-size: 18px;
        }
    }
</style>
