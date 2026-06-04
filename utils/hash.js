import bcrypt from "bcryptjs";

export const hashPassword = async (password, saltRounds) => {
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
};
