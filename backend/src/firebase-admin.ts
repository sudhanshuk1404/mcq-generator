import * as admin from "firebase-admin";
import * as path from "path";
import * as fs from "fs";

// Load service account from file
const serviceAccountPath = path.join(
  __dirname,
  "../firebase-service-account.json"
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"))
    ),
  });
}

export default admin;
