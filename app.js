//jshint esversion:6
import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import mongoose, { mongo } from "mongoose";
import encrypt from "mongoose-encryption";
import md5 from "md5";
import { profile } from "console";

const app = express();
const port = 3000; 

// console.log(process.env.API_KEY);

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//mongoDB
mongoose
  .connect("mongodb://localhost:27017/userDB")
  .then(() => console.log("Connected to DB"));

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

//using mongoose-encryption

// using secret string instead if two keys for convenience

// const secret = process.env.SECRET;
// userSchema.plugin(encrypt, { secret: secret , excludeFromEncryption: ["email"]}); 

// for multiples [email , ___]
// before mongoose model


const User = mongoose.model("User", userSchema);


app.get("/", (req, res) => {
  res.render("home");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  const newUser = new User({
    email: req.body.username,
    password: md5(req.body.password),
  });

  newUser
    .save()
    .then(() => {
      res.render("secrets");
    })
    .catch((err) => {
      console.log(err);
    });
});

app.post("/login", (req, res) => {
  const username = req.body.username;
  const password = md5(req.body.password);

  User.findOne({ email: username })
    .then((foundUser) => {
      if (foundUser) {
        console.log("Found User", foundUser.email);
        if (foundUser.password === password) {
          res.render("secrets");
        }
      } else {
        console.log("User not found");
      }
    })
    .catch((error) => {
      console.log(error);
    });
});

app.listen(port, () => {
  console.log(`App Running on port : ${port}`);
});