import { StatusCodes } from "http-status-codes";
import commonHelpers from '~/helpers/commonHelpers';


/**
 * requiredScopes: array of strings, e.g. ['landing:read', 'landing:write']
 */

export function authorizeScope(requiredScopes = []) {
    return async (req, res, next) => {
        const user = req.user;

        if (!user) {
            return await commonHelpers.getErrorResponse(res, StatusCodes.UNAUTHORIZED, 'INVALID_TOKEN');
        }

        const tokenScopes = (user.scope || user.scopes || '').split(' ').filter(Boolean);
        const hasAllRequired = requiredScopes.every((rs) => tokenScopes.includes(rs));
        if (!hasAllRequired) {
            return await commonHelpers.getErrorResponse(res, StatusCodes.FORBIDDEN, 'INVALID_TOKEN');
        }

        next();
    };
}
