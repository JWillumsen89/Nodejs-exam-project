<script>
    import { onMount } from 'svelte';
    import io from 'socket.io-client';
    import { writable } from 'svelte/store';
    
    import { BASE_URL } from '../../utils/urls.js';
    import { pageTitle } from '../../stores/pageTitleStore.js';
    import { dynamicTitlePart, getFullTitle } from '../../stores/htmlTitleStore.js';
    import { formatDateEuropean } from '../../utils/dateFormatting.js';
    import { checkSession } from '../../components/Authorization/Authorization.js';

    $: pageTitle.set('Admin Panel'), dynamicTitlePart.set($pageTitle), (document.title = getFullTitle($dynamicTitlePart));

    const socket = io(BASE_URL);
    const isSessionChecked = writable(false);

    let errorMessage = '';
    let userList = [];
    let sortedUserList = [];

    onMount(async () => {
        if (await checkSession()) {
            isSessionChecked.set(true);
            await fetchAllUsersWithUserRole();
        }
    });

    socket.on('user_changed', async () => {
        await fetchAllUsersWithUserRole();
    });

    async function fetchAllUsersWithUserRole() {
        try {
            const response = await fetch(BASE_URL + '/admin/users', {
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }

            const result = await response.json();
            userList = result.data;
            sortedUserList = userList.sort((a, b) => {
                return a.username.localeCompare(b.username);
            });
        } catch (error) {
            console.error('Fetch error:', error);
            errorMessage = error.message || 'Failed to fetch data';
        }
    }
</script>

{#if $isSessionChecked}
    <div class="content">
        <h2 class="users-title">Users List</h2>
        <table>
            <thead>
                <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Created At</th>
                    <th>Updated At</th>
                </tr>
            </thead>
            <tbody>
                {#each sortedUserList as user}
                    <tr>
                        <td>{user.username}</td>
                        <td>{user.email}</td>
                        <td>{formatDateEuropean(user.created_at, true)}</td>
                        <td>{formatDateEuropean(user.updated_at, true)}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
{/if}

<style>
    .content {
        max-width: 100%;
        margin: 0 auto;
        margin-top: 40px;
        padding: 10px;
        box-sizing: border-box;
        color: #c0c0c0;
        background: #2d2d2d;
        border-radius: 10px;
    }
    .users-title {
        text-align: center;
        margin-bottom: 20px;
        color: #ff9500;
    }

    table {
        margin-top: 20px;
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
