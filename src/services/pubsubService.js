'use strict';
const { PubSub } = require('@google-cloud/pubsub');
const pubsub = new PubSub();

async function publishMessageToTopic(topicName, jsonMessage) {
  if (!topicName) {
    throw new Error('No topic configured');
  }
  const topic = pubsub.topic(topicName);
  try {
    const [messageId] = await topic.publishMessage({ json: jsonMessage });
    return { success: true, messageId };
  } catch (err) {
    return { success: false, error: err.message || String(err), code: err.code || null };
  }
}

async function publishIngestMetadata(metadata) {
  const ingestTopic = process.env.INGEST_TOPIC;
  if (!ingestTopic) throw new Error('Missing required environment variable INGEST_TOPIC.');
  return publishMessageToTopic(ingestTopic, metadata);
}

async function publishDlq(metadata) {
  const dlqTopic = process.env.DLQ_TOPIC;
  if (!dlqTopic) throw new Error('Missing required environment variable DLQ_TOPIC.');
  return publishMessageToTopic(dlqTopic, metadata);
}

module.exports = { publishIngestMetadata, publishDlq };
