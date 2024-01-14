import pool from './mysqlConnection.js';

export async function createEvent(event) {
    try {
        const [result] = await pool.execute(
            `INSERT INTO events (title, start, end, resource_id, status, description, appraised, resource_username) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [event.title, event.start, event.end, event.resourceId, event.status, event.description, event.appraised, event.resourceUsername]
        );
        return result;
    } catch (error) {
        throw error;
    }
}

export async function getAllEvents() {
    try {
        const [rows] = await pool.execute(`SELECT * FROM events`);
        const result = rows.map(row => ({
            id: row.id,
            resourceId: row.resource_id,
            start: row.start,
            end: row.end,
            title: row.title,
            status: row.status,
            description: row.description,
            appraised: row.appraised,
            resourceUsername: row.resource_username,
            userUpdate: row.user_update,
        }));
        return result;
    } catch (error) {
        throw error;
    }
}

export async function getEvent(id) {
    try {
        const [rows] = await pool.execute(`SELECT * FROM events WHERE id = ?`, [id]);

        if (rows.length === 0) {
            return null;
        }

        const event = rows[0];
        const formattedResult = {
            id: event.id,
            resourceId: event.resource_id,
            start: event.start,
            end: event.end,
            title: event.title,
            status: event.status,
            description: event.description,
            appraised: event.appraised,
            resourceUsername: event.resource_username,
            userUpdate: event.user_update,
        };

        return formattedResult;
    } catch (error) {
        throw error;
    }
}

export async function getEventsForUser(userId) {
    try {
        const [rows] = await pool.execute(`SELECT * FROM events WHERE resource_id = ?`, [userId]);
        const result = rows.map(row => ({
            id: row.id,
            resourceId: row.resource_id,
            start: row.start,
            end: row.end,
            title: row.title,
            status: row.status,
            description: row.description,
            appraised: row.appraised,
            resourceUsername: row.resource_username,
            userUpdate: row.user_update,
        }));
        return result;
    } catch (error) {
        throw error;
    }
}

export async function updateEvent(event) {
    try {
        const [result] = await pool.execute(
            `UPDATE events SET title = ?, start = ?, end = ?, resource_id = ?, status = ?, description = ?, appraised = ?, resource_username = ? WHERE id = ?`,
            [event.title, event.start, event.end, event.resourceId, event.status, event.description, event.appraised, event.resourceUsername, event.id]
        );
        return result;
    } catch (error) {
        throw error;
    }
}

export async function userUpdateEvent(event) {
    try {
        const { description, status, appraised, id, userUpdate } = event;
        const [result] = await pool.execute(`UPDATE events SET description = ?, status = ?, appraised = ?, user_update = ? WHERE id = ?`, [
            description,
            status,
            appraised,
            userUpdate,
            id,
        ]);
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
