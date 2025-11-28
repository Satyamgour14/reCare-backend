import { StatusCodes } from "http-status-codes";
import commonHelpers from '~/helpers/commonHelpers';
import tableConstants from '~/constants/tableConstants';
import BaseModel from '~/models/BaseModel';
import { validateToken } from "../libraries/tokenValidator";

const baseModelObj = new BaseModel();

const authenticate = async (req, res, next) => {
    try {
        // get jwt token from headers
        const accessToken = req.headers["access-token"];

        // set error message when token key not found
        if (!accessToken || !accessToken.startsWith('Bearer ')) {
            return await commonHelpers.getErrorResponse(res, StatusCodes.UNAUTHORIZED, 'MISSING_OR_MALFORMED_AUTH_TOKEN');
        }

        const token = accessToken.substring('Bearer '.length).trim();

        // verify token and got decoded data
        const decoded = await validateToken(token);

        if (!decoded.deviceId || !decoded.userId) {
            return await commonHelpers.getErrorResponse(res, StatusCodes.UNAUTHORIZED, 'INVALID_TOKEN');
        }

        // fetch device id from DB
        decoded.userId = await commonHelpers.decrypt(decoded.userId);
        const userData = await baseModelObj.fetchObjWithSingleRecord({ 'userId': decoded.userId }, ['deviceId', 'status', 'isDeleted'], tableConstants.USERS);

        // check user's delete status
        if (userData.isDeleted) {
            return await commonHelpers.getErrorResponse(res, StatusCodes.UNAUTHORIZED, 'INVALID_TOKEN');
        }

        // check user status active/inactive
        if (!userData.status) {
            return await commonHelpers.getErrorResponse(res, StatusCodes.UNAUTHORIZED, 'ACCOUNT_INACTIVE');
        }

        // check device specific check if header device id and token device id not match then set invalid token
        if (decoded.deviceId != userData.deviceId) {
            return await commonHelpers.getErrorResponse(res, StatusCodes.UNAUTHORIZED, 'INVALID_TOKEN');
        }

        // set user data in request data
        req.user = decoded;

        return next();
    } catch (err) {
        return await commonHelpers.getErrorResponse(res, StatusCodes.UNAUTHORIZED, 'INVALID_TOKEN');
    }

};

module.exports = authenticate;