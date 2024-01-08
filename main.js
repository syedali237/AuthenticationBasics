//jshint esversion:6
import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import mongoose, { mongo } from "mongoose";
import session from "express-session";
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose";
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import findOrCreate from "mongoose-findorcreate";

const app = express();
const port = 3000; 

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({
    secret : "Our little Secret.",
    resave : false,
    saveUninitialized : false
}));

app.use(passport.initialize());
app.use(passport.session());

//mongoDB
mongoose
  .connect("mongodb://localhost:27017/userDB")
  .then(() => console.log("Connected to DB"));

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId : String,
  secret : String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id)
      .then(user => {
        // If user is found, pass it to done
        done(null, user);
      })
      .catch(err => {
        // If an error occurs, pass it to done
        done(err, null);
      });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", (req, res) => {
  res.render("home");
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get("/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // succes , redirect to secretss
    res.redirect("/secrets");
  }
);

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/secrets" , (req,res)=>{
    User.find({"secret" : {$ne: null}})
    .then((foundUser)=>{
        res.render("secrets" , {usersWithSecrets : foundUser} )
    })
    .catch((err)=>{
        console.log(err);
    })
})

app.get("/secrets" , (req,res) => {
    if (req.isAuthenticated()){
        res.render("secrets")
    } else {
        res.redirect("/login");
    }
})

app.post("/register", (req, res) => {
  User.register(
    { username: req.body.username },
    req.body.password,
    (err, user) => {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/secrets");
        });
      }
    }
  );
});

app.post("/login", (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });

  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      console.log(user.username);
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    }
  });
});

app.get("/submit" , (req,res)=>{
    if (req.isAuthenticated()){
        res.render("submit")
    } else {
        res.redirect("/login");
    }
})

app.post("/submit" , (req,res)=>{
    const submittedSecret = req.body.secret;
    console.log(req.user.id);

    User.findById(req.user.id)
    .then((foundUser)=>{
        foundUser.secret = submittedSecret;
        foundUser.save();
        res.redirect("/secrets");
    })
    .catch((err)=>{
        console.log(err);
    })

})

app.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
}); 

app.listen(port, () => {
  console.log(`App Running on port : ${port}`);
});