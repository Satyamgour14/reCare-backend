const { StatusCodes } = require("http-status-codes");

const BEARER_PREFIX = 'bearer';
const allowedSubjects = (process.env.ALLOWED_SUBJECTS || '').split(';').filter(Boolean);

function decodeJwtPayload(token) {
    if (!token) return null;

    const [, payload] = token.split('.');
    console.log('payload', payload);

    if (!payload) return null;

    try {
        const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = Buffer.from(normalized, 'base64').toString('utf8');
        return JSON.parse(decoded);
    } catch {
        return null;
    }
}

function extractBearerToken(req) {
    const header = req.get('authorization');
    if (!header || typeof header !== 'string') return null;

    if (!header.toLowerCase().startsWith(BEARER_PREFIX)) return null;

    return header.slice(BEARER_PREFIX.length).trim() || null;
}

module.exports = function authorizePartner(req, res, next) {

    const token = extractBearerToken(req);
    if (!token) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Invalid or missing bearer token' });
    }

    const payload = decodeJwtPayload(token);
    if (!payload) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Invalid token payload' });
    }

    const subject = payload.email || payload.sub || '';
    if (!subject) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Token missing subject' });
    }

    if (
        Array.isArray(allowedSubjects) &&
        allowedSubjects.length > 0 &&
        !allowedSubjects.includes(subject)
    ) {
        return res.status(StatusCodes.FORBIDDEN).json({ error: 'Forbidden: subject not allowed' });
    }
    req.body.partnerIdentity = subject || 'unknown';
    next();
};
