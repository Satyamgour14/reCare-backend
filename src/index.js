import express from "express";
import Path from "path";
import fileUpload from "express-fileupload";
import swaggerUI from "swagger-ui-express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

import { notFound } from "./middlewares/errorHandler";
import logger from "~/utils/logger";
import { userV1ApiRoutes } from "./modules/user/v1/routes";
import swaggerDefination from "~/api-doc/_build/main_doc.json";
import knexConfig from "./config/knexfile";

dotenv.config();

/**
 * ---------------------------------------------------------------------------
 * App initialization & configuration
 * ---------------------------------------------------------------------------
 */

const app = express();
const APP_PORT = process.env.APP_PORT;
const APP_HOST = process.env.APP_HOST;
const NODE_ENV = process.env.NODE_ENV;

app.set("port", APP_PORT);
app.set("host", APP_HOST);

// Global error object (legacy usage in other modules)
global.errorObj = {
    "status_code": 500,
    "message": "Internal server error"
};


/**
 * ---------------------------------------------------------------------------
 * Security & core middleware
 * ---------------------------------------------------------------------------
 */

// Handle file uploads (must be before body parsers)
app.use(fileUpload());

// Basic security headers
app.use(helmet());

// CORS configuration - allow multiple domains from env
let allowedDomains = process.env.CORS_ALLOW_DOMAIN || "";
allowedDomains = allowedDomains.split(",").map((domain) => domain.trim()).filter(Boolean);

app.use(
    cors({
        origin: allowedDomains,
        credentials: true
    })
);

// API docs (Swagger)
app.use('/api-doc', swaggerUI.serve, swaggerUI.setup(swaggerDefination));

// JSON parser with raw body support for webhook verification
app.use(
    express.json({
        verify: (req, res, buf) => {
            if (req.originalUrl.startsWith('/user/v1/payment/webhook')) {
                req.rawBody = buf.toString();
            }
        }
    })
);

// URL-encoded parser
app.use(express.urlencoded({ extended: false }));


/**
 * ---------------------------------------------------------------------------
 * Static asset serving
 * ---------------------------------------------------------------------------
 */

// Public assets
app.use(express.static(Path.join(__dirname, "public")));

// Uploaded files
app.use("/uploads", express.static(Path.join(__dirname, "/uploads",)));
app.use(express.static(Path.join(__dirname, "uploads")));

// Serve the coverage report statically
app.use("/coverage-report", express.static(Path.join(__dirname, "../coverage/lcov-report/")));


/**
 * ---------------------------------------------------------------------------
 * Infrastructure & health checks
 * ---------------------------------------------------------------------------
 */

async function checkDbConnection() {
    try {
        await knexConfig.raw("SELECT 1 as dbConnection");
        logger.info("DB CONNECTED SUCCESSFULLY");
    } catch (err) {
        logger.error("DB CONNECTION FAILED:", err);
    }
}


/**
 * ---------------------------------------------------------------------------
 * Route registration
 * ---------------------------------------------------------------------------
 */
app.use("/user/v1", userV1ApiRoutes);


/**
 * ---------------------------------------------------------------------------
 * Server startup
 * ---------------------------------------------------------------------------
 */

if (NODE_ENV !== "test") {
    app.listen(app.get("port"), async () => {
        logger.info(
            `Server listening at http://${app.get("host")}:${app.get("port")}`
        );
        await checkDbConnection();
    });
}


/**
 * ---------------------------------------------------------------------------
 * Process-level error handling
 * ---------------------------------------------------------------------------
 */

// Return default error message for unmatched routes
app.use(notFound);

process.on('uncaughtException', ex => {
    logger.error("uncaughtException: ", ex.message)
    process.exit(1);
});

process.on('unhandledRejection', reason => {
    logger.error("unhandledRejection: ", reason)
    process.exit(1);
});

// Export app
export default app;