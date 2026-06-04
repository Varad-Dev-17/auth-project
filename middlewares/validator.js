import joi from "joi";

export const signupSchema = joi.object({
  email: joi
    .string()
    .min(6)
    .max(60)
    .required()
    .email({
      tlds: { allow: ["com", "net"] },
    }),
  password: joi
    .string()
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$"))
    .required(),
});
