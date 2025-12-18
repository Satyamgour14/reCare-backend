/**
 * this migration create landing batches table
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable('landing_batches', (table) => {
        table.uuid('transmission_id').primary();
        table.string('partner_reference_id').nullable();
        table.string('source').notNullable();
        table.string('gcs_uri').nullable();
        table.bigInteger('byte_size').nullable();
        table.string('checksum').nullable();
        table.enu('status', ['received', 'published', 'duplicate', 'failed']).notNullable().defaultTo('received');
        table.timestamp('received_at').notNullable().defaultTo(knex.fn.now());
        table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
        table.index(["source"], "landing_batches_source_index");
        table.index(["checksum"], "landing_batches_checksum_index");
        table.index(["status"], "landing_batches_status_index");
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTableIfExists('landing_batches');
};
