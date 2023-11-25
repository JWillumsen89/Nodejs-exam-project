import pool from './mysqlConnection.js';

export async function getAllEvents() {
    try {
        const [result] = await pool.execute(`SELECT * FROM events`);
        return result;
    } catch (error) {
        throw error;
    }
}

export async function getEventsForUser(userId) {
    try {
        const [result] = await pool.execute(`SELECT * FROM events WHERE resource_id = ?`, [userId]);
        return result;
    } catch (error) {
        throw error;
    }
}

export async function createEvent(event) {
    try {
        const [result] = await pool.execute(
            `INSERT INTO events (title, start, end, resource_id, status, description, appraised) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [event.title, event.start, event.end, event.resourceId, event.status, event.description, event.appraised]
        );
        return result;
    } catch (error) {
        throw error;
    }
}

export async function updateEvent(event) {
    try {
        const [result] = await pool.execute(
            `UPDATE events SET title = ?, start = ?, end = ?, resource_id = ?, status = ?, description = ?, appraised = ? WHERE id = ?`,
            [event.title, event.start, event.end, event.resourceId, event.status, event.description, event.appraised, event.id]
        );
        return result;
    } catch (error) {
        throw error;
    }
}
