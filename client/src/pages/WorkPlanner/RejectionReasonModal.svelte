<script>
    import { Modals, openModal, closeModal } from 'svelte-modals';

    export let isOpen;
    export let onSubmit;

    let reason = '';

    async function handleRejectSubmission() {
        console.log('handleRejectSubmission', reason);
        onSubmit(reason);
        closeModal();
    }
</script>

{#if isOpen}
    <div class="modal">
        <div class="event-modal-content">
            <h2>Reason for Rejection</h2>
            <form on:submit|preventDefault={handleRejectSubmission}>
                <div class="form-group">
                    <textarea bind:value={reason} rows="4" placeholder="Enter reason for rejection..."></textarea>
                </div>
                <div class="actions">
                    <button type="submit">Reject Request</button>
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
</style>
