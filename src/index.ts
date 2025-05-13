import express from "express";
import dotenv from "dotenv";
import v1Router from "./routes/v1";
import errHandlingMiddleware from "./middlewares/error.middleware";
// import { rateLimit } from "express-rate-limit";
import cors from "cors";
import { startCartReminderCronJob } from "./cronjobs/cart-reminindar.cron";

const WEBAPP_URL = process.env.WEBAPP_URL;
const TEMP_WEBAPP_URL = process.env.TEMP_WEBAPP_URL;
const PROD_WEBAPP_URL = process.env.PROD_WEBAPP_URL;
const TESTING_URL = process.env.TESTING_URL;

// Start the cron job when your app starts
if (process.env.NODE_ENV === "production") {
  startCartReminderCronJob();
}
// const limiter = rateLimit({
//   windowMs: 1 * 60 * 1000, // 1 minute
//   limit: 120,
//   standardHeaders: "draft-7",
//   legacyHeaders: false,

//   handler: (req, res) => {
//     console.log({ req, res, message: "Too many requests, please try again later." });
//     res.status(429).json({ message: "Too many requests, please try again later." });
//   },
// });

dotenv.config();

const PORT = process.env.PORT || 6543;
const app = express();
app.use(express.json());

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://germanguestpost.com",

    ],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    optionsSuccessStatus: 204,
  })
);
app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => {
  res.send("Hello from WhaleServer");
});

app.use("/v1", v1Router);

app.use(errHandlingMiddleware);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});