const twilio = require('twilio');
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioMessageFrom = process.env.TWILIO_MESSAGE_FROM;
const client = new twilio(accountSid, authToken);

class Twilio {

    async sendTextMessage(messageOptions) {

        return await client.messages // For sending massages
            .create({
                body: messageOptions.body, // Set the massage
                to: `${messageOptions.dial_code.trim()}${messageOptions.phone_number}`, // Text this number
                from: twilioMessageFrom, // From a valid Twilio number
            })
            .then(async (message) => {

                var res = {
                    status: true,
                    response: message
                };
                return res;

            }).catch((err) => {

                var res = {
                    status: false,
                    response: err
                };
                console.log("Library res", res);
                return res;
            });

    }
}

module.exports = Twilio;

