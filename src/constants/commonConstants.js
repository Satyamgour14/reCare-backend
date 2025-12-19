/**
 * Common Constants
 *
 * @package                
 * @subpackage             Common Constants
 * @category               Constants
 * @ShortDescription       This is responsible for common constants
 */

const commonConstants = {
    // -------------------- AUTH --------------------
    AUTH: {
        SIGNUP_TYPE: {
            NORMAL: 1,
            SOCIAL: 2
        },
        SOCIAL_PROVIDER: {
            GOOGLE: 1,
            FACEBOOK: 2,
            APPLE: 3
        }
    },
    SIGNUP_VERIFICATION: {
        EMAIL: "email",
        PHONE: "phone",
        BOTH: "both"
    },
    OTP: {
        MAX_ATTEMPTS: 5,
        TYPE: {
            EMAIL: "email",
            PHONE: "phone",
        }
    },
    PASSWORD: {
        SALT_ROUNDS: 10,
        HASH_ID_SALT: "jkhgdklhjhgsdkljjhkldjjhf766tyuhgu"
    },

    // -------------------- SYSTEM --------------------
    SYSTEM: {
        ENCRYPTION_ALGORITHM: "aes-256-cbc",
        ENCODING: "hex",
        STORAGE_PATH: "./uploads",
        DB_DATE_FORMAT: "YYYY-MM-DD HH:mm:ss",
        EMAIL_TEMPLATE_PATH: process.env.EMAIL_TEMPLATES || "./src/emails/",
        LIST_LIMIT: 10,
        NOTIFICATION_LIST_LIMIT: 10
    },

    // -------------------- USER --------------------
    USER: {
        TYPE: {
            CUSTOMER: 1
        },
        PLACEHOLDER: {
            UPLOAD_PATH: "user_placeholder"
        },
        PROFILE_IMAGE: {
            MAX_SIZE: 5 * 1024 * 1024, // 5MB
            ALLOWED_EXTENSIONS: [".jpg", ".jpeg", ".gif", ".png", ".webp"],
            UPLOAD_PATH: "profile"
        }
    },

    // -------------------- DEVICE --------------------
    DEVICE: {
        ANDROID: 1,
        IOS: 2,
        WEB: 3
    },

    // -------------------- STATUSES --------------------
    STATUS: {
        ACTIVE: 1,
        INACTIVE: 0,

        ENABLED: 1,
        DISABLED: 0,

        ONLINE: 1,
        OFFLINE: 0,

        LOGGED_IN: 1,
        BLOCKED: 1,
        UNBLOCKED: 0,

        DELETED: 1,
        NOT_DELETED: 0
    },

    AVAILABILITY: {
        AVAILABLE: 1,
        UNAVAILABLE: 0
    },

    // -------------------- MEDIA / IMAGE --------------------
    IMAGE: {
        MAX_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
        ALLOWED_EXTENSIONS: [".jpg", ".jpeg", ".gif", ".png", ".eps", ".raw", ".bmp", ".tiff", ".webp", ".blob"],
        // Typically 0–100, used as quality/percentage
        COMPRESSION_QUALITY: 75,
        SUPPORTED_OBJECT_FIELDS: ["profileImage"]
    },

    // -------------------- PAYMENT --------------------
    PAYMENT: {
        METHOD: {
            STRIPE: "stripe"
        },
        CURRENCY: {
            USD: "usd"
        },
        STATUS: {
            UNPAID: 0,
            PAID: 1
        },
        DETAILS_STATUS: {
            ADDED: 1,
            NOT_ADDED: 0
        },
        PAYOUT_STATUS: {
            ENABLED: 1,
            DISABLED: 0
        }
    },

    // -------------------- NOTIFICATIONS --------------------
    NOTIFICATION: {
        TYPE: {
            NEW_REQUEST: "new_request",
            REQUEST_ACCEPTED: "request_accepted",
            REQUEST_CANCELED: "request_canceled"
        },
        READ_STATUS: {
            READ: 1,
            UNREAD: 0
        },
        PREFERENCE_STATUS: {
            ENABLED: 1,
            DISABLED: 0
        }
    },

    // -------------------- PRIVACY / DATA VISIBILITY --------------------
    DATA_VISIBILITY: {
        HIDDEN: 1,
        VISIBLE: 0
    },

    LOG_EVENTS: {
        INGEST_PUBLISHED: 'INGEST_PUBLISHED',
        INGEST_ACCEPTED: 'INGEST_ACCEPTED',
        INGEST_ERROR: 'INGEST_ERROR'
    }
};

export default commonConstants;