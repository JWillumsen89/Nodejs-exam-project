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
</script>

{#if isOpen}
    <div role="dialog" class="modal">
        <h1>Requests</h1>
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
