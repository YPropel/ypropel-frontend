import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import { pool } from "../../ypropel-backend/db"; // Correct path to your db.ts

type University = {
  id: string;
  title: string;
  cover_photo_url: string;
  website: string;
  description: string;
  country: string;
  state: string;
  city: string;
};

async function importUniversities() {
  const filePath = path.join(process.cwd(), "backend-usefiles", "clean_universities_with_placeholders.json");
  const rawData = fs.readFileSync(filePath, "utf-8");
  const universities: University[] = JSON.parse(rawData);

  console.log(`Importing ${universities.length} universities into database...`);

  for (const uni of universities) {
    try {
      await pool.query(
        `INSERT INTO universities (id, title, cover_photo_url, website, description, country, state, city)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (id) DO NOTHING`,
        [
          uni.id,
          uni.title,
          uni.cover_photo_url,
          uni.website,
          uni.description,
          uni.country,
          uni.state,
          uni.city,
        ]
      );
    } catch (error) {
      console.error(`Failed to insert university ${uni.title}:`, error);
    }
  }

  console.log("Import complete.");
}

importUniversities().catch((err) => {
  console.error("Error during import:", err);
});
