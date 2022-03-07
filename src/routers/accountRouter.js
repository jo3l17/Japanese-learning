const express = require("express");
const { MongoClient } = require("mongodb");
const passport = require("passport");
require("../config/passport.js")(passport);
const accountRouter = express.Router();

const calendar = [false, false, false, false, false, false, false];

accountRouter.route('/').get((req, res) => {
    if (!req.user){
        res.render('account', {
          errorMessage:''
        });
    } else {
        res.render('profile', {
          username: req.user.username,
          userID: req.user._id
        });
    }
    
});

accountRouter.route("/signUp").post(async (req, res) => {
  const { email, username, password } = req.body;
  const url = process.env.databaseURL;
  const dbName = "userInfo";
  const password_pattern =
    /(?=^.{8,}$)(?=.*\d)(?=.*\W+)(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/;
  const email_pattern = /[^@ \t\r\n]+@[^@ \t\r\n]+\.[^@ \t\r\n]+/;

  let client;
  if (!email.match(email_pattern)) {
    return res.render("account", {
      errorMessage: "Invalid email address",
    });
  }
  if (!password.match(password_pattern)) {
    return res.render("account", {
      errorMessage:
        "Password should be at least 8 characters long, should contain at least 1 upper case letter one number, letter and one special character",
    });
  }
  try {
    client = await MongoClient.connect(url);
    const db = client.db(dbName);
    const user = { email, username, password, calendar };
    const existUser = await db
      .collection("userInfo")
      .find({ username })
      .count();
    if (existUser === 0) {
      const results = await db.collection("userInfo").insertOne(user);
      return req.login(results.ops[0], () => {
        return res.redirect("../account");
      });
    }
    return res.render("account", {
      errorMessage: "User already exists",
    });
  } catch (error) {
    console.log(error);
  }
});

accountRouter
  .route("/signIn")
  .get((req, res) => {
    res.render(req.user);
  })
  .post(
    passport.authenticate("local", {
      successRedirect: "../account",
      failureRedirect: "../",
    })
  );

accountRouter.route("/signOut").get((req, res) => {
  req.logOut();
  res.redirect("/");
});

require("../config/strategies/google.strategy");

accountRouter.route("/google").get(
  (req, res, next) => {
    if (req.user) {
      return res.redirect("/account");
    }
    next();
  },
  passport.authenticate("google", {
    scope: ["email", "profile"],
  })
);

accountRouter.route("/google/callback").get(
  passport.authenticate("google", {
    successRedirect: "/account",
    failureRedirect: "/",
  })
);

// accountRouter.get(
//   "/google",
//   (req, res, next) => {
//     if(req.user){
//       return res.redirect('/account');
//     }
//     next();
//   },
//   passport.authenticate("google", { scope: ["email", "profile"] })
// );

// accountRouter.get(
//   "/google/callback",
//   passport.authenticate("google", {
//     failureRedirect: "../",
//     successRedirect: "/account",
//   })
// );

module.exports = accountRouter;
