export const authConfig = {
    issuer: process.env.OAUTH_ISSUER,
    audience: process.env.OAUTH_AUDIENCE,
    jwksUri: process.env.OAUTH_JWKS_URI,
    allowedAlgs: ['RS256'],
};