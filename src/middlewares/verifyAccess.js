import commonConstants from '~/constants/commonConstants';
import commonHelpers from '~/helpers/commonHelpers';
import url from 'url';

/**
 * Verify user access.
 *
 * @param  {Object} req Request.
 * @param  {Object} res Response.
 * @param  {Object} next Next request.
 */
const verifyAccess = async (req, res, next) => {

    const userType = req.user.user_role,
        endPoint = req.baseUrl,
        parsedUrl = url.parse(endPoint),
        pathName = parsedUrl.pathname,
        pathSegments = pathName.split('/'); // Split path into segments
    let allowedEndPoints, checkUserType;

    // Get the HTTP method
    const httpMethod = req.method;

    let apiEndPoint = pathSegments[1].toLowerCase(); // Get the last segment

    if (httpMethod == 'DELETE') {
        apiEndPoint = pathSegments[1].toLowerCase();
    }

    if (httpMethod == 'POST' && pathSegments.length == 4) {
        apiEndPoint = pathSegments[1].toLowerCase();
    }

    // Concatenate the HTTP method with the endpoint
    const fullEndPoint = `${httpMethod}-${apiEndPoint}`;

    if (userType == commonConstants.USER.TYPE.CUSTOMER) {
        allowedEndPoints = ['POST-customer-api', 'GET-customer-api', 'DELETE-customer-api', 'PATCH-customer-api', 'PUT-customer-api'];
        checkUserType = commonConstants.USER.TYPE.CUSTOMER
    }

    if (!allowedEndPoints.includes(fullEndPoint) && userType == checkUserType) {
        const responseObj = { "code": commonHelpers.getResponseCode('ACCESS_DENIED_TO_USER') };
        return res.status(400).json(responseObj);
    }

    next();
};

module.exports = verifyAccess;