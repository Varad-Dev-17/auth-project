import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import authRouter from "./routers/authRouter.js";

// express
const app = express();
app.use(express.json());

// cors
app.use(cors());

// helmet
app.use(helmet());

// cookie parser
app.use(cookieParser());

// urlencoder
app.use(express.urlencoded({ extended: true }));

// mongose connect
// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => console.log("MongoDB connected"))
//   .catch((err) => console.log(err));

// mongodb connect with async await
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

await connectDB();

// routers
app.use("/api/auth", authRouter);

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Backend Server" });
});

const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Backend Server is running on port ${port}`);
});
