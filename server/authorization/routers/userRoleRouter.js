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
            const { description, status, appraised, id } = req.body;

            const updateData = {
                description,
                status,
                appraised,
                id,
            };
            const event = await authorizationController.userUpdateEvent(updateData);

            io.emit('event_updated', { event: event });
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

    return router;
}
