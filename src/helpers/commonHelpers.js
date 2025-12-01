import Hashids from "hashids";
import responseCodeConstant from "~/constants/responseCodeConstant";
import JwtAuthSecurity from "~/libraries/JwtAuthSecurity";
import commonConstants from "~/constants/commonConstants";
import folderConstants from "~/constants/folderConstants";
import BaseModel from "~/models/BaseModel";
import tableConstants from "~/constants/tableConstants";
import Path from "path";
import CryptoJS from "crypto-js";
import generator from "generate-password";
import { v4 as uuidv4 } from "uuid";

const jwtAuthSecurity = new JwtAuthSecurity();
const baseModel = new BaseModel();

// Hashids instance for short IDs (min length 6)
const hashids = new Hashids(commonConstants.PASSWORD.HASH_ID_SALT, 6);

/**
 * Encode a numeric ID using Hashids.
 * @param {number} value
 * @returns {string}
 */
const encrypt = (value) => {
    return hashids.encode(value);
};

/**
 * Decode a Hashids string back to numeric ID.
 * @param {string} encodedValue
 * @returns {number} 0 if invalid
 */
const decrypt = (encodedValue) => {
    const decoded = hashids.decode(encodedValue);
    return decoded.length === 0 ? 0 : decoded[0];
};

/**
 * Generate a 6-digit numeric OTP.
 * @returns {number}
 */
const getOtp = () => {
    const min = 100000;
    const max = 999999;
    return Math.floor(min + Math.random() * (max - min + 1));
};

/**
 * Prepare login response for user.
 * @param {Object} userData
 * @returns {Promise<Object>}
 */
async function getLoginResponse(userData) {
    const encryptedUserId = encrypt(userData.userId);

    const tokenData = {
        userId: encryptedUserId,
        userType: userData.userType,
        deviceId: userData.deviceId,
    };

    const profileImage = userData.profileImage
        ? `${folderConstants.USER.PROFILE_IMAGE_PATH}${userData.profileImage}`
        : folderConstants.DEFAULT.USERS_DEFAULT_IMAGE;

    const token = await jwtAuthSecurity.generateJwtToken(tokenData);

    return {
        userId: encryptedUserId,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        notificationEnable: userData.notificationEnable,
        userType: userData.userType,
        language: userData.language,
        signupType: userData.signupType,
        profileImage,
        token,
    };
}

/**
 * Generate a UUID v4 string.
 * @returns {string}
 */
function generateUniqueID() {
    return uuidv4();
}

/**
 * Resolve numeric response code from key.
 * @param {string} key
 * @returns {number | undefined}
 */
function getResponseCode(key) {
    return responseCodeConstant[key];
}

/**
 * Standard response structure.
 * @param {number} statusCode - HTTP status code
 * @param {string} messageCode - key from responseCodeConstant
 * @param {any} [response] - payload data
 * @returns {{status_code:number, code:number|undefined, response:any}}
 */
async function prepareResponse(statusCode, messageCode, response) {
    const responseObj = response || {};
    return {
        status_code: statusCode,
        code: getResponseCode(messageCode),
        response: responseObj,
    };
}

/**
 * Generate random alphanumeric string.
 * @param {number} [strLength=5]
 * @param {string} [charSet]
 * @returns {string}
 */
const getRandomString = (strLength = 5, charSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789") => {
    const result = [];

    for (let i = 0; i < strLength; i++) {
        const randomIndex = Math.floor(Math.random() * charSet.length);
        result.push(charSet.charAt(randomIndex));
    }

    return result.join("");
};

/**
 * Generate secure random password.
 * @returns {string}
 */
function getRandomPassword() {
    return generator.generate({
        length: 8,
        numbers: true,
        uppercase: true,
        lowercase: true,
        symbols: "#$%^&*@~!!",
        strict: true,
    });
}

/**
 * Validate if string is valid JSON.
 * @param {string} jsonData
 * @returns {Promise<boolean>}
 */
