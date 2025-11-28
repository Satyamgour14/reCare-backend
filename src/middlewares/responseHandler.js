import { StatusCodes } from "http-status-codes";

class responseHandler {

    /**
     * return success response
     * @param {*} request 
     * @param {*} response 
     * @param {*} HttpStatus 
     * @param {*} responseData 
     * @returns 
     */
    sendResponse(request, response, HttpStatus, responseData) {
        const responseObj = {
            "code": responseData.code === undefined ? null : responseData.code,
            "data": responseData.data
        };
        return response.status(HttpStatus).json(responseObj);
    }


    /**
     * return other response like bad request
     * @param {*} request 
     * @param {*} response 
     * @param {*} HttpStatus 
     * @param {*} responseData 
     * @returns 
     */
    sendErrorResponse(request, response, HttpStatus, responseData) {
        const responseObj = {
            ...(responseData.message !== undefined && { "message": responseData.message }),
            "code": responseData.code === undefined ? null : responseData.code,
            "data": responseData.data
        };                
        return response.status(HttpStatus).json(responseObj);
    }


    /**
     * return internal server error response
     * @param {*} request 
     * @param {*} response 
     * @param {*} HttpStatus 
     * @returns 
     */
    errorResponse(request, response, HttpStatus) {
        const responseObj = { code: HttpStatus };
        return response.status(HttpStatus).json(responseObj);
    }


    /**
     * check service response
     * @param {*} req 
     * @param {*} res 
     * @param {*} returnData 
     */
    handleServiceResponse(req, res, returnData) {
        switch (returnData.status_code) {
            case StatusCodes.OK:
                this.sendResponse(req, res, StatusCodes.OK, {
                    code: returnData.code,
                    data: returnData.response,
                });
                break;

            case StatusCodes.EXPECTATION_FAILED:
            case StatusCodes.BAD_REQUEST:
                this.sendErrorResponse(req, res, StatusCodes.BAD_REQUEST, {
                    code: returnData.code,
                    data: {},
                });
                break;

            default:
                this.errorResponse(req, res, StatusCodes.INTERNAL_SERVER_ERROR);
                break;
        }
    }
}


// Exporting the responseHandler class
module.exports = responseHandler;