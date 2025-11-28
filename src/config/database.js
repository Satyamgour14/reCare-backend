import knexConfig from "./knexfile";

/**
 * Knex connection with our database configuration
*/

const db = knexConfig;

module.exports = { db };