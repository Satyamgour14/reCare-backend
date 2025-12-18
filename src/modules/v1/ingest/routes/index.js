import { Router } from "express";

// Create a Router instance for user ingest routes
const ingestRoute = new Router();

const container = require("~/dependency");
const IngestController = container.resolve("IngestController");
const authorizePartner = container.resolve("authorizePartner");

ingestRoute.post('/batch', authorizePartner, (req, res) => { IngestController.saveIngestBatch(req, res) });

export { ingestRoute };