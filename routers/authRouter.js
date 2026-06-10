import express from "express";
import {
  signUp,
  signIn,
  signOut,
  sendVerificationCode,
  verifyVerificationCode,
  changePassword,
  sendForgotPasswordCode,
  verifyForgotPasswordCode,
} from "../controllers/AuthController.js";

import { identifier } from "../middlewares/identification.js";

const router = express.Router();

router.post("/signup", signUp);
router.post("/signin", signIn);
router.post("/signout", signOut);
router.patch("/send-verification-code", sendVerificationCode);
router.patch("/verify-verification-code", verifyVerificationCode);
router.patch("/change-password", identifier, changePassword);
router.patch("/send-forgot-password-code", sendForgotPasswordCode);
router.patch("/verify-forgot-password-code", verifyForgotPasswordCode);

export default router;
