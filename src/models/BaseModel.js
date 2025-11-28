import knexConfig from "~/config/knexfile";
const db = knexConfig;
import logger from "~/utils/logger";

/**
 * Define base model
*/
class BaseModel {

    /**
     *  For inserting new properties to table.
     * @param {*} insertData 
     * @param {*} tableName 
     * @returns 
     */
    createObj(insertData, tableName) {
        let prepareQuery = insertData;

        return db(tableName)
            .insert(prepareQuery);
    }

    /**
     * For updating new properties to table.
     * @param {*} properties 
     * @param {*} query 
     * @param {*} tableName 
     * @returns 
     */
    async updateObj(properties, query = {}, tableName) {
        try {
            const res = await db(tableName)
                .update(properties)
                .where(query);
            return res;
        } catch (error) {
            logger.error("Base model error:", error);
            return error;
        }
    }

    /**
     * Delete the records against query on the table. 
     * @param {*} query 
     * @param {*} tableName 
     * @returns 
     */
    deleteObj(query = {}, tableName) {

        return db(tableName)
            .where(query)
            .del()
            .then((res) => {
                return res;
            });
    }

    /**
     * For truncate table
     * @param {*} tableName 
     * @returns 
     */
    async truncateTable(tableName) {
        try {
            await Promise.all([
                db.raw('SET foreign_key_checks = 0'),
                db(tableName).truncate(),
                db.raw('SET foreign_key_checks = 1')
            ]);

        } catch (error) {
            logger.error("Base model error:", error);
            return error;
        }
    }

    /**
      * To get count 
      * @param {*} tableName 
      * @param {*} query 
      * @returns 
      */
    getCount(tableName, query = {}) {
        return db(tableName)
            .where(query)
            .count('* as count')
            .first();
    }

    /**
     * Fetch an object from the database based on given query parameters.
     *
     * @param {Object} query The query to match against.
     * @param {String} tableName The table to query.
     * @param {Object} [orQuery={}] Optional OR query to match against.
     * @param {Object} [queryNot={}] Optional query for negation.
     * @param {String} [orderByColumn=null] Optional column to order by.
     * @param {String} [orderDirection='asc'] Optional direction for ordering (asc or desc).
     * @returns {Object} The resulting object or null.
     */
    async fetchSingleObj(query = {}, tableName, orQuery = {}, queryNot = {}, orderByColumn = 'id', orderDirection = 'asc') {
        let prepareQuery =
            db(tableName).select().where(query);

        // Apply optional OR query if provided
        if (orQuery) {
            prepareQuery.orWhere(orQuery);
        }

        // Apply optional WHERE NOT query if provided
        if (queryNot) {
            prepareQuery.whereNot(queryNot);
        }

        // Apply optional ordering if an orderBy column is provided
        if (orderByColumn) {
            prepareQuery.orderBy(orderByColumn, orderDirection);
        }

        // Return the first match
        prepareQuery.first();

        return prepareQuery;
    }

    /**
     * Get all rows from table
     * @param {*} tableName 
     * @param {*} orderBy 
     * @returns 
     */
    fetchAll(tableName = this.table, orderBy = 'asc') {
        return db(tableName)
            .select()
            .orderBy('id', orderBy)
            .then((res) => {
                return res;
            });
    }

    /**
     * Get a collection of models matching a given query.
     * @param {*} query 
     * @param {*} joinKey 
     * @param {*} joinTable 
     * @param {*} tableKey 
     * @param {*} tableName 
     * @param {*} first 
     * @returns 
     */
    fetchJoinObj(query = {}, joinKey, joinTable, tableKey, tableName = this.table, first = true) {
        var result = db(tableName)
            .select(db.raw(`*`))
            .join(joinTable, `${tableName}.${tableKey}`, `${joinTable}.${joinKey}`)
            .where(query)
        if (first == true) {

            result.first()
        }
        return result;
    }

