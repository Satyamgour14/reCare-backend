/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema
        .createTable('users', function (table) {
            table.increments('id').primary().comment('Primary-key');
            table.string('name', 255).notNullable();
            table.string('email', 255).notNullable().unique().comment('Unique email');
            table.string('password', 255).notNullable();
            table.specificType('status', 'SMALLINT').notNullable().defaultTo(1).comment('1:Active 0:inactive');
            table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
        });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTable('users');
};
