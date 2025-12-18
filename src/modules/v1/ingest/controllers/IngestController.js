

class IngestController {
    constructor({ responseHandler, IngestServices }) {
        this.responseHandler = responseHandler;
        this.IngestServices = IngestServices;
    }


    async saveIngestBatch(req, res) {
            const serviceRes = await this.IngestServices.saveIngestBatch(req.headers, req.body);
            await this.responseHandler.handleServiceResponse(req, res, serviceRes);
    }

}

module.exports = IngestController;