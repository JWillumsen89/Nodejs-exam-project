import { getAllUsersWithUserRole, getAllUsers } from '../../db/mysql/usersMysql.js';
import { getAllEvents, createEvent } from '../../db/mysql/eventsMysql.js';

export const authorizationService = {
    async getAllUsersWithUserRole() {
        const users = await getAllUsersWithUserRole();
        return users;
    },

    async getAllUsers() {
        const users = await getAllUsers();
        return users;
    },
    async getAllEvents() {
        const events = await getAllEvents();
        return events;
    },
    async createEvent(event) {
        const newEvent = await createEvent(event);
        return newEvent;
    },
};
