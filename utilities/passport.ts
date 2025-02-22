import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { PrismaClient } from "@prisma/client";
import { comparePassword } from "./bcrypt";

const prisma = new PrismaClient();

// Client Authentication Strategy
passport.use(
  "client-local",
  new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
    try {
      const client = await prisma.client.findUnique({ where: { email } });
      if (!client) {
        return done(null, false, { message: "Client not found" });
      }
      const isPasswordValid = await comparePassword(password, client.password);
      if (!isPasswordValid) {
        return done(null, false, { message: "Invalid password" });
      }
      return done(null, { ...client, role: "client" });
    } catch (error) {
      return done(error);
    }
  })
);

// Provider Authentication Strategy
passport.use(
  "provider-local",
  new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
    try {
      const provider = await prisma.provider.findUnique({ where: { email } });
      if (!provider) {
        return done(null, false, { message: "Provider not found" });
      }
      const isPasswordValid = await comparePassword(password, provider.password);
      if (!isPasswordValid) {
        return done(null, false, { message: "Invalid password" });
      }
      return done(null, { ...provider, role: "provider" });
    } catch (error) {
      return done(error);
    }
  })
);

// Serialize User
passport.serializeUser((user: any, done) => {
  done(null, { id: user.id, role: user.role });
});

// Deserialize User
passport.deserializeUser(async (data: { id: string; role: string }, done) => {
  try {
    const user =
      data.role === "client"
        ? await prisma.client.findUnique({ where: { id: data.id } })
        : await prisma.provider.findUnique({ where: { id: data.id } });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
