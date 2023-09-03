const express = require("express");
const router = express.Router();
require("dotenv").config();
const bodyParser = require("body-parser");
const crypto = require("crypto");
const { nanoid } = require("nanoid");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const connectionDB = require("./db.js");
const auth = require("./auth.js").auth;
const auth2 = require("./auth.js").auth2;
const sessions = require("./auth.js").sessions;
const deletesession = require("./auth.js").deletesession;
const { logger } = require("./logger.js");

let noteDb;
let userDb;
(async () => {
  await connectionDB.connection();
  noteDb = connectionDB.noteDb();
  userDb = connectionDB.userDb();
})();

router.use(express.json());
router.use(cookieParser());
router.use(express.static("public"));

router.use(passport.initialize());

passport.serializeUser(function (user, done) {
  logger.info("serializeUser(function(user)", user);
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  logger.info("deserializeUser(function(user)", user);
  done(null, user);
});
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:8080/auth/google/callback",
      // callbackURL: "https://notes-342007.lm.r.appspot.com/auth/google/callback"
    },
    function (accessToken, refreshToken, profile, cb) {
      logger.info("new GoogleStrategy: profile", profile, "accessToken", accessToken, "refreshToken", refreshToken);
      return cb(null, profile);
    },
  ),
);

router.get("/auth/google", passport.authenticate("google", { scope: ["profile"] }));

router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    logger.info("/auth/google/callback req.user", req.user);

    let sessionId = sessions(req.user.displayName);
    res.cookie("sessionId", sessionId).redirect("/dashboard");
  },
);

router.get("/", auth2(), (req, res) => {
  res.render("index", {});
});

router.get("/dashboard", auth(), (req, res) => {
  res.render("dashboard", {
    username: req.body.username,
  });
});

router.post("/login", bodyParser.urlencoded({ extended: false }), async (req, res) => {
  const { username, password } = req.body;
  let hash = crypto.createHash("sha256").update(password).digest("hex");
  let user = await userDb.find({ userName: username, password: hash }).toArray();
  if (!user[0]) {
    res.send('<p><a href="/">пароль или имя пользователя неверны, попробуйте еще раз</a></p>');
    return;
  }
  user = user[0];
  logger.info("user", user);
  let sessionId = sessions(username);
  res.cookie("sessionId", sessionId).redirect("/dashboard");
});

router.post("/signup", bodyParser.urlencoded({ extended: false }), async (req, res) => {
  const { username, password } = req.body;
  let user = await userDb.find({ userName: username }).toArray();
  logger.info(`/signup user`, user);
  if (user[0]) {
    logger.info(`/signup пользователь с именем ${username} уже существует ${user}`);
    res.send('<p><a href="/">Пользователь с таким именем уже существует, попробуйте другое имя</a></p>');
    return;
  }
  let hash = crypto.createHash("sha256").update(password).digest("hex");
  let newuser = await userDb.insertOne({ userName: username, password: hash });
  logger.info("newuser", newuser);
  let sessionId = sessions(username);
  let q = await noteDb.insertOne({
    _id: nanoid(),
    username: username,
    created: new Date(),
    title: "Демо-заметка",
    text: "# Привет!  *Это демо-заметка*  **попробуй что-нибудь записать**",
    html: "<h1>Привет!</h1><p><em>Это демо-заметка</em><br/><strong>попробуй что-нибудь записать</strong></p>",
    isArchived: false,
  });
  logger.info("noteDb.insertOne(req.body)", q);
  res.cookie("sessionId", sessionId).redirect("/dashboard");
});

router.get("/logout", auth(), (req, res) => {
  let sessionId = req.cookies["sessionId"];
  deletesession(sessionId);
  res.clearCookie("sessionId").redirect("/");
});

router.get("*", function (req, res) {
  res.status(404).send('ошибка 404: такой страницы не существует <a href="/">Главная страница</a>');
});

module.exports = router;
