import express from "express";
import { notFound } from "./middlewares/errorHandler";
import Path from "path";
import logger from "~/utils/logger";
import fileUpload from "express-fileupload";
import swaggerUI from "swagger-ui-express";
import { userV1ApiRoutes } from "./modules/user/v1/routes";
import swaggerDefination from "~/api-doc/_build/main_doc.json";
import knexConfig from "./config/knexfile";
import cors from "cors";
import helmet from "helmet";

require('dotenv').config();
const app = express(),
    APP_PORT = process.env.PORT || process.env.APP_PORT,
    APP_HOST = process.env.APP_HOST;

app.set("port", APP_PORT);
app.set("host", APP_HOST);
app.use(fileUpload());
app.use('/api-doc', swaggerUI.serve, swaggerUI.setup(swaggerDefination));
app.use(helmet());

app.use(express.json({
    verify: (req, res, buf) => {
        if (req.originalUrl.startsWith('/user/v1/payment/webhook')) {
            req.rawBody = buf.toString();
        }
    }
}));

app.use(express.urlencoded({ extended: false }));


// set path for public folder
app.use(express.static(Path.join(__dirname, 'public')));

app.use('/uploads', express.static(Path.join(__dirname, '../uploads')));
app.use(express.static(Path.join(__dirname, 'uploads')));

//To allow multiple domain

var allowedDomains = process.env.CORS_ALLOW_DOMAIN;
allowedDomains = allowedDomains.split(',');
app.use(
    cors({
        origin: allowedDomains,
        credentials: true
    })
)

async function checkDbConnection() {
    try {
        await knexConfig.raw('SELECT 1 as dbConnection');
        console.log('DB CONNECTED SUCCESSFULLY');
    } catch (err) {
        console.error('DB CONNECTION FAILED:', err);
    }
}


// router managment for different modules
app.use("/user/v1", userV1ApiRoutes);

/*set error middleware*/
app.use(notFound); //return default error message not found

global.errorObj = { "status_code": 500, "message": "Internal server error" };
if (process.env.NODE_ENV !== 'test') {
    app.listen(app.get("port"), async() => {
        console.log(`Server listing at http://${app.get("host")}:${app.get("port")}`)
        await checkDbConnection();
    })
}

process.on('uncaughtException', ex => {
    console.log("uncaughtException", ex);
    logger.error("uncaughtException: ", ex.message)
    process.exit(1);
})

process.on('unhandledRejection', reason => {
    logger.error("unhandledRejection: " + reason)
    process.exit(1);
})

export default app;