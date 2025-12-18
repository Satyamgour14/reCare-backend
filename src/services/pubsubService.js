'use strict';
const { PubSub } = require('@google-cloud/pubsub');
const { ingestTopic, dlqTopic } = require('../config/envConfig');
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
  return publishMessageToTopic(ingestTopic, metadata);
}

async function publishDlq(metadata) {
  if (!dlqTopic) return { success: false, error: 'DLQ_TOPIC not configured' };
  return publishMessageToTopic(dlqTopic, metadata);
}

module.exports = { publishIngestMetadata, publishDlq };
