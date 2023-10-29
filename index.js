const express = require("express");

const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const session = require("express-session");
const sessionStorage = require("express-session/session/memory");
const flash = require("connect-flash");

const authRoutes = require("./routes/authRoutes");
const routes = require("./routes/routes");

const app = express();
const PORT = process.env.PORT || 3000;

require("dotenv").config();

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));

app.use("/itemDetail", express.static("public"));

app.use("/searchCat", express.static("public"));

app.use("/admin", express.static("public"));

app.use("/editForm", express.static("public"));

app.use("/messageBody", express.static("public"));

app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    store: new sessionStorage(), // set the store option to sessionStorage
    cookie: {
      maxAge: 1000 * 24 * 60 * 60,
    },
  })
);

app.set("view engine", "ejs");

app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

//connect to mongodb database
mongoose
  .connect(process.env.mongodb_url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("connected to database");
  })
  .catch((err) => {
    console.log(err);
  });

app.use("/", routes);
app.use("/", authRoutes);

app.listen(PORT, () => console.log(`server is running on port ${PORT}`));
