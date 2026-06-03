import mongoose from "mongoose";

const userSchema = mongoose.schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      minLength: [5, "Email must be at least 5 characters"],
      lowercase: true,
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      trim: true,
      minLength: [6, "Password must be at least 6 characters"],
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verificationCode: {
      type: String,
      select: false,
    },
    verificationCodeValidation: {
      type: Date,
      select: false,
    },
    fogotPasswordCode: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
