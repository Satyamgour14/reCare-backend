class NotificationHelper {
    constructor({ commonConstants, tableConstants, commonHelpers, FirebaseLib, DateTimeUtil, BaseModel }) {
        this.commonConstants = commonConstants;
        this.tableConstants = tableConstants;
        this.commonHelpers = commonHelpers;
        this.FirebaseLib = FirebaseLib;
        this.DateTimeUtilObj = DateTimeUtil;
        this.baseModel = BaseModel;
    }

    async setNotification(notificationData, notificationType, receiverUserType, sendPushNotification = true) {
        try {
            // fetch receiver detail
            const condition = { "userId": notificationData.receiverId },
                selectFileds = ["deviceToken", "notificationEnable", "language"],
                receiverInfo = await this.baseModel.fetchObjWithSelectedFields(condition, selectFileds, this.tableConstants.USERS),
                deviceToken = receiverInfo[0].deviceToken,
                notificationEnable = receiverInfo[0].notificationEnable,
                language = receiverInfo[0].language;

            const validationResult = await this.validateAndPrepNotification(notificationData, notificationType, language);

            if (!validationResult.status) {
                throw new Error(validationResult.message);
            } else {
                var { title, description } = validationResult.notificationContent;
            }

            let referenceId = null;
            if (notificationData.additionalData?.referenceId) {
                referenceId = notificationData.additionalData.referenceId;
                // referenceId replace with encrypted referenceId
                notificationData.additionalData.referenceId = await this.commonHelpers.encrypt(referenceId);
            }

            // insert into users_notification insertData
            const insertData = {
                "actionToUser": notificationData.receiverId,
                "actionByUser": notificationData.senderId,
                "receiverUserType": receiverUserType,
                "referenceId": referenceId,
                "notificationType": notificationType,
                "title": title,
                "description": description,
                "readStatus": this.commonConstants.NOTIFICATION.READ_STATUS.UNREAD,
                "createdAt": await this.DateTimeUtilObj.getCurrentTimeObjForDB()
            };

            const [insertNotification] = await this.baseModel.createObj(insertData, this.tableConstants.NOTIFICATIONS);

            if (sendPushNotification) {
                const encryptedNotificationId = await this.commonHelpers.encrypt(insertNotification);

                const notificationPayload = {
                    "title": title,
                    "body": description,
                    "additionalData": {
                        "notificationType": notificationType,
                        "notificationId": encryptedNotificationId,
                        "receiverUserType": receiverUserType,
                    }
                };

                if (notificationData.additionalData) {
                    notificationPayload.additionalData = { ...notificationPayload.additionalData, ...notificationData.additionalData };
                }
                // Convert all values of additionalData obj to string type
                notificationPayload.additionalData = Object.fromEntries(
                    Object.entries(notificationPayload.additionalData).map(([key, value]) => [key, String(value)])
                );

                if (notificationEnable === this.commonConstants.NOTIFICATION.PREFERENCE_STATUS.ENABLED && deviceToken) {
                    let responseData = await this.FirebaseLib.sendNotification(deviceToken, notificationPayload);
                }
            }
            return insertNotification;

        } catch (error) {
            console.error("Error in setNotification:", error);
            return error;
        }
    }

    async validateAndPrepNotification(notificationData, notificationType, language = 'en') {
        const notificationConfig = {
            [this.commonConstants.NOTIFICATION.TYPE.NEW_REQUEST]: {
                notificationContent: {
                    en: {
                        title: "New Request",
                        description: "You have receive a new request"
                    },
                    fr: {
                        title: "Nouvelle demande",
                        description: "Vous avez reçu une Nouvelle demande"
                    }
                },
                requireSenderData: [],
                requireKeys: ["senderId", "receiverId", "additionalData.referenceId"],
                clickAction: "jobRequest"
            },
            [this.commonConstants.NOTIFICATION.TYPE.REQUEST_ACCEPTED]: {
                notificationContent: {
                    en: {
                        title: "Request Accepted",
                        description: "{firstName} {lastName} has accepted your request"
                    },
                    fr: {
                        title: "Demande acceptée",
                        description: "{firstName} {lastName} a accepté votre demande"
                    }
                },
                requireSenderData: ["firstName", "lastName"],
                requireKeys: ["senderId", "receiverId", "additionalData.referenceId"],
                clickAction: "requestAccepted"
            },
            [this.commonConstants.NOTIFICATION.TYPE.REQUEST_CANCELED]: {
                notificationContent: {
                    en: {
                        title: "Request Cancelled",
                        description: "Your request has been cancelled"
                    },
                    fr: {
                        title: "Demande annulée",
                        description: "Votre demande a été annulée"
                    }
                },
                requireSenderData: [],
                requireKeys: ["senderId", "receiverId", "additionalData.referenceId"],
                clickAction: "requestCancelled"
            }
        };

        const config = notificationConfig[notificationType];
        if (!config) {
            throw new Error(`Notification configuration not set for notificationType: ${notificationType}`);
        }

        // Validate required keys
        const requiredKeys = config.requireKeys || [];
        for (const key of requiredKeys) {
            const keys = key.split(".");
            let value = notificationData;
            for (const subKey of keys) {
                value = value?.[subKey];
                if (!value) {
                    return {
                        status: false,
                        message: `Missing required key: ${key} for notificationType: ${notificationType}`
                    };
                }
            }
        }

        // Set click action if defined
        if (config.clickAction) {
            notificationData.additionalData = notificationData.additionalData || {};
            notificationData.additionalData.clickAction = config.clickAction;
        }

        let fetchUserData = {};
        if (config.requireSenderData?.length > 0) {
            const condition = { userId: notificationData.senderId };
            const selectFields = config.requireSenderData;
            fetchUserData = (await this.baseModel.fetchObjWithSelectedFields(condition, selectFields, this.tableConstants.USERS))?.[0] || {};
        }

        if (config.requireSenderData?.length > 0 || config.replaceAdditionalData) {
            config.notificationContent[language].description = config.notificationContent[language].description.replace(/{(.*?)}/g, (match, key) => {
                key = key.trim();
                if (config.requireSenderData?.length > 0 && fetchUserData[key] !== undefined) {
                    return fetchUserData[key] ? fetchUserData[key] : '';
                }
                if (config.replaceAdditionalData && notificationData.additionalData?.[key] !== undefined) {
                    return notificationData.additionalData[key];
                }
                return match;
            }).trim();
        }

        return {
            status: true,
            notificationContent: {
                title: config.notificationContent[language].title,
                description: config.notificationContent[language].description.replace(/\s+/g, ' '),
                additionalData: notificationData.additionalData
            }
        };
    }

}
module.exports = NotificationHelper;