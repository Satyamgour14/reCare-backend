import {
    StatusCodes,
    getReasonPhrase
} from 'http-status-codes';

/**
 * Error response middleware for 404 not found.
 *
 * @param {Object} req
 * @param {Object} res
 */
export const notFound = function (req, res) {

    const responseObj = {
        "message": getReasonPhrase(StatusCodes.NOT_FOUND),
    }
    return res.status(StatusCodes.NOT_FOUND).json(responseObj);
};