async function isValidJson(jsonData) {
    try {
        JSON.parse(jsonData);
        return true;
    } catch {
        return false;
    }
}

/**
 * Generate a unique numeric string based on shuffled timestamp.
 * Ensures uniqueness against TB_USERS.unique_id.
 *
 * @param {number} length
 * @param {string} [prefix=""]
 * @returns {Promise<string>}
 */
async function generateRandomNumericStringFromTime(length, prefix = "") {
    const MAX_ATTEMPTS = 5;
    let attempt = 0;

    while (attempt < MAX_ATTEMPTS) {
        attempt++;

        const currentTime = Date.now().toString();
        let timeString = currentTime
            .split("")
            .sort(() => Math.random() - 0.5)
            .join("");

        // Pad with random digits if too short
        while (timeString.length < length) {
            timeString += Math.floor(Math.random() * 10).toString();
        }

        const candidate = prefix + timeString.slice(0, length - prefix.length);

        const existingRecord = await baseModel.fetchObjWithSingleRecord(
            { unique_id: candidate },
            ["id"],
            tableConstants.TB_USERS
        );

        if (!existingRecord) {
            return candidate;
        }
    }

    throw new Error("Failed to generate unique numeric string after max attempts");
}

/**
 * Encrypt string using AES (crypto-js).
 * @param {string} text
 * @returns {string}
 */
const encryptWithCrypto = (text) => {
    const secretKey = process.env.CRYPTO_SECRET_KEY;
    if (!secretKey) {
        throw new Error("CRYPTO_SECRET_KEY is not defined in the env file");
    }
    return CryptoJS.AES.encrypt(text, secretKey).toString();
};

/**
 * Decrypt AES encrypted string (crypto-js).
 * @param {string} encryptedText
 * @returns {string}
 */
const decryptWithCrypto = (encryptedText) => {
    const secretKey = process.env.CRYPTO_SECRET_KEY;
    if (!secretKey) {
        throw new Error("CRYPTO_SECRET_KEY is not defined in the env file");
    }
    const bytes = CryptoJS.AES.decrypt(encryptedText, secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
};

/**
 * Generate JWT token.
 * @param {Object} tokenData
 * @returns {Promise<string>}
 */
async function getJwtToken(tokenData) {
    return jwtAuthSecurity.generateJwtToken(tokenData);
}

/**
 * Send minimal error response with just code (for legacy flows).
 * @param {import("express").Response} res
 * @param {number} statusCode
 * @param {string} messageCode
 */
async function getErrorResponse(res, statusCode, messageCode) {
    const responseObj = { code: getResponseCode(messageCode) };
    return res.status(statusCode).json(responseObj);
}

/**
 * Validate image size & extension.
 * @param {{ size:number, name:string }} fileData
 * @returns {Promise<{status:boolean, message?:string}>}
 */
async function imageValidator(fileData) {
    // Size check
    if (Math.round(fileData.size) >= commonConstants.IMAGE.MAX_SIZE_BYTES) {
        return {
            status: false,
            // use your responseCode key / message key
            message: "FILE_SIZE_LIMIT", // previously: 'PICTURE_SIZE_LIMIT'
        };
    }

    // Extension check
    const extensionName = Path.extname(fileData.name).toLowerCase();
    const allowedExtensions = commonConstants.IMAGE.ALLOWED_EXTENSIONS;

    if (!allowedExtensions.includes(extensionName)) {
        return {
            status: false,
            message: "INVALID_FILE_EXTENSION", // previously: 'INVALID_FILE_EXTENTION'
        };
    }

    return { status: true };
}

const commonHelpers = {
    getOtp,
    encrypt,
    decrypt,
    getLoginResponse,
    generateUniqueID,
    getResponseCode,
    getRandomPassword,
    prepareResponse,
    isValidJson,
    getRandomString,
    generateRandomNumericStringFromTime,
    encryptWithCrypto,
    decryptWithCrypto,
    getJwtToken,
    getErrorResponse,
    imageValidator,
};

export default commonHelpers;