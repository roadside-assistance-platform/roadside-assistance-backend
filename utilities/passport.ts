import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prisma from "../app"; // Import Prisma singleton
import { comparePassword, hashPassword } from "./bcrypt";
import crypto from "crypto";

// Validate environment variables
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("Missing Google OAuth credentials in .env");
}

// Function to generate a random password
const generateRandomPassword = () => crypto.randomBytes(16).toString("hex");

// Local Strategy for Admins
passport.use(
  "admin-local",
  new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
    try {
      const admin = await prisma.admin.findUnique({ where: { email } });
      if (!admin) return done(null, false, { message: "Admin not found" });

      const isPasswordValid = await comparePassword(password, admin.password);
      if (!isPasswordValid) return done(null, false, { message: "Invalid password" });

      return done(null, { ...admin, role: "admin" });
    } catch (error) {
      console.error("Error in admin authentication:", error);
      return done(error);
    }
  })
);

// Local Strategy for Clients
passport.use(
  "client-local",
  new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
    try {
      const client = await prisma.client.findUnique({ where: { email } });
      if (!client) return done(null, false, { message: "Client not found" });

      const isPasswordValid = await comparePassword(password, client.password);
      if (!isPasswordValid) return done(null, false, { message: "Invalid password" });

      return done(null, { ...client, role: "client" });
    } catch (error) {
      console.error("Error in client authentication:", error);
      return done(error);
    }
  })
);

// Local Strategy for Providers
passport.use(
  "provider-local",
  new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
    try {
      const provider = await prisma.provider.findUnique({ where: { email } });
      if (!provider) return done(null, false, { message: "Provider not found" });

      const isPasswordValid = await comparePassword(password, provider.password);
      if (!isPasswordValid) return done(null, false, { message: "Invalid password" });

      return done(null, { ...provider, role: "provider" });
    } catch (error) {
      console.error("Error in provider authentication:", error);
      return done(error);
    }
  })
);

passport.use(
  "google-client",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CLIENT_CALLBACK_URL || "http://localhost:8080/auth/google/client/callback",
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(null, false, { message: "No email found" });

        let user = await prisma.client.findUnique({ where: { email } });

        if (!user) {
          const randomPassword = generateRandomPassword();
          const hashedPassword = await hashPassword(randomPassword);

          user = await prisma.client.create({
            data: {
              email,
              fullName: profile.displayName,
              password: hashedPassword,
            },
          });

          console.log(`New client created with random password: ${randomPassword}`);
        }

        return done(null, { ...user, role: "client" });
      } catch (error) {
        console.error("Error in Google authentication (Client):", error);
        return done(error);
      }
    }
  )
);

passport.use(
  "google-provider",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_PROVIDER_CALLBACK_URL || "http://localhost:8080/auth/google/provider/callback",
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(null, false, { message: "No email found" });

        let user = await prisma.provider.findUnique({ where: { email } });

        if (!user) {
          const randomPassword = generateRandomPassword();
          const hashedPassword = await hashPassword(randomPassword);

          user = await prisma.provider.create({
            data: {
              email,
              fullName: profile.displayName,
              password: hashedPassword,
            },
          });

          console.log(`New provider created with random password: ${randomPassword}`);
        }

        return done(null, { ...user, role: "provider" });
      } catch (error) {
        console.error("Error in Google authentication (Provider):", error);
        return done(error);
      }
    }
  )
);

// Serialize User
passport.serializeUser((user: any, done) => {
  done(null, { id: user.id, role: user.role });
});

// Deserialize User
passport.deserializeUser(async (data: { id: string; role: string }, done) => {
  try {
    let user: any;
    if (data.role === "client") {
      user = await prisma.client.findUnique({ where: { id: data.id } });
    } else if (data.role === "provider") {
      user = await prisma.provider.findUnique({ where: { id: data.id } });
    } else if (data.role === "admin") {
      user = await prisma.admin.findUnique({ where: { id: data.id } });
    }
    // Attach the role to the user object, so middleware checks will work.
    if (user) {
      user.role = data.role;
    }
    done(null, user);
  } catch (error) {
    console.error("Error in deserialization:", error);
    done(error, null);
  }
});


export default passport;
