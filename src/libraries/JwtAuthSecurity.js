import jwt from "jsonwebtoken";

class JwtAuthSecurity {

    /**
     * Generate JWT token.
     *
     * @param {object} user - User object to encode into JWT.
     * @returns {string|object} - Returns JWT token or error object.
     */
    generateJwtToken(user) {
        try {
            /* Get JWT expiration time from the environment variable or set default */
            const expiresIn = process.env.JWT_EXPIRE_TIME || '90d';

            /* Get JWT secret key from the environment variable */
            const secretKey = process.env.JWT_SECRET_KEY;
            if (!secretKey) {
                throw new Error('JWT secret key is not defined in environment variables');
            }

            /* Clone user data to avoid mutation */
            const userPayload = JSON.parse(JSON.stringify(user));

            /* Generate JWT token */
            const token = jwt.sign(userPayload, secretKey, { expiresIn });

            return token;

        } catch (error) {
            console.error('Error generating JWT token:', error);
            return error;
        }
    }
}

module.exports = JwtAuthSecurity;