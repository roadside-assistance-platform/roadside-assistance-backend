import express, { Application } from "express";
import { Request, Response } from "express";
import dotenv from "dotenv";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { PrismaClient } from "@prisma/client";
import session from "express-session";
import logger from "./utilities/logger";
import passport from "./utilities/passport";
import loginProvider from "./routes/provider/login";
import loginClient from "./routes/client/login";

import clientGoogleAuth from "./routes/client/googleAuth";
import providerGoogleAuth from "./routes/provider/googleAuth";
import createClient from "./routes/client/signup";
import createProvider from "./routes/provider/signup";
import home from "./routes/home/home";

dotenv.config();
const app: Application = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;




//swagger

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Documentation",
      version: "1.0.0",
      description: "This is the API documentation",
    },
  },
  apis: ["./routes/**/*.ts"], // Path to the API docs
};

// Generate Swagger documentation
const swaggerSpec = swaggerJsdoc(options);

// Serve Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));



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



//client
app.use("/client/login", loginClient);
app.use("/client/create", createClient);
// Google OAuth for Clients
app.use("/", clientGoogleAuth);

//provider
app.use("/provider/login", loginProvider);
app.use("/provider/create", createProvider);
// Google OAuth for Providers
app.use("/", providerGoogleAuth);

//home
app.use("/home", home);


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
      logger.info(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((e) => {
    logger.error("Error connecting to database: ", e);
    process.exit(1);
  });
