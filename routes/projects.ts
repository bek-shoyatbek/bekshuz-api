import { Router } from "../deps.ts";
import projectController from "../controllers/projectController.ts";

const router = new Router();

router.use("/api", projectController.routes());

export default router;