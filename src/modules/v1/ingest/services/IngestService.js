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
        const str = JSON.stringify(body);
        return crypto.createHash('md5').update(str).digest('hex');
    }

    /**
     * Handle pubsub failure
     * @param {*} pubSubData 
     */
    async handlePubSubFailure(pubSubData) {

        const { transmissionId, sourceSystem, checksum, partnerIdentity, error } = pubSubData;

        await publishDlq({
            transmissionId,
            source: sourceSystem,
            checksum,
            error: error || 'PUBSUB_ERROR',
            timestamp: this.DateTimeUtil.getCurrentTimeObjForDB()
        });

        await this.IngestModel.updateByTransmissionId(transmissionId, {
            status: 'failed'
        });

        console.error(this.commonConstants.LOG_EVENTS.INGEST_ERROR, {
            transmissionId,
            partnerIdentity,
            sourceSystem,
            error: error
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
            return await this.commonHelpers.prepareResponse(StatusCodes.BAD_REQUEST, '', { message: "Invalid request envelope" });
        }

        for (const ev of events) {
            if (
                !ev ||
                typeof ev.event_type !== 'string' ||
                typeof ev.resident_id !== 'string' ||
                typeof ev.timestamp !== 'string'
            ) {
                return await this.commonHelpers.prepareResponse(StatusCodes.BAD_REQUEST, '', { message: "Invalid event in events array" });
            }
        }

        const transmissionId = crypto.randomUUID();
        const eventCount = events.length;
        const checksum = await this.computeChecksumFromBody(reqBody);

        try {
            const existing = await this.IngestModel.getBySourceAndChecksum(
                sourceSystem,
                checksum
            );

            await this.IngestModel.createBatch({
                transmission_id: transmissionId,
                partner_reference_id: partnerReferenceId || null,
                source: sourceSystem,
                gcs_uri: null,
                byte_size: null,
                checksum,
                status: existing ? 'duplicate' : 'received',
                received_at: this.DateTimeUtil.getCurrentTimeObjForDB()
            });

            const { gcsUri, byteSize } = await writeBatchToGcs(transmissionId, reqBody);
            
            await this.IngestModel.updateByTransmissionId(transmissionId, {
                gcs_uri: gcsUri,
                byte_size: byteSize
            });

            const metadata = {
                transmissionId,
                partnerIdentity,
                sourceSystem,
                eventCount,
                gcsUri,
                checksum,
                receivedAt: this.DateTimeUtil.getCurrentTimeObjForDB()
            };
            const pub = await publishIngestMetadata(metadata);
            
            if (!pub.success) {

                await this.handlePubSubFailure({
                    transmissionId,
                    sourceSystem,
                    checksum,
                    partnerIdentity,
                    error: pub.error || pub.code
                });

                return await this.commonHelpers.prepareResponse(StatusCodes.OK, 'SUCCESS', {
                    transmissionId,
                    status: 'accepted',
                    pubsub: {
                        success: false,
                        reason: 'PUBSUB_PERMISSION_DENIED_OR_ERROR',
                        requiredRole: 'roles/pubsub.publisher'
                    }
                });
            }

            await this.IngestModel.updateByTransmissionId(transmissionId, {
                status: 'published'
            });

            console.info(this.commonConstants.LOG_EVENTS.INGEST_ACCEPTED, {
                transmissionId,
                partnerIdentity,
                sourceSystem,
                eventCount
            });

            return await this.commonHelpers.prepareResponse(StatusCodes.OK, 'SUCCESS', {
                transmissionId, status: 'accepted',
                pubsub: { success: true, messageId: pub.messageId }
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
            } catch (e) { }

            try {
                await this.IngestModel.updateByTransmissionId(transmissionId, {
                    status: 'failed'
                });
            } catch (e) { }
            return await this.commonHelpers.prepareResponse(StatusCodes.INTERNAL_SERVER_ERROR, 'INTERNAL_SERVER_ERROR', { message: "Something wrong! Internal Server Error", error: error.message });
        }
    }
}

module.exports = IngestServices;