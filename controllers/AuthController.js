import { signupSchema } from "../middlewares/validator.js";
import User from "../models/userModels.js";
import { hashPassword } from "../utils/hash.js";

export const signUp = async (req, res) => {
  const { email, password } = req.body;

  try {
    const { error } = signupSchema.validate({ email, password });
    if (error) {
      return res
        .status(400) // Bad Request status code for validation errors
        .json({ success: false, message: error.details[0].message });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409) // Conflict status code for existing resource
        .json({ success: false, message: "User already exists." });
    }

    const hashedPassword = await hashPassword(password, 12);
    const newUser = new User({ email, password: hashedPassword });
    const result = await newUser.save();

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
