import { rateLimit } from 'express-rate-limit';

export const authRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 60 minutes
    limit: 30, // Limit each IP to 30 requests per window (here, per hour).
    standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
});

export function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    return res.status(401).send('User is not authenticated!');
}
