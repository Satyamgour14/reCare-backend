import { Router } from "express";
import { authRouter } from "../auth/routes";
import { ingestRoute } from "../ingest/routes";

const v1ApiRoutes = new Router();
v1ApiRoutes.use("/auth", authRouter);
v1ApiRoutes.use("/ingest", ingestRoute);

export { v1ApiRoutes };