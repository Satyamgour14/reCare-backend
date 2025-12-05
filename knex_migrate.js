#!/usr/bin/env node
'use strict';

/**
 * Multi-database migration/seed runner using shared migration files.
 * Run: node knex_migrate.js
 * Then enter one of:
 *   - list
 *   - latest
 *   - run           (run all seeds)
 *   - seed:list     (list seed files)
 *   - seed:run      (run specific seed file)
 */

require('dotenv').config();

const prompt = require('prompt-sync')();
const Knex = require('knex');
const fs = require('fs');
const path = require('path');

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const ALLOWED_COMMANDS = new Set([
    'list',
    'latest',
    'run',
    'seed:list',
    'seed:run'
]);

const MIGRATIONS_DIR = 'src/migrations';
const SEEDS_DIR = 'src/seeds';

// Keep the same DB identifiers as before
const DATABASE_KEYS = ['main_db', 'test_db'];

// -----------------------------------------------------------------------------
// CLI helpers
// -----------------------------------------------------------------------------

function askCommand() {
    const command = prompt(
        'Enter the migrate command (list|latest|run(for all seed)|seed:list|seed:run): '
    );

    if (!ALLOWED_COMMANDS.has(command)) {
        console.log('Invalid command!');
        process.exit(1);
    }

    return command;
}

function askSeedFileName() {
    const seedFileName = prompt('Enter the seed file name (e.g., seed-file-name.js): ');

    if (!seedFileName) {
        console.log('Invalid seed file name!');
        process.exit(1);
    }

    return seedFileName;
}

function logPlannedCommand(command, seedFileName) {
    if (command === 'seed:run') {
        console.log(`Running command: yarn knex seed:run --specific=${seedFileName}`);
    } else if (command === 'run') {
        console.log('Running command: yarn knex seed:run');
    } else {
        console.log(`Running command: yarn knex migrate:${command}`);
    }
}

// -----------------------------------------------------------------------------
// DB config & client creation
// -----------------------------------------------------------------------------

function buildSettingsFromEnv() {
    const settings = [];

    settings['main_db'] = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        charset: process.env.DB_CHARSET,
        timezone: process.env.DB_TIMEZONE
    };

    settings['test_db'] = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME_TEST,
        charset: process.env.DB_CHARSET,
        timezone: process.env.DB_TIMEZONE
    };

    return settings;
}

function createDatabaseClients(settings) {
    return DATABASE_KEYS.map((key) => {
        const dbSettings = settings[key];
        const knex = Knex({
            connection: dbSettings,
            client: process.env.DB_CLIENT
        });

        return {
            key,
            name: dbSettings.database,
            settings: dbSettings,
            knex
        };
    });
}

// -----------------------------------------------------------------------------
// Logging helpers
// -----------------------------------------------------------------------------

function logDatabaseBanner(databaseName) {
    console.log('\n');
    console.log('********************* Running', databaseName, '***********************');
}

// -----------------------------------------------------------------------------
// Command handlers (per database)
// -----------------------------------------------------------------------------

async function handleMigrateCommand(db, command) {
    const response = await db.knex.migrate[command]({ directory: MIGRATIONS_DIR });

    logDatabaseBanner(db.name);

    if (command === 'list') {
        const [completed, pending] = response;

        for (const completedMigration of completed) {
            console.log('Completed Migration %s', completedMigration.name);
        }

        console.log('\n');

        for (const pendingMigration of pending) {
            console.log('Pending Migration %s', pendingMigration.file);
        }
    } else {
        console.log('Migration completed for %s', db.name);
    }
}

async function handleRunAllSeeds(db) {
    await db.knex.seed.run({ directory: SEEDS_DIR });

    logDatabaseBanner(db.name);
    console.log('Seeds completed for', db.name);
}

function handleSeedList(db) {
    const seedsDir = path.resolve(SEEDS_DIR);

    let seedFiles = [];
    try {
        seedFiles = fs
            .readdirSync(seedsDir)
            .filter((file) => file.endsWith('.js'));
    } catch (err) {
        console.log('\n');
        console.log('********************* Seed Files for', db.name, '***********************');
        console.log(`Error reading seeds directory (${seedsDir}):`, err.message);
        return;
    }

    console.log('\n');
    console.log('********************* Seed Files for', db.name, '***********************');
    seedFiles.forEach((file) => {
        console.log('Seed file: %s', file);
    });
}

async function handleSeedRunSpecific(db, seedFileName) {
    await db.knex.seed.run({
        directory: SEEDS_DIR,
        specific: seedFileName
    });

    logDatabaseBanner(db.name);
    console.log(`Seed ${seedFileName} completed for`, db.name);
}

// -----------------------------------------------------------------------------
// Orchestration
// -----------------------------------------------------------------------------

async function executeForAllDatabases(databases, command, seedFileName) {
    for (const db of databases) {
        if (command === 'run') {
            await handleRunAllSeeds(db);
        } else if (command === 'seed:list') {
            handleSeedList(db);
        } else if (command === 'seed:run') {
            await handleSeedRunSpecific(db, seedFileName);
        } else {
            // list | latest | (any other migrate command wired the same way)
            await handleMigrateCommand(db, command);
        }
    }
}

async function destroyAllClients(databases) {
    await Promise.all(
        databases.map((db) => db.knex.destroy())
    );
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------

async function main() {
    const command = askCommand();

    let seedFileName = '';
    if (command === 'seed:run') {
        seedFileName = askSeedFileName();
    }

    logPlannedCommand(command, seedFileName);

    const settings = buildSettingsFromEnv();
    const databases = createDatabaseClients(settings);

    try {
        await executeForAllDatabases(databases, command, seedFileName);
    } catch (err) {
        console.log(err);
        process.exitCode = 1;
    } finally {
        await destroyAllClients(databases);
    }
}

main();
