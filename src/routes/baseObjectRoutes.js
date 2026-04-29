import { Router } from "express";
import {
    getAllBaseObjects,
    createBaseObject
} from "../controllers/baseObjectController.js";
import { validateBody } from "../middlewares/validateBody.js";

const router = Router();

router.get("/", getAllBaseObjects);
router.post("/", validateBody(["name"]), createBaseObject);

export default router;
