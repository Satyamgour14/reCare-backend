require('dotenv').config();
const knex = require("knex");
let connection = '';

/**
 * checking the environment for the server for database connection
 */
if (process.env.NODE_ENV == 'production') {
    connection = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        charset: process.env.DB_CHARSET,
        timezone: process.env.DB_TIMEZONE
    }

} else if (process.env.NODE_ENV == 'staging') {
    connection = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        charset: process.env.DB_CHARSET,
        timezone: process.env.DB_TIMEZONE
    }
} else if (process.env.NODE_ENV == 'development') {
    connection = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        charset: process.env.DB_CHARSET,
        timezone: process.env.DB_TIMEZONE
    }
} else if (process.env.NODE_ENV == 'test') {
    connection = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME_TEST,
        charset: process.env.DB_CHARSET,
        timezone: process.env.DB_TIMEZONE
    }
} else {
    console.log(`No database env`)
}

/**
 * Database configuration.
 */
const db = knex({
    client: process.env.DB_CLIENT,
    connection,
    pool: {
        min: 2,
        max: 10,
        idleTimeoutMillis: 30000, // 30 seconds
        createTimeoutMillis: 10000, // 10 seconds
        acquireTimeoutMillis: 10000, // 10 seconds
        reapIntervalMillis: 1000, // 1 second
    },
    "migrations": {
        "tableName": "knex_migrations",
        "directory": "./migrations",
        "stub": "./stubs/migration.stub"
    },
    "seeds": {
        "directory": "./seeds",
        "stub": "./stubs/seed.stub"
    }
});


// Close inactive connections on exit
process.on("exit", () => {
    console.log("exit close");
    db.destroy();
});
// Handle CTRL+C
process.on("SIGINT", () => {
    console.log("SIGINT close");
    db.destroy();
    process.exit();
});
// Handle uncaught exceptions
process.on("uncaughtException", err => {
    console.error("Uncaught Exception:", err);
    db.destroy();
    process.exit(1);
});
// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    db.destroy();
    process.exit(1);
});

module.exports = db;