    /**
     * Get a collection of models matching a given query.
     *
     * @param {Object} query The query to match against.
     * @param {String} tableName The query to match against.
     * @returns {Array} An array holding resultant models.
     */
    fetchObj(query = {}, tableName = this.table, orderBy = 'asc', search) {
        var result = db(tableName)
            .select()
            .where(query)
        if (search) {
            result.where(builder => {
                builder.where(`${tableName}.first_name`, 'like', `%${search}%`)
                    .orWhere(`${tableName}.email`, 'like', `%${search}%`)
                    .orWhere(`${tableName}.last_name`, 'like', `%${search}%`)
            })
        }

        return result
    }

    /**
         * Get a collection of models matching a given query.
         *
         * @param {Object} query The query to match against.
         * @param {String} tableName The query to match against.
         * @returns {Array} An array holding resultant models.
         */
    fetchJoinObjWithSelectedFields(query = {}, opts = [], joinKey, joinTable, tableKey, tableName = this.table, orderby, order, limit, offset) {
        let prepareQuery = db(tableName)
            .select(...opts)
            .where(query)
            .leftJoin(joinTable, `${tableName}.${tableKey}`, `${joinTable}.${joinKey}`);

        if (orderby && order) {
            prepareQuery = prepareQuery.orderBy(orderby, order);
        }

        if (limit !== undefined && offset !== undefined) {
            prepareQuery = prepareQuery.limit(limit).offset(offset);
        }

        return prepareQuery;
    }

    /**
     * Get a collection of models matching a given query.
    *
    * @param {Object} query The query to match against.
    * @param {String} tableName The query to match against.
    * @returns {Array} An array holding resultant models.
    */
    fetchFirstObj(query = {}, tableName = this.table, orQuery = {}, queryNot = {}) {
        let prepareQuery = db(tableName)
        prepareQuery.select()
        prepareQuery.where(query)
        prepareQuery.orWhere(orQuery)
        prepareQuery.whereNot(queryNot)
        prepareQuery.first();

        return prepareQuery;
    }

    /**
     * Get a collection of models matching a given query.
     *
     * @param {Object} query The query to match against.
     * @param {Object} opts Options.
     * @param {String} tableName The query to match against.
     * @returns {Array} An array holding resultant models.
     */
    fetchObjWithSingleRecord(query = {}, opts = {}, tableName = this.table, queryNot = {}) {

        return db(tableName)
            .select(db.raw(opts))
            .where(query)
            .whereNot(queryNot)
            .first()
            .then((row) => {

                return row;
            });
    }

    /**
     * Get a collection of models matching a given query.
     *
     * @param {Object} query The query to match against.
     * @param {Object} opts Options.
     * @param {String} tableName The query to match against.
     * @param {Object} orderby
     * @param {Object} order
     * @returns {Array} An array holding resultant models.
     */
    fetchObjWithSelectedFields(query = {}, opts = {}, tableName = this.table, orderby, order, limit, offset) {
        let prepareQuery = db(tableName);
        prepareQuery.select(opts);
        prepareQuery.where(query);

        if (orderby !== undefined && order !== undefined) {
            prepareQuery = prepareQuery.orderBy(orderby, order);
        }

        if (limit !== undefined && offset !== undefined) {
            prepareQuery = prepareQuery.limit(limit).offset(offset);
        }

        prepareQuery = prepareQuery.then((res) => {
            return res;
        });

        return prepareQuery;
    }

    /**
     * Get a collection of models matching a given query.
     *
     * @param {Object} query The query to match against.
     * @param {Object} wherein The query to match against.
     * @param {String} tableName The query to match against.
     * @returns {Array} An array holding resultant models.
     */
    fetchObjWhereIn(query = {}, whereinkey, wherein = [], tableName = this.table) {
        let prepareQuery = db(tableName)
        prepareQuery.select()
        prepareQuery.where(query);

        if (wherein.length > 0) {
            prepareQuery = prepareQuery.whereIn(whereinkey, wherein);
        }

        prepareQuery = prepareQuery.then((res) => {
            return res;
        });

        return prepareQuery;

    }

}
export default BaseModel;