import BaseModel from '~/models/BaseModel';

class IngestModels extends BaseModel {
    constructor({ db, tableConstants, DateTimeUtil, logger }) {
        super();
        this.db = db;
        this.tableConstants = tableConstants;
        this.DateTimeUtil = DateTimeUtil;
        this.logger = logger || console;
    }

    /**
     * Insert batch recored
     * @param {*} payload 
     * @returns 
     */
    async createBatch(payload) {
        try {
            const [row] = await this.db(this.tableConstants.LANDING_BATCHES)
                .insert(payload)
                .returning('*');

            return {
                status: true,
                data: row,
            };
        } catch (err) {
            this.logger.error('[createBatch] failed', { err });
            throw new Error('Failed to create landing batch');
        }
    }

    /**
     * Fetch batch recored
     * @param {*} source 
     * @param {*} checksum 
     * @returns 
     */
    async getBySourceAndChecksum(source, checksum) {
        try {
            const row = await this.db(this.tableConstants.LANDING_BATCHES)
                .where({ source, checksum })
                .first();

            return {
                status: true,
                data: row || {},
            };
        } catch (err) {
            this.logger.error(`[getBySourceAndChecksum(${source, checksum})] failed`, err);
            throw new Error(err);
        }
    }

    /**
     * Update batch recored
     * @param {*} transmissionId 
     * @param {*} updateFields 
     * @returns 
     */
    async updateByTransmissionId(transmissionId, updateFields) {
        try {
            const mutation = {
                ...updateFields,
                updated_at: this.DateTimeUtil.getCurrentTimeObjForDB()
            }

            const [row] = await this.db(this.tableConstants.LANDING_BATCHES)
                .where({ transmission_id: transmissionId })
                .update(mutation)
                .returning('*');

            if (!row) {
                this.logger.warn(`No batch found to update ${transmissionId}`);
                return {
                    status: false,
                    message: 'No batch found to update',
                    data: {},
                };
            }

            return {
                status: true,
                data: row,
            };
        } catch (error) {
            this.logger.error('[updateByTransmissionId] failed', { transmissionId, err });
            throw new Error('Failed to update landing batch');
        }
    }
}

module.exports = IngestModels;