import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import cors from "cors";

import ProductRouter from "./routers/ProductRouter.js";
import UserRouter from "./routers/UserRouter.js";
import OrderRouter from "./routers/OrderRouter.js";
import UploadRouter from "./routers/UploadRouter.js";

dotenv.config();

const app = express();
// sending undefined properties solution
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://ebeauty.vercel.app",
      "https://ebeauty-git-master-kzweber.vercel.app",
      "https://ebeauty-8tczm72qx-kzweber.vercel.app",
    ],
    credentials: true,
  })
);

const PORT = process.env.PORT || 5000;
mongoose.connect(
  process.env.MONGODB_URL || "mongodb://localhost/everydaybeautylab",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  }
);

app.get("/", (req, res) => {
  res.send("The server has been ready.");
});
app.get("/api/config/google", (req, res) => {
  res.send(process.env.GOOGLE_API_KEY || "");
});

app.use("/api/users", UserRouter);
app.use("/api/products", ProductRouter);
app.use("/api/orders", OrderRouter);
app.use("/api/config/paypal", (req, res) => {
  res.send(process.env.PAYPAL_CLIENT_ID || "sandbox");
});
app.use("/api/uploads", UploadRouter);

// set uploading
const __dirname = path.resolve();
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));

// error catcher
app.use((error, req, res, next) => {
  res.status(500).send({ message: error.message });
});

app.listen(PORT, () => {
  console.log(`The server is listening at port ${PORT}`);
});
