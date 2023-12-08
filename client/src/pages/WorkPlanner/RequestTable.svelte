<script>
    export let requests = [];
    export let goToEvent;
    export let getEmployeeUsernameFromId;
    export let formatDate;
</script>

{#if requests.length > 0}
    <table>
        <thead>
            <tr>
                <th>Request Id</th>
                <th>Requested By</th>
                <th>Requester Id</th>
                <th>Request Handled By</th>
                <th>Status</th>
                <th>New End Date</th>
                <th>Reason For Change</th>
                <th>Go To Event</th>
            </tr>
        </thead>
        <tbody>
            {#each requests as request}
                <tr>
                    <td>{request.eventId}</td>
                    <td>{request.requesterUsername}</td>
                    <td>{request.requesterId}</td>
                    <td>{getEmployeeUsernameFromId(request.handledById)}</td>
                    <td>{request.handleStatus}</td>
                    <td>{formatDate(new Date(request.requestNewEndDate))}</td>
                    <td>{request.reasonForChange}</td>
                    <td><button class="table-btn" on:click={() => goToEvent(request.eventId)}>Go To Event</button></td>
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

    th:nth-child(1),
    td:nth-child(1) {
        width: 10%;
    }
    th:nth-child(2),
    td:nth-child(2) {
        width: 15%;
    }
    th:nth-child(3),
    td:nth-child(3) {
        width: 10%;
    }
    th:nth-child(4),
    td:nth-child(4) {
        width: 15%;
    }
    th:nth-child(5),
    td:nth-child(5) {
        width: 10%;
    }
    th:nth-child(6),
    td:nth-child(6) {
        width: 15%;
    }
    th:nth-child(7),
    td:nth-child(7) {
        width: 40%;
    }
    th:nth-child(8),
    td:nth-child(8) {
        width: 13%;
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
