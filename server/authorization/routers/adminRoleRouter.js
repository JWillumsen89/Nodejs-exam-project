import { Router } from 'express';
const router = Router();

import { requireRole } from '../middlewares/authorizationMiddlewares.js';
import { isAuthenticated } from '../../authentication/middlewares/authMiddlewares.js';

import { authorizationController } from '../controllers/authorizationController.js';

export default function (io) {
    router.get('/admin/users', isAuthenticated, requireRole(['admin']), async (req, res) => {
        try {
            const users = await authorizationController.getAllUsersWithUserRole();
            res.send({ data: users });
        } catch (error) {
            res.status(500).send({ error: error.message });
        }
    });

    router.get('/admin/get-all-users', isAuthenticated, requireRole(['admin']), async (req, res) => {
        try {
            const users = await authorizationController.getAllUsers();
            res.send({ data: users });
        } catch (error) {
            res.status(500).send({ error: error.message });
        }
    });

    router.get('/admin/get-all-events', isAuthenticated, requireRole(['admin']), async (req, res) => {
        try {
            const events = await authorizationController.getAllEvents();
            res.send({ data: events });
        } catch (error) {
            res.status(500).send({ error: error.message });
        }
    });

    router.post('/admin/create-event', isAuthenticated, requireRole(['admin']), async (req, res) => {
        try {
            const event = await authorizationController.createEvent(req.body);

            io.emit('event_changed', { event: event });
            res.send({ data: { message: 'Event created successfully', event: event } });
        } catch (error) {
            res.status(400).send({ error: error.message });
        }
    });

    router.post('/admin/update-event', isAuthenticated, requireRole(['admin']), async (req, res) => {
        try {
            const event = await authorizationController.updateEvent(req.body);
            io.emit('event_changed', { event: event });
            res.send({ data: { message: 'Event updated successfully', event: event } });
        } catch (error) {
            res.status(400).send({ error: error.message });
        }
    });

    router.delete('/admin/delete-event', isAuthenticated, requireRole(['admin']), async (req, res) => {
        try {
            const event = await authorizationController.deleteEvent(req.body.id);
            io.emit('event_changed', { event: event });
            res.send({ data: { message: 'Event deleted successfully', event: event } });
        } catch (error) {
            res.status(400).send({ error: error.message });
        }
    });

    router.get('/admin/get-event/:eventId', isAuthenticated, requireRole(['admin']), async (req, res) => {
        try {
            const eventId = req.params.eventId;
            const event = await authorizationController.getEvent(eventId);
            res.send({ data: { event: event } });
        } catch (error) {
            res.status(400).send({ error: error.message });
        }
    });

    router.get('/admin/get-all-event-requests', isAuthenticated, requireRole(['admin']), async (req, res) => {
        const requests = await authorizationController.getAllEventRequests();
        res.send({ data: requests });
    });

    router.put('/admin/update-event-request/:eventRequestId', isAuthenticated, requireRole(['admin']), async (req, res) => {
        try {
            const { eventRequestId } = req.params;

            const request = await authorizationController.updateEventRequest(eventRequestId, req.body);

            io.emit('event_request_updated', { request: request });
            res.send({ data: { message: 'Event request updated successfully', request: request } });
        } catch (error) {
            res.status(400).send({ error: error.message });
        }
    });

    return router;
}
