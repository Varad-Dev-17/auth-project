import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import authRouter from "./routers/authRouter.js";

const app = express();

// Middleware
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

// Cookie parser
app.use(cookieParser());

// Routes
app.use("/api/auth", authRouter);

const PORT = process.env.PORT || 8000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Backend Server is running on port ${PORT}`);
  });
};

startServer();
