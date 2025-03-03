import express, { Application } from "express";
import { Request, Response } from "express";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import session from "express-session";
import passport from "./utilities/passport";
import loginProvider from "./routes/provider/login";
import loginClient from "./routes/client/login";
import createUser from "./routes/create";
import home from "./routes/home/home";

dotenv.config();

const app: Application = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(
//   session({
//     secret: process.env.SESSION_SECRET || "default_secret",
//     resave: false,
//     saveUninitialized: true,
//     cookie: { maxAge: 86400000 }, // 1 day
//   })
// );
app.use(session({
  secret: process.env.SESSION_SECRET || "your_secret",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to `true` in production with HTTPS
}));
app.use(passport.initialize());
app.use(passport.session());

// Routes
// app.use("/create", require("./routes/create"));
// app.use("/login", require("./routes/client/login"));
// app.use("/login", require("./routes/provider/login"));

app.use("/create", createUser);
app.use("/client/login", loginClient);
app.use("/provider/login", loginProvider);
app.use("/home", home);


app.get("/logout", (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).send("Error logging out");
    }
    res.redirect("/login");
  });
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google OAuth callback route
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/auth/google/failure" }),
  (req, res) => {
    res.json({ message: "Google authentication successful", user: req.user });
  }
);

// Failure route
app.get("/auth/google/failure", (req, res) => {
  res.status(401).json({ message: "Google authentication failed" });
});



export default prisma;

// Start the server
prisma.$connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((e) => {
    console.error("Error connecting to database: ", e);
    process.exit(1);
  });
