import { Request, Response, NextFunction } from "express";
import admin from "./firebase-admin";

export function verifyFirebaseToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  if (!token) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  admin
    .auth()
    .verifyIdToken(token)
    .then((decodedToken) => {
      // ✅ Attach to req.user
      (req as any).user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
      };
      next();
    })
    .catch((err) => {
      console.error("❌ Invalid Firebase token:", err);
      res.status(403).json({ error: "Invalid token" });
    });
}
