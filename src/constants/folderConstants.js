require('dotenv').config();
const folderConstants = {
    DEFAULT: {
        USERS_DEFAULT_IMAGE: process.env.ASSETS_URL_BASE ? `${process.env.ASSETS_URL_BASE}/images/default.png` : null
    },
    USER: {
        PROFILE_IMAGE_UPLOAD_PATH: `/users/profileImage`,
        PROFILE_IMAGE_PATH: process.env.ASSETS_URL_BASE ? `${process.env.ASSETS_URL_BASE}/uploads/users/profileImage/` : null
    }
};
export default folderConstants;
