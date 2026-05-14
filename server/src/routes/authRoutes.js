import { Router } from "express";
import { register, login, me } from "../controllers/authController.js";
import { validateBody } from "../middlewares/validateBody.js";
import { authRequired } from "../middlewares/authRequired.js";

const router = Router();

router.post("/register", validateBody(["username", "email", "password"]), register);
router.post("/login", validateBody(["email", "password"]), login);
router.get("/me", authRequired, me);

export default router;
