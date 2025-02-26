import express, { Application } from "express";
import { Request, Response } from "express";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import session from "express-session";
import passport from "./utilities/passport";
import { hashPassword } from "./utilities/bcrypt";

dotenv.config();

const app: Application = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default_secret",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 86400000 }, // 1 day
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.post("/create", async (req:any, res:any) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: "Email, password, and role are required" });
  }

  try {
    const existingUser =
      role === "client"
        ? await prisma.client.findUnique({ where: { email } })
        : await prisma.provider.findUnique({ where: { email } });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await hashPassword(password);

    const newUser =
      role === "client"
        ? await prisma.client.create({ data: { email, password: hashedPassword } })
        : await prisma.provider.create({ data: { email, password: hashedPassword } });

    res.status(201).json(newUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while creating the user" });
  }
});

app.post(
  "/login/client",
  passport.authenticate("client-local", {
    successRedirect: "/home",
    failureRedirect: "/login",
  })
);

app.post(
  "/login/provider",
  passport.authenticate("provider-local", {
    successRedirect: "/home",
    failureRedirect: "/login",
  })
);

app.get("/home", (req: Request, res: Response) => {
  if (req.isAuthenticated()) {
    res.send("Success! You are logged in.");
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).send("Error logging out");
    }
    res.redirect("/login");
  });
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
