import type { Express, RequestHandler } from "express";
import { storage } from "./storage";

/**
 * Local dev auth that pretends a user is logged in.
 * It creates/uses a demo user and injects req.user.claims.sub like Replit auth,
 * so the rest of the app works unchanged.
 */
const DEMO_USER_ID = "Akash S.M";

export async function setupAuth(app: Express) {
  // Ensure demo user exists
  await storage.upsertUser({
    id: DEMO_USER_ID,
    email: "mrimpossible@gmail.com",
    firstName: "Akash",
    lastName: "S.M",
    profileImageUrl: "",
  });
}

export const isAuthenticated: RequestHandler = async (req, _res, next) => {
  // mimic the structure used by replitAuth
  (req as any).user = { claims: { sub: DEMO_USER_ID } };
  (req as any).isAuthenticated = () => true;
  next();
};
