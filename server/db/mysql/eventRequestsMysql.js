import pool from './mysqlConnection.js';

export async function getAllEventRequests() {
    try {
        const [rows] = await pool.execute(`SELECT * FROM event_requests`);
        const result = rows.map(row => ({
            id: row.id,
            eventId: row.event_id,
            requesterId: row.requester_id,
            requesterUsername: row.requester_username,
            handleStatus: row.handle_status,
            handledById: row.handled_by_id,
            reasonForChange: row.reason_for_change,
            requestNewEndDate: row.request_new_end_date,
        }));
        return result;
    } catch (error) {
        throw error;
    }
}

export async function createEventRequest(eventRequest) {
    try {
        const [result] = await pool.execute(
            `INSERT INTO event_requests (event_id, requester_id,requester_username, handle_status, handled_by_id, reason_for_change, request_new_end_date) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                eventRequest.eventId,
                eventRequest.requesterId,
                eventRequest.requesterUsername,
                eventRequest.handleStatus,
                eventRequest.handledById,
                eventRequest.reasonForChange,
                eventRequest.requestNewEndDate,
            ]
        );
        return result;
    } catch (error) {
        throw error;
    }
}

export async function updateEventRequest(eventRequestId, request) {
    try {
        console.log('eventRequestId', eventRequestId);
        console.log('request', request);
        const [result] = await pool.execute(`UPDATE event_requests SET handle_status = ?, handled_by_id = ? WHERE id = ?`, [
            request.status,
            request.handledById,
            eventRequestId,
        ]);
        return result;
    } catch (error) {
        throw error;
    }
}
