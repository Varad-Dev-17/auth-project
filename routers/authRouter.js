import express from "express";
import { signUp } from "../controllers/authController.js";

const router = express.Router();

router.post("/signup", signUp);
// router.post("/login", login);

export default router;
