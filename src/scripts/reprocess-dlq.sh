#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/reprocess-dlq.sh <dlq-subscription> [limit]
# Example: ./scripts/reprocess-dlq.sh recare-landing-dlq-sub 10

DLQ_SUBSCRIPTION="$1"
LIMIT="${2:-10}"
INGEST_TOPIC="${INGEST_TOPIC:-recare-landing-ingest}"

if [ -z "$DLQ_SUBSCRIPTION" ]; then
  echo "Usage: $0 <dlq-subscription> [limit]"
  exit 1
fi

echo "Pulling up to $LIMIT messages from subscription: $DLQ_SUBSCRIPTION"
# Pull messages (acknowledge immediately after pull for manual flow).
gcloud pubsub subscriptions pull "$DLQ_SUBSCRIPTION" --limit="$LIMIT" --auto-ack --format=json > /tmp/dlq_msgs.json

if [ ! -s /tmp/dlq_msgs.json ]; then
  echo "No messages found"
  exit 0
fi

# iterate messages
jq -c '.[]' /tmp/dlq_msgs.json | while read -r msg; do
  # msg.message.data is base64 encoded - decode it
  DATA=$(echo "$msg" | jq -r '.message.data' | base64 --decode)
  echo "Re-publishing to $INGEST_TOPIC: $DATA"
  gcloud pubsub topics publish "$INGEST_TOPIC" --message="$DATA"
done

echo "Reprocess complete"

# Notes
# This script pulls DLQ messages (non-PHI) for manual review and re-publishes them to the ingest topic. Use carefully. Keep DLQ payloads free of PHI.