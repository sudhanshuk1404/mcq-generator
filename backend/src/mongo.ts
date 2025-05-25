// src/mongo.ts
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGO_URI!;
const client = new MongoClient(uri);

export const db = client.db("annai");
export const videosCollection = db.collection("videos");
export const mcqsCollection = db.collection("mcqs");

export async function connectToMongo() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}
