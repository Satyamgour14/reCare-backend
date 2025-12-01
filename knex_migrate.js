/**
 * This code is written for migrate multiple database using same migration files.
 * to run this code run command: node knex_migrate.js
 * it will ask you to enter the command to run.
 * */
const prompt = require('prompt-sync')();
const command = prompt('Enter the migrate command(list|latest|run(for all seed)|seed:list|seed:run):');

// Add allowed command in if condition
if (command == '' || (command != 'list' && command != 'latest' && command != 'run' && command != 'seed:list' && command != 'seed:run')) {
    console.log("Invalid command!");
    return false;
}

let seedFileName = '';
if (command == 'seed:run') {
    seedFileName = prompt('Enter the seed file name (e.g., seed-file-name.js):');
    if (!seedFileName) {
        console.log("Invalid seed file name!");
        return false;
    }
    console.log(`Running command: yarn knex seed:run --specific=${seedFileName}`);
} else if (command != 'run') {
    console.log(`Running command: yarn knex migrate:${command}`);
} else {
    console.log(`Running command: yarn knex seed:run`);
}

require('dotenv').config();
'use strict';

const Knex = require('knex');
const Promise = require('bluebird');
const extend = require('xtend');
const format = require('util').format;
const fs = require('fs');
const path = require('path');
const databases = ['main_db', 'test_db'];

const settings = [];
settings["main_db"] = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: process.env.DB_CHARSET,
    timezone: process.env.DB_TIMEZONE
};

settings["test_db"] = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME_TEST,
    charset: process.env.DB_CHARSET,
    timezone: process.env.DB_TIMEZONE
};

Promise.map(databases, function (database) {
    return {
        name: settings[database].database,
        settings: settings[database]
    };
})
    .bind({
        clients: []
    })
    .map(function (database) {
        const client = Knex({
            connection: database.settings,
            client: process.env.DB_CLIENT
        });
        this.clients.push(client);
        return extend(database, {
            knex: client
        });
    })
    .map(function (database) {
        if (command != 'run' && command != 'seed:list' && command != 'seed:run') {

            return database.knex.migrate[command]({ directory: 'src/migrations' })
                .then((response) => {
                    console.log('\n');
                    console.log("********************* Running", database.name, "***********************");
                    if (command == 'list') {
                        for (const completed of response[0]) {
                            console.log('Completed Migration %s', completed.name);
                        }
                        console.log('\n');
                        for (const pending of response[1]) {
                            console.log('Pending Migration %s', pending.file);
                        }
                    } else {
                        console.log('Migration completed for %s', database.name);
                    }
                });

        } else if (command == 'run') {

            return database.knex.seed.run({ directory: 'src/seeds' })
                .then(() => {
                    console.log('\n');
                    console.log("********************* Running", database.name, "***********************");
                    console.log('Seeds completed for', database.name);
                });

        } else if (command == 'seed:list') {

            // Fetch the list of seed files
            const seedsDir = path.resolve('src/seeds');
            const seedFiles = fs.readdirSync(seedsDir).filter(file => file.endsWith('.js'));

            console.log('\n');
            console.log("********************* Seed Files for", database.name, "***********************");
            seedFiles.forEach(file => {
                console.log('Seed file: %s', file);
            });

        } else if (command == 'seed:run') {

            return database.knex.seed.run({ directory: 'src/seeds', specific: seedFileName })
                .then(() => {
                    console.log('\n');
                    console.log("********************* Running", database.name, "***********************");
                    console.log(`Seed ${seedFileName} completed for`, database.name);
                });

        }

    })
    .finally(function () {
        return Promise.map(this.clients, function (knex) {
            return knex.destroy();
        });
    })
    .catch(function (err) {
        console.log(err);
        process.exit(1);
    });