const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const compression = require("compression");
const cors = require("cors");
const helmet = require("helmet");
const RateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const passport = require("passport");
const cookieSession = require("cookie-session");
require("./auth/auth");

// get config vars
dotenv.config();

const indexRouter = require("./routes/index");
const odinBookRouter = require("./routes/odin-book");

const app = express();

// Set up rate limiter: max of 1000 reqs per min
const limiter = RateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000,
});

const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
const mongoDB = process.env.MONGODB_URI;
main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect(mongoDB);
}

app.use(limiter);
app.use(helmet());
app.use(compression()); //compress all routes
app.use(logger("dev"));
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: false, limit: "100mb" }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.set("trust proxy", 1); // trust first proxy
app.use(
  cookieSession({
    name: "session",
    keys: [process.env.SESSION_SECRET],
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    httpOnly: true,
  })
);

// Register regenerate & save after the cookieSession middleware initialization
app.use(function (req, res, next) {
  if (req.session && !req.session.regenerate) {
    req.session.regenerate = (cb) => {
      cb();
    };
  }
  if (req.session && !req.session.save) {
    req.session.save = (cb) => {
      cb();
    };
  }
  next();
});

app.use(passport.initialize());
app.use(passport.session());

const corsOptions = {
  origin: "https://melanie-j-baker.github.io",
  optionsSuccessStatus: 200,
  credentials: true,
};
app.use(cors(corsOptions));
// enable CORS pre-flight
app.options("*", cors());

app.use("/", indexRouter);
app.use("/odin-book", odinBookRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json({ message: err.message, error: err });
});

module.exports = app;
