import express, { Application, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { PrismaClient } from "@prisma/client";
import session from "express-session";
import logger from "./utilities/logger";
import passport from "./utilities/passport";
import loginProvider from "./routes/provider/login";
import loginClient from "./routes/client/login";
import verifyEmail from "./routes/verifyEmail";
import clientGoogleAuth from "./routes/client/googleAuth";
import providerGoogleAuth from "./routes/provider/googleAuth";
import createClient from "./routes/client/signup";
import createProvider from "./routes/provider/signup";
import createService from "./routes/service/create";
import updateService from "./routes/service/update";
import updateClient from "./routes/client/update"
import updateProvider from "./routes/provider/update"
import home from "./routes/home/home";
import verifygoogleToken from "./routes/google";
import { isAuthenticated,isClient,isProvider } from "./middleware/auth";
import { NotFoundError } from './errors/notFound.error';
import clients from "./routes/client/clients";
import providers from "./routes/provider/providers";
import serviceInfo from "./routes/service/info";
import clientInfo from "./routes/client/info";
import providerInfo from "./routes/provider/info";
import cors from "cors";
import adminLogin from "./routes/admin/login";
import adminLogs from "./routes/admin/logs";
import adminRatings from "./routes/admin/ratings";





dotenv.config();
const app: Application = express();
export const prisma = new PrismaClient();
const PORT = process.env.PORT || 5555;




//swagger

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Roadside Assistance API Documentation",
      version: "1.0.0",
      description: "API documentation for the Roadside Assistance platform",
      contact: {
        name: "API Support",
        email: "support@roadsideassistance.com"
      }
    },
    servers: [
      {
        url: "http://localhost:" + PORT,
        description: "Development server"
      }
    ],
    components: {
      schemas: {
        Provider: {
          type: "object",
          required: ["id", "email", "fullName", "phone"],
          properties: {
            deleted: { type: "boolean", description: "Soft delete flag" },
            id: {
              type: "string",
              format: "uuid",
              description: "Provider's unique identifier"
            },
            email: {
              type: "string",
              format: "email",
              description: "Provider's email address"
            },
            fullName: {
              type: "string",
              description: "Provider's full name"
            },
            phone: {
              type: "string",
              description: "Provider's phone number"
            },
            photo: {
              type: "string",
              format: "uri",
              description: "URL to provider's photo"
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Account creation timestamp"
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Last update timestamp"
            }
          }
        },
        Client: {
          type: "object",
          required: ["id", "email", "fullName"],
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "Client's unique identifier"
            },
            email: {
              type: "string",
              format: "email",
              description: "Client's email address"
            },
            fullName: {
              type: "string",
              description: "Client's full name"
            },
            photo: {
              type: "string",
              format: "uri",
              description: "URL to client's photo"
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Account creation timestamp"
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Last update timestamp"
            }
          }
        },
        Service: {
          type: "object",
          required: ["id", "clientId", "status", "location"],
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "Service request unique identifier"
            },
            clientId: {
              type: "string",
              format: "uuid",
              description: "ID of the client requesting service"
            },
            providerId: {
              type: "string",
              format: "uuid",
              description: "ID of the assigned provider (if any)"
            },
            status: {
              type: "string",
              enum: ["PENDING", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
              description: "Current status of the service request"
            },
            location: {
              type: "object",
              properties: {
                latitude: {
                  type: "number",
                  format: "float"
                },
                longitude: {
                  type: "number",
                  format: "float"
                },
                address: {
                  type: "string"
                }
              }
            },
            description: {
              type: "string",
              description: "Description of the service needed"
            },
            createdAt: {
              type: "string",
              format: "date-time"
            },
            updatedAt: {
              type: "string",
              format: "date-time"
            }
          }
        },
        Error: {
          type: "object",
          properties: {
            status: {
              type: "string",
              example: "error"
            },
            message: {
              type: "string"
            },
            errors: {
              type: "array",
              items: {
                type: "string"
              }
            },
            code: {
              type: "string"
            }
          }
        }
      },
      // securitySchemes: {
      //   sessionAuth: {
      //     type: "apiKey",
      //     in: "cookie",
      //     name: "connect.sid",
      //     description: "Session-based authentication using cookies"
      //   },
      //   bearerAuth: {
      //     type: "http",
      //     scheme: "bearer",
      //     bearerFormat: "JWT",
      //     description: "JWT token-based authentication"
      //   }
      // }
    },
    security: [
      { sessionAuth: [] },
      { bearerAuth: [] }
    ],
    tags: [
      { name: "Client", description: "Client account management and operations" },
      { name: "Provider", description: "Service provider account management and operations" },
      { name: "Service", description: "Service request creation and management" },
      { name: "Authentication", description: "Authentication and authorization operations" }
    ]
  },
  apis: ["./routes/**/*.ts"]
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

//cors
//change the url
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// Routes

app.use("/google/verify", verifygoogleToken);


//client
app.use("/client/login", loginClient);
app.use("/client/signup", createClient);
app.use("/client/update",isAuthenticated,updateClient)
app.use("/client/clients", clients);
app.use("/client/delete", require("./routes/client/delete").default);
app.use("/client/info",isAuthenticated,clientInfo)
app.use("/client/reset-password", require("./routes/client/resetPassword").default);
// Google OAuth for Clients
app.use("/", clientGoogleAuth);

//provider
app.use("/provider/login", loginProvider);
app.use("/provider/signup", createProvider);
app.use("/provider/update",isAuthenticated,updateProvider)
app.use("/provider/providers", providers);
app.use("/provider", require("./routes/provider/delete").default);
app.use("/provider/info",isAuthenticated,providerInfo)
app.use("/provider/reset-password", require("./routes/provider/resetPassword").default);
// Google OAuth for Providers
app.use("/", providerGoogleAuth);

//service
app.use("/service/create", isClient, createService);
app.use("/service/update", isAuthenticated, updateService);
app.use("/service/info",isAuthenticated,serviceInfo)

//home
app.use("/home",isAuthenticated, home);

//verifyEmail
app.use("/email", verifyEmail)

// ADMIN ROUTES (all mounted at "/")
import adminProviders from "./routes/admin/providers";
app.use("/admin/providers", adminProviders);
app.use("/admin/logs", adminLogs); // GET /logs
app.use("/admin/ratings", adminRatings); // GET/DELETE /ratings
app.use("/admin/login", adminLogin); // POST /login

// 404 handler for undefined routes
app.all('*', (req: Request, res: Response, next: NextFunction) => {
  next(new NotFoundError(`Can't find ${req.originalUrl} on this server!`));
});

// Global error handler
import { globalErrorHandler } from './middleware/errorHandler';
app.use(globalErrorHandler);

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
