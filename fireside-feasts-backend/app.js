const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
const app = express();

const PORT = process.env.SERVER_PORT || 3001;
console.log(process.env.SERVER_PORT);

const cors = require("cors");

//middleware for handling browser settings
app.use(express.json());
app.use(cors());

//database conn
const db = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@recipecluster0.lh6shvp.mongodb.net/RecipeWebApp?retryWrites=true&w=majority&appName=recipecluster0`;

// const db = "mongodb://localhost:27017/RecipeWebApp";
const User = require("./models/user.model");

mongoose.connect(db);

//basic routes
app.post("/api/register", async (req, res) => {
  console.log(req.body);
  try {
    const newPassword = await bcrypt.hash(req.body.password, 10);
    await User.create({
      name: req.body.username,
      email: req.body.email,
      phone: req.body.phone,
      password: newPassword,
    });
    res.json({ status: "ok" });
  } catch (err) {
    res.json({ status: "error", error: err.message });
  }
});
app.post("/api/login", async (req, res) => {
  try {
    const user = await User.findOne({
      email: req.body.email,
    });

    const isPasswordValid = await bcrypt.compare(
      req.body.password,
      user.password
    );

    if (isPasswordValid) {
      const token = jwt.sign(
        {
          name: user.name,
          email: user.email,
        },
        process.env.JWT_SECRET
      );
      return res.json({ status: "ok", user: token });
    } else res.json({ status: "error", error: "User not found" });
  } catch (error) {
    res.json({ status: "error", error: error.message });
  }
});

app.listen(PORT, () => {
  console.log("server is running on port " + PORT);
});

const verifyJWT = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) return res.sendStatus(401).json({ error: "Unauthorized" });

  const token = auth.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    //checking the email decoded
    req.user = decoded;
  } catch (err) {
    console.log(err);
    res.json({ status: "error", error: "invalid token" });
  }
};

app.use("/protected-route", verifyJWT);

//protecting routes by using verifyJWT
app.get("/home", verifyJWT);
app.get("/recipe/:recipeName", verifyJWT);
app.get("/search/:recipeQuery", verifyJWT);
