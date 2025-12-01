require('dotenv').config();
import commonConstants from '~/constants/commonConstants';
import commonHelpers from '~/helpers/commonHelpers';

/**
 * User authentication.
 *
 * @param  {Object} req Request.
 * @param  {Object} res Response.
 * @param  {Object} next Next request.
 */
const checkApiHeaders = async (req, res, next) => {

    const endPoint = req.url;
    const lastSlashIndex = endPoint.lastIndexOf('/'); // Find the last index of '/'
    let apiEndPoint = endPoint.slice(lastSlashIndex + 1); // Extract substring from the last index
    apiEndPoint = apiEndPoint.toLowerCase();

    const api_key = process.env.API_KEY;

    // return if API KEY not set in env
    if (!api_key) {
        throw new Error('API_KEY is not defined in the env file');
    }

    if (apiEndPoint === 'login' || apiEndPoint === 'signup') {

        const requiredHeaders = [
            { key: "device-id", message: "device id is missing." },
            { key: "device-type", message: "device type is missing." },
            { key: "device-token", message: "device token is missing." },
            { key: "api-key", message: "api access key is missing." }
        ];

        const errorArray = [];
        let headerMissing = false;

        requiredHeaders.forEach(header => {
            if (!req.headers[header.key] || req.headers[header.key] === "") {
                headerMissing = true;
                errorArray.push(header.message);
            }
        });

        if (headerMissing) {
            const responseObj = {
                "code": commonHelpers.getResponseCode('MISSING_HEADERS'),
                "errors": errorArray
            };
            return res.status(400).json(responseObj);
        }

        const apiAccessKey = req.headers["api-key"],
            deviceType = parseInt(req.headers["device-type"]);

        if (deviceType !== commonConstants.DEVICE.ANDROID && deviceType !== commonConstants.DEVICE.IOS && deviceType !== commonConstants.DEVICE.WEBSITE) {
            const responseObj = { "code": commonHelpers.getResponseCode('INVALID_DEVICE_TYPE') };
            return res.status(400).json(responseObj);
        }

        // check api access key
        if (api_key != apiAccessKey) {
            const responseObj = { "code": commonHelpers.getResponseCode('INVALID_API_KEY') };
            return res.status(401).json(responseObj);
        }
    } else {
        // Variable declaration
        const apiAccessKey = req.headers["api-key"];

        // check header
        if (apiAccessKey === undefined || apiAccessKey === "") {
            const responseObj = {
                "code": commonHelpers.getResponseCode('MISSING_HEADERS'),
                "errors": ["api access key is missing."]
            };
            return res.status(400).json(responseObj);
        }

        // check api access key
        if (api_key != apiAccessKey) {
            const responseObj = { "code": commonHelpers.getResponseCode('INVALID_API_KEY') };
            return res.status(401).json(responseObj);
        }
    }

    next();

};

module.exports = checkApiHeaders;