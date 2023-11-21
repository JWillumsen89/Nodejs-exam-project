import { getAllUsersWithUserRole, getAllUsers } from '../../db/mysql/usersMysql.js';
import { getAllEvents, createEvent, getEventsForUser, updateEvent } from '../../db/mysql/eventsMysql.js';

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
    async getEventsForUser(userId) {
        const events = await getEventsForUser(userId);
        return events;
    },
    async updateEvent(event) {
        const updatedEvent = await updateEvent(event);
        return updatedEvent;
    }
};
