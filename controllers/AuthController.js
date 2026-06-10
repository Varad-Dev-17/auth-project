import {
  signupSchema,
  signinSchema,
  acceptCodeSchema,
  changePasswordSchema,
  acceptFPCodeSchema,
} from "../middlewares/validator.js";
import User from "../models/userModels.js";
import jwt from "jsonwebtoken";
import { hashPassword, doHashValidation, hmacProcess } from "../utils/hash.js";
import transport from "../middlewares/sendMail.js";
import { verificationEmailTemplate } from "../utils/emailTemplate.js";
import { forgotPasswordEmailTemplate } from "../utils/forgotPassEmailTemplate.js";
import { welcomeEmailTemplate } from "../utils/welcomeEmailTemplate.js";

export const signUp = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const { error } = signupSchema.validate({ username, email, password });
    if (error) {
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ success: false, message: "User already exists." });
    }

    const hashedPassword = await hashPassword(password, 12);
    const newUser = new User({ username, email, password: hashedPassword });
    const result = await newUser.save();

    await transport.sendMail({
      from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
      to: email,
      subject: "Welcome! Verify Your Email",
      html: welcomeEmailTemplate(username),
    });

    result.password = undefined;

    res.status(201).json({
      success: true,
      message: "Your account has been created successfully.",
      result,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
};

export const signIn = async (req, res) => {
  const { email, password } = req.body;

  try {
    const { error } = signinSchema.validate({ email, password });
    if (error) {
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    const existingUser = await User.findOne({ email }).select("+password");
    if (!existingUser) {
      return res
        .status(401)
        .json({ success: false, message: "User does not exists." });
    }

    const result = await doHashValidation(password, existingUser.password);
    if (!result) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials!" });
    }

    const token = jwt.sign(
      {
        userId: existingUser._id,
        email: existingUser.email,
        verified: existingUser.verified,
      },
      process.env.JWT_TOKEN_SECRET,
      { expiresIn: "8h" }
    );

    res
      .cookie("Authorization", "Bearer " + token, {
        expires: new Date(Date.now() + 8 * 3600000),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      })
      .status(200)
      .json({
        success: true,
        message: "Sign in successful.",
        token,
      });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
};

export const signOut = async (req, res) => {
  res
    .clearCookie("Authorization")
    .status(200)
    .json({ success: true, message: "Logged out successfully." });
};

export const sendVerificationCode = async (req, res) => {
  const { email } = req.body;
  try {
    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      return res
        .status(404)
        .json({ success: false, message: "User does not exists." });
    }
    if (existingUser.verified) {
      return res
        .status(400)
        .json({ success: false, message: "You are already verified." });
    }

    const verificationCode = Math.floor(Math.random() * 1000000).toString();

    console.log("Sending email to:", existingUser.email);
    console.log("From:", process.env.NODE_CODE_SENDING_EMAIL_ADDRESS);

    let info = await transport.sendMail({
      from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
      to: existingUser.email,
      subject: "Verify Your Email",
      html: verificationEmailTemplate(verificationCode, existingUser.username),
    });

    console.log("Email info:", info);

    if (info.accepted[0] === existingUser.email) {
      const hashedCodeValue = hmacProcess(
        verificationCode,
        process.env.HMAC_VERIFICATION_CODE_SECRET
      );
      existingUser.verificationCode = hashedCodeValue;
      existingUser.verificationCodeValidation = Date.now();

      await existingUser.save();
      return res
        .status(200)
        .json({ success: true, message: "Verification Code sent!." });
    }
    res
      .status(400)
      .json({ success: false, message: "Failed to send verification code!." });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
};

export const verifyVerificationCode = async (req, res) => {
  const { email, codeProvided } = req.body;

  try {
    const { error, value } = acceptCodeSchema.validate({
      email,
      codeProvided,
    });
    if (error) {
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    const existingUser = await User.findOne({ email }).select(
      "+verificationCode +verificationCodeValidation"
    );
    if (!existingUser) {
      return res
        .status(404)
        .json({ success: false, message: "User does not exists." });
    }

    if (existingUser.verified) {
      return res
        .status(400)
        .json({ success: false, message: "You are already verified." });
    }

    if (
      !existingUser.verificationCode ||
      !existingUser.verificationCodeValidation
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Something is wrong with the code!" });
    }

    // Check if code expired (1 hour = 3600000 ms)
    if (Date.now() - existingUser.verificationCodeValidation > 3600000) {
      return res
        .status(400)
        .json({ success: false, message: "Verification code expired." });
    }

    const hashedCode = hmacProcess(
      codeProvided.toString(),
      process.env.HMAC_VERIFICATION_CODE_SECRET
    );

    if (hashedCode === existingUser.verificationCode) {
      existingUser.verified = true;
      existingUser.verificationCode = undefined;
      existingUser.verificationCodeValidation = undefined;
      await existingUser.save();

      return res
        .status(200)
        .json({ success: true, message: "Email verified successfully." });
    }
    res
      .status(400)
      .json({ success: false, message: "Invalid verification code." });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
};

export const changePassword = async (req, res) => {
  const { userId, verified } = req.user;
  const { oldPassword, newPassword } = req.body;

  try {
    const { error, value } = changePasswordSchema.validate({
      oldPassword,
      newPassword,
    });

    if (error) {
      return res
        .status(401)
        .json({ success: false, message: error.details[0].message });
    }

    if (!verified) {
      return res
        .status(401)
        .json({ success: false, message: "You are not verified user!" });
    }
    const existingUser = await User.findOne({ _id: userId }).select(
      "+password"
    );

    if (!existingUser) {
      return res
        .status(401)
        .json({ success: false, message: "User does not exists!" });
    }

    const result = await doHashValidation(oldPassword, existingUser.password);
    if (!result) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials!" });
    }

    const hashedPassword = await hashPassword(newPassword, 12);
    existingUser.password = hashedPassword;

    await existingUser.save();

    return res
      .status(200)
      .json({ success: true, message: "Password updated!!" });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
};

export const sendForgotPasswordCode = async (req, res) => {
  const { email } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res
        .status(404)
        .json({ success: false, message: "User does not exists!" });
    }

    const codeValue = Math.floor(Math.random() * 1000000).toString();
    let info = await transport.sendMail({
      from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
      to: existingUser.email,
      subject: "Forgot password code",
      html: forgotPasswordEmailTemplate(codeValue, existingUser.name),
    });

    if (info.accepted && info.accepted[0] === existingUser.email) {
      const hashedCodeValue = hmacProcess(
        codeValue,
        process.env.HMAC_VERIFICATION_CODE_SECRET
      );
      existingUser.forgotPasswordCode = hashedCodeValue;
      existingUser.forgotPasswordCodeValidation = Date.now();
      await existingUser.save();
      return res
        .status(200)
        .json({ success: true, message: "Forgot password code sent!" });
    }
    res.status(400).json({ success: false, message: "Code sent failed!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

export const verifyForgotPasswordCode = async (req, res) => {
  const { email, providedCode, newPassword } = req.body;
  try {
    const { error, value } = acceptFPCodeSchema.validate({
      email,
      providedCode,
      newPassword,
    });
    if (error) {
      return res
        .status(401)
        .json({ success: false, message: error.details[0].message });
    }

    const codeValue = providedCode.toString();
    const existingUser = await User.findOne({ email }).select(
      "+forgotPasswordCode +forgotPasswordCodeValidation"
    );

    console.log("User found: ", existingUser.email);
    console.log("forgotPasswordCode: ", existingUser.forgotPasswordCode);
    console.log(
      "forgotPasswordCodeValidation: ",
      existingUser.forgotPasswordCodeValidation
    );

    if (!existingUser) {
      return res
        .status(401)
        .json({ success: false, message: "User does not exists!" });
    }

    if (
      !existingUser.forgotPasswordCode ||
      !existingUser.forgotPasswordCodeValidation
    ) {
      return res.status(400).json({
        success: false,
        message: "No forgot password code found. Request a new code first.",
      });
    }

    if (
      Date.now() - existingUser.forgotPasswordCodeValidation >
      5 * 60 * 1000
    ) {
      return res
        .status(400)
        .json({ success: false, message: "code has been expired!" });
    }

    const hashedCodeValue = hmacProcess(
      codeValue,
      process.env.HMAC_VERIFICATION_CODE_SECRET
    );

    if (hashedCodeValue === existingUser.forgotPasswordCode) {
      const hashedPassword = await hashPassword(newPassword, 12);
      existingUser.password = hashedPassword;
      existingUser.forgotPasswordCode = undefined;
      existingUser.forgotPasswordCodeValidation = undefined;
      await existingUser.save();
      return res
        .status(200)
        .json({ success: true, message: "Password updated!!" });
    }
    return res
      .status(400)
      .json({ success: false, message: "unexpected occured!!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};
