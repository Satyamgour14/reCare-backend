require("dotenv").config();

function requireEnv(name) {
    const value = process.env[name];
    if (!value) throw new Error(`Missing required environment variable: ${name}`);
    return value;
}
module.exports = {
    rawBucketName: requireEnv('RAW_BUCKET_NAME'),
    ingestTopic: requireEnv('INGEST_TOPIC'),
    dlqTopic: requireEnv('DLQ_TOPIC'),
    allowedSubjects: (process.env.ALLOWED_SUBJECTS || '').split(';').filter(Boolean)
};
