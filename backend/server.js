import express from "express";
import authRoutes from "./routes/authRoutes.js";
import connectDB from "./db/connectDb.js";
import dotenv from "dotenv";

const app = express();
dotenv.config();

const PORT = process.env.PORT;

app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
  connectDB();
});
