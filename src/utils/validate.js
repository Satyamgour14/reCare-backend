import { StatusCodes } from "http-status-codes";
import Ajv from "ajv";
import normalise from "ajv-error-messages";
import addFormats from "ajv-formats";
const ajv = new Ajv({ useDefaults: true, allErrors: true, coerceTypes: true, $data: true });
addFormats(ajv);
require("ajv-errors")(ajv, { singleError: true })
import responseCodeConstant from "~/constants/responseCodeConstant";

const validateSchema = function (req, schema) {
    // compile  schema
    const validate = ajv.compile(schema);
    // check validation using request body 
    var valid;
    if (Object.keys(req.query).length > 0) {
        valid = validate(req.query);
    } else if (Object.keys(req.params).length > 0) {
        valid = validate(req.params);
    } else {
        valid = validate(req.body);
    }

    // check if req body fail validation then set error response
    if (!valid) {
        // get error object from validate
        var ajvErrors = validate.errors;
        // normalize error 
        var normalisedErrors = normalise(ajvErrors);
        // get fist error message 
        var errorFirstMsg;
        for (const resError of validate.errors) {
            if (resError.message) {
                errorFirstMsg = resError.message;
                break;
            }
        }

        var resMsg = (errorFirstMsg.substring(0, errorFirstMsg.indexOf(';')) != '') ? (errorFirstMsg.substring(0, errorFirstMsg.indexOf(';'))) : errorFirstMsg;

        // set validation error response
        const responseObj = { "code": responseCodeConstant.VALIDATION_ERROR, "message": resMsg, "data": normalisedErrors };

        // return 
        return { 'status': false, 'status_code': StatusCodes.BAD_REQUEST, 'error': responseObj };
    }
    // set response when validation pass
    return { 'status': true, 'error': '' };

}

export default validateSchema;