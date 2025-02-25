import express from "express";
import dotenv from "dotenv";
import session from "express-session";
import { PrismaClient } from "@prisma/client";
import passport from "./utilities/passport";
import { hashPassword } from "./utilities/bcrypt";

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.CLIENT_PORT || 3001;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default_secret",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 86400000 },
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.post("/create", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send("Email and password are required");
  }

  try {
    const existingUser = await prisma.client.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).send("User already exists");
    }

    const hashedPassword = await hashPassword(password);
    const newUser = await prisma.client.create({ data: { email, password: hashedPassword } });
    res.status(201).json(newUser);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while creating the user");
  }
});

app.post("/login", passport.authenticate("client-local", {
  successRedirect: "/home",
  failureRedirect: "/login",
}));

app.get("/home", (req, res) => {
  if (req.isAuthenticated()) {
    res.send("Client logged in successfully.");
  } else {
    res.redirect("/login");
  }
});

// Start the client server
app.listen(PORT, () => {
  console.log(`Client server running on http://localhost:${PORT}`);
});
