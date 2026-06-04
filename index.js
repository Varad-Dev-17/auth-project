import express from "express";
import connectDB from "./config/db.js";
import authRouter from "./routers/authRouter.js";

const app = express();

app.use(express.json());
app.use("/api/auth", authRouter);

const PORT = process.env.PORT || 8000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Backend Server is running on port ${PORT}`);
  });
};

startServer();
