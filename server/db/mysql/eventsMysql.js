import pool from './mysqlConnection.js';

export async function getEvents() {
    try {
        const [result] = await pool.execute(`SELECT * FROM events`);
        return result;
    } catch (error) {
        throw error;
    }
}

export async function getAllEvents() {
    try {
        const [result] = await pool.execute(`SELECT * FROM events`);
        return result;
    } catch (error) {
        throw error;
    }
}

export async function getEventsByUserId(userId) {
    try {
        const [result] = await pool.execute(`SELECT * FROM events WHERE userId = ?`, [userId]);
        return result;
    } catch (error) {
        throw error;
    }
}

export async function createEvent(event) {
    try {
        const status = event.status === '' ? 'Status' : event.status;
        const description = event.description === '' ? 'Description' : event.description;

        const [result] = await pool.execute(`INSERT INTO events (title, start, end, resourceId, userId, status, description) VALUES (?, ?, ?, ?, ?, ?, ?)`, [
            event.title,
            event.start,
            event.end,
            event.resourceId,
            event.userId,
            status,
            description,
        ]);
        return result;
    } catch (error) {
        throw error;
    }
}
