'use strict';
const { Storage } = require('@google-cloud/storage');
const crypto = require('crypto');
const storage = new Storage();

async function writeBatchToGcs(transmissionId, body) {
    if (!process.env.RAW_BUCKET_NAME) throw new Error('RAW_BUCKET_NAME is not configured');
    const payloadStr = JSON.stringify(body);
    const buffer = Buffer.from(payloadStr, 'utf8');
    const checksum = crypto.createHash('md5').update(buffer).digest('hex');
    const byteSize = buffer.length;
    const source = body.sourceSystem || body.source || 'unknown';
    const env = process.env.NODE_ENV || 'dev';
    const now = new Date();
    const yyyy = now.getUTCFullYear().toString();
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(now.getUTCDate()).padStart(2, '0');
    const objectPath = `recare-raw/${env}/${source}/${yyyy}/${mm}/${dd}/${transmissionId}.json`;
    const bucket = storage.bucket(process.env.RAW_BUCKET_NAME);
    const file = bucket.file(objectPath);
    await file.save(buffer, {
        contentType: 'application/json',
        metadata: { metadata: { transmissionId } }
    });
    const gcsUri = `gs://${process.env.RAW_BUCKET_NAME}/${objectPath}`;
    return { gcsUri, byteSize, checksum };
}

module.exports = { writeBatchToGcs };
