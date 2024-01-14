import { Router } from 'express';
const router = Router();

import { requireRole } from '../middlewares/authorizationMiddlewares.js';
import { isAuthenticated } from '../../authentication/middlewares/authMiddlewares.js';
import { authorizationController } from '../controllers/authorizationController.js';

export default function (io) {
    router.get('/user/profile', isAuthenticated, requireRole(['user']), (req, res) => {
        res.send({ data: req.session.user });
    });

    router.get('/user/get-events', isAuthenticated, requireRole(['user']), async (req, res) => {
        const events = await authorizationController.getEventsForUser(req.session.user.id);
        res.send({ data: events });
    });

    router.post('/user/update-event', isAuthenticated, requireRole(['user']), async (req, res) => {
        try {
            const { description, status, appraised, id, userUpdate } = req.body;
            //If userUpdate is not defined, set userUpdate to false
            if (userUpdate === undefined) {
                userUpdate = false;
            }

            const updateData = {
                description,
                status,
                appraised,
                id,
                userUpdate,
            };
            const event = await authorizationController.userUpdateEvent(updateData);

            io.emit('event_changed', { event: event });
            res.send({ data: { message: 'Event updated successfully', event: event } });
        } catch (error) {
            res.status(400).send({ error: error.message });
        }
    });

    router.post('/user/send-request', isAuthenticated, requireRole(['user']), async (req, res) => {
        try {
            console.log('req.body', req.body);

            const request = await authorizationController.sendRequest(req.body);

            io.emit('requested_changes', { request: request });
            res.send({ data: { message: 'Request sent successfully', request: request } });
        } catch (error) {
            res.status(400).send({ error: error.message });
        }
    });

    router.get('/user/get-all-event-requests-by-id/:eventId', isAuthenticated, requireRole(['user']), async (req, res) => {
        try {
            const requests = await authorizationController.getAllEventRequestsById(req.params.eventId);
            res.send({ data: requests });
        } catch (error) {
            res.status(400).send({ error: error.message });
        }
    });

    return router;
}
