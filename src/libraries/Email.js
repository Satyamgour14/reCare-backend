import transporter from "~/config/emailConfig";
import hbs from 'nodemailer-express-handlebars';
import path from 'path';

class Email {
    constructor() {
        this.configureTemplateEngine();
    }

    // Set up the Handlebars template engine for the email
    configureTemplateEngine() {
        const options = {
            viewEngine: {
                extName: '.hbs',
                partialsDir: path.resolve('./views/partials'),
                layoutsDir: path.resolve('./views/layouts'),
                defaultLayout: '',
            },
            viewPath: path.resolve('./views/emails'),
            extName: '.hbs',
        };

        transporter.use('compile', hbs(options));
    }

    // Trigger the sending of the email
    async sendEmail(mailOptions) {
        // Ensure 'from' is always set
        mailOptions.from = process.env.MAIL_USERNAME;

        try {
            const response = await transporter.sendMail(mailOptions);
            return {
                status: true,
                response: response
            };
        } catch (err) {
            console.error('Email sending failed:', err);
            return {
                status: false,
                response: err
            };
        }
    }
}

module.exports = Email;