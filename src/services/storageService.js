'use strict';
const { Storage } = require('@google-cloud/storage');
const storage = new Storage();

/**
 * Persists a JSON payload to GCS following the recare-raw naming convention
 * @param {*} transmissionId 
 * @param {*} source 
 * @param {*} buffer 
 * @returns 
 */
async function writeBatchToGcs(transmissionId, source, buffer) {
    const bucketName = process.env.RAW_BUCKET_NAME;
    if (!bucketName) {
        throw new Error('Missing required environment variable RAW_BUCKET_NAME.');
    }

    if (!transmissionId || !source || !Buffer.isBuffer(buffer)) {
        throw new Error('Required param are missing for the GCS configuration.', { transmissionId, source, buffer });
    }

    const env = process.env.NODE_ENV || 'dev';

    const now = new Date();
    const yyyy = now.getUTCFullYear().toString();
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(now.getUTCDate()).padStart(2, '0');

    // const objectPath = `recare-raw/${env}/${source}/${yyyy}/${mm}/${dd}/${transmissionId}.json`;
    const objectPath = ['recare-raw', env, source, yyyy, mm, dd, `${transmissionId}.json`].join('/');

    const bucket = storage.bucket(bucketName);
    const file = bucket.file(objectPath);

    await file.save(buffer, {
        contentType: 'application/json',
        metadata: {
            metadata: { transmissionId }
        }
    });

    return { 
        gcsUri: `gs://${bucketName}/${objectPath}` 
    };
}

module.exports = { writeBatchToGcs };
