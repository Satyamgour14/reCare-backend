import { Router } from "express";
import { userAuth } from "../auth/routes";

const userV1ApiRoutes = new Router();
userV1ApiRoutes.use("/auth", userAuth);

export { userV1ApiRoutes };