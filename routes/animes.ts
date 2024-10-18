import { Router } from "../deps.ts";
import animeController from "../controllers/animeController.ts";

const router = new Router();

router.use("/api", animeController.routes());

export default router;