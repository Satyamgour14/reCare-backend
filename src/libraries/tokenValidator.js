import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa'; //json web key set
import { authConfig } from '../config/authConfig';


// Setup JWKS client using IdP config
const client = jwksClient({
    jwksUri: authConfig.jwksUri
});


// Fetch public key from JWKS for given kid
function getKey(header, callback) {
    client.getSigningKey(header.kid, (err, key) => {
        if (err) return callback(err);
        const signingKey = key.getPublicKey();
        callback(null, signingKey);
    });
}


// Returns decoded payload on success, throws on failure.
export function validateToken(token) {
    return new Promise((resolve, reject) => {
        jwt.verify(
            token,
            getKey,
            {
                algorithms: authConfig.allowedAlgs,
                issuer: authConfig.issuer,
                audience: authConfig.audience,
            },
            (err, decoded) => {
                if (err) {
                    return reject(err);
                }

                // ensure token doesn't contain obvious PHI fields
                const forbiddenFields = process.env.FORBIDDEN_FIELDS_IN_TOKEN;
                for (const field of forbiddenFields) {
                    if (decoded[field]) {
                        return reject(new Error(`Token contains forbidden field: ${field}`));
                    }
                }

                resolve(decoded);
            }
        );
    });
}