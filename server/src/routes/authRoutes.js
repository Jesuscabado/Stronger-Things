import { Router } from "express";
import { register, login, me, toggleDM, googleLogin, deleteMe } from "../controllers/authController.js";
import { validateBody } from "../middlewares/validateBody.js";
import { authRequired } from "../middlewares/authRequired.js";

const router = Router();

router.post("/register", validateBody(["username", "email", "password"]), register);
router.post("/login", validateBody(["email", "password"]), login);
router.post("/google", googleLogin);
router.get("/me", authRequired, me);
router.patch("/me/dm", authRequired, toggleDM);
router.delete("/me", authRequired, deleteMe);
export default router;
