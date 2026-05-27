import { Router } from "express";
import {
    getAllUsers, updateUserRole, updateUserDM, updateUserFeature, deleteUser, getStats
} from "../controllers/userController.js";
import { authRequired } from "../middlewares/authRequired.js";
import { adminRequired } from "../middlewares/adminRequired.js";
import { validateObjectId } from "../middlewares/validateBody.js";

const router = Router();

router.use(authRequired);
router.use(adminRequired);

router.get("/stats", getStats);
router.get("/users", getAllUsers);
router.put("/users/:id/role",    validateObjectId(), updateUserRole);
router.put("/users/:id/dm",      validateObjectId(), updateUserDM);
router.put("/users/:id/feature", validateObjectId(), updateUserFeature);
router.delete("/users/:id",      validateObjectId(), deleteUser);

export default router;