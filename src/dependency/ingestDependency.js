const { asClass } = require("awilix")
const IngestController = require("../modules/v1/ingest/controllers/IngestController");
const IngestServices = require("../modules/v1/ingest/services/IngestService");
const IngestModel = require("../modules/v1/ingest/models/IngestModel");


const ingestDependency = {
    IngestController: asClass(IngestController).singleton(),
    IngestServices: asClass(IngestServices).singleton(),
    IngestModel: asClass(IngestModel).singleton(),
}

module.exports = {
    ...ingestDependency,
}
