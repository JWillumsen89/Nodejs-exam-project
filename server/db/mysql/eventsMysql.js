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

export async function userUpdateEvent(event) {
    try {
        const { description, status, appraised, id } = event;
        const [result] = await pool.execute(`UPDATE events SET description = ?, status = ?, appraised = ? WHERE id = ?`, [description, status, appraised, id]);
        return result;
    } catch (error) {
        throw error;
    }
}

export async function deleteEvent(id) {
    try {
        const [result] = await pool.execute(`DELETE FROM events WHERE id = ?`, [id]);
        return result;
    } catch (error) {
        throw error;
    }
}
