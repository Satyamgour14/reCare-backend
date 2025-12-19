'use strict';

import { StatusCodes } from "http-status-codes";
const crypto = require("crypto");
const { writeBatchToGcs } = require("~/services/storageService");
const { publishIngestMetadata, publishDlq } = require("~/services/pubsubService");


class IngestServices {
    constructor({ commonHelpers, commonConstants, IngestModel, DateTimeUtil }) {
        this.DateTimeUtil = DateTimeUtil;
        this.commonHelpers = commonHelpers;
        this.commonConstants = commonConstants; //LOG_EVENTS
        this.IngestModel = IngestModel;
    }

    /**
     * Encrypt body
     * @param {*} body 
     * @returns 
     */
    async computeChecksumFromBody(body) {
        const payloadStr = JSON.stringify(body);
        return {
            checksum: crypto.createHash('md5').update(payloadStr).digest('hex'),
            buffer: Buffer.from(payloadStr, 'utf8'),
            byteSize: Buffer.byteLength(payloadStr, 'utf8')
        };
    }

    /**
     * Handle pubsub failure
     * @param {*} pubSubData 
     */
    async handlePubSubFailure(pubSubData) {

        const { transmissionId, sourceSystem, checksum, partnerIdentity, status, error } = pubSubData;

        await publishDlq({
            transmissionId,
            source: sourceSystem,
            checksum,
            error: error || 'PUBSUB_ERROR',
            timestamp: this.DateTimeUtil.getCurrentTimeObjForDB()
        });

        await this.IngestModel.updateByTransmissionId(transmissionId, { status });

        console.error(this.commonConstants.LOG_EVENTS.INGEST_ERROR, {
            transmissionId,
            partnerIdentity,
            sourceSystem,
            error: error
        });

        return await this.commonHelpers.prepareResponse(StatusCodes.OK, 'SUCCESS', {
            transmissionId,
            status,
            pubsub: {
                success: false,
                reason: 'PUBSUB_PERMISSION_DENIED_OR_ERROR',
                requiredRole: 'roles/pubsub.publisher'
            }
        });
    }

    /**
     * Save ingest batch recored
     * @param {*} reqHeaders 
     * @param {*} reqBody 
     * @returns 
     */
    async saveIngestBatch(reqHeaders, reqBody) {
        const contentType = reqHeaders['content-type'] || '';
        if (!contentType.startsWith('application/json')) {
            return await this.commonHelpers.prepareResponse(StatusCodes.UNSUPPORTED_MEDIA_TYPE, 'UNSUPPORTED_MEDIA_TYPE', { message: "Unsupported Media Type" });
        }

        const { partnerReferenceId, sourceSystem, events, partnerIdentity } = reqBody;

        if (!sourceSystem || typeof sourceSystem !== 'string' || !Array.isArray(events) || events.length === 0) {
            return await this.commonHelpers.prepareResponse(StatusCodes.BAD_REQUEST, 'VALIDATION_ERROR', { message: "Invalid request envelope" });
        }

        for (const ev of events) {
            if (
                !ev ||
                typeof ev.event_type !== 'string' ||
                typeof ev.resident_id !== 'string' ||
                typeof ev.timestamp !== 'string'
            ) {
                return await this.commonHelpers.prepareResponse(StatusCodes.BAD_REQUEST, 'VALIDATION_ERROR', { message: "Invalid event in events array" });
            }
        }

        const transmissionId = crypto.randomUUID();
        const eventCount = events.length;
        const { checksum, buffer, byteSize } = await this.computeChecksumFromBody(reqBody);

        try {
            const existing = await this.IngestModel.getBySourceAndChecksum(sourceSystem, checksum);
            let status = existing ? 'duplicate' : 'received'

            await this.IngestModel.createBatch({
                transmission_id: transmissionId,
                partner_reference_id: partnerReferenceId || null,
                source: sourceSystem,
                gcs_uri: null,
                byte_size: byteSize,
                checksum,
                status,
                received_at: this.DateTimeUtil.getCurrentTimeObjForDB()
            });

            // 1) Persist raw payload (PHI) to GCS - storage service handles CMEK / naming convention
            const { gcsUri } = await writeBatchToGcs(transmissionId, sourceSystem, buffer); // Get gcsUri

            await this.IngestModel.updateByTransmissionId(transmissionId, { gcs_uri: gcsUri });

            let messageId = null;
            if (status != 'duplicate') {

                const metadata = {
                    transmissionId, partnerIdentity, sourceSystem, eventCount, gcsUri, checksum, receivedAt: this.DateTimeUtil.getCurrentTimeObjForDB()
                };

                // Publish to Pub/Sub (metadata-only). The message must not contain PHI.
                const pub = await publishIngestMetadata(metadata);
                console.log('pub');

                // Pubsub publishing failed. Soft-failure: attempt to publish DLQ entry and mark row failed.
                if (!pub.success) {
                    status = 'failed';
                    return await this.handlePubSubFailure({
                        transmissionId,
                        sourceSystem,
                        checksum,
                        partnerIdentity,
                        status,
                        error: pub.error || pub.code
                    });
                }

                messageId = pub.messageId;
                status = 'published';
                await this.IngestModel.updateByTransmissionId(transmissionId, { status });
            }

            console.info(this.commonConstants.LOG_EVENTS.INGEST_PUBLISHED, {
                transmissionId,
                partnerIdentity,
                sourceSystem,
                eventCount
            });

            return await this.commonHelpers.prepareResponse(StatusCodes.OK, 'SUCCESS', {
                transmissionId,
                status,
                pubsub: {
                    success: messageId ? true : false,
                    messageId
                }
            });

        } catch (error) {
            console.error(this.commonConstants.LOG_EVENTS.INGEST_ERROR, {
                transmissionId,
                partnerIdentity,
                sourceSystem,
                error: error.message
            });

            try {
                await publishDlq({
                    transmissionId,
                    source: sourceSystem,
                    checksum,
                    error: error.message,
                    timestamp: this.DateTimeUtil.getCurrentTimeObjForDB()
                });

                await this.IngestModel.updateByTransmissionId(transmissionId, { status: 'failed' });

            } catch (e) {
                return await this.commonHelpers.prepareResponse(StatusCodes.INTERNAL_SERVER_ERROR, 'INTERNAL_SERVER_ERROR', { message: e.message || "Something wrong! Internal Server Error" });
            }

            return await this.commonHelpers.prepareResponse(StatusCodes.INTERNAL_SERVER_ERROR, 'INTERNAL_SERVER_ERROR', { message: error.message || "Something wrong! Internal Server Error" });
        }
    }
}

module.exports = IngestServices;