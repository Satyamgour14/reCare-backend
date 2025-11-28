import { StatusCodes } from "http-status-codes";
import Jwt from "jsonwebtoken";
import commonHelpers from '~/helpers/commonHelpers';
import tableConstants from '~/constants/tableConstants';
import BaseModel from '~/models/BaseModel';

const baseModelObj = new BaseModel();

const jwtVerifyToken = async (req, res, next) => {

    /* get jwt to secret key from env file*/
    const secretKey = process.env.JWT_SECRET_KEY;
    if (!secretKey) {
        throw new Error('jwt-secret-key is not defined in the env file');
    }

    /*get jwt token from requet*/
    const token =
        req.body.token || req.query.token || req.headers["access-token"];

    /*set error message when token key not found*/
    if (!token) {
        return await commonHelpers.getErrorResponse(res, StatusCodes.FORBIDDEN, 'ACCESS_TOKEN_REQUIRED');
    }

    try {
        /*verify token and add user key in response */
        const decoded = Jwt.verify(token, secretKey);

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
    } catch (err) {
        return await commonHelpers.getErrorResponse(res, StatusCodes.UNAUTHORIZED, 'INVALID_TOKEN');
    }

    return next();
};

module.exports = jwtVerifyToken;