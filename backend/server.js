import express, { urlencoded } from "express";
import authRoutes from "./routes/authRoutes.js";
import connectDB from "./db/connectDb.js";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

const app = express();
dotenv.config();

const PORT = process.env.PORT;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
  connectDB();
});
