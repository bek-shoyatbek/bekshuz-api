import { Router } from "../deps.ts";
import articleController from "../controllers/articleController.ts";

const router = new Router();

router.use("/api", articleController.routes());

export default router;