import bcrypt from "bcryptjs";
import commonConstants from "~/constants/commonConstants";
import logger from "./logger";

/**
 * Crypt password
 * @param {*} password 
 * @returns 
 */
async function cryptPassword(password) {
    try {
        const salt = await bcrypt.genSalt(commonConstants.PASSWORD.SALT_ROUNDS);
        return await bcrypt.hash(password, salt);
    } catch (error) {
        logger.error('Error on password encryption:', error)
        throw error;
    }
};

/**
 * Compare password
 * @param {*} password 
 * @param {*} hash 
 * @returns 
 */
function comparePasswordSync(password, hash) {
    return bcrypt.compareSync(password, hash);
};


const passwordHash = {
    cryptPassword,
    comparePasswordSync,
};


export default passwordHash;