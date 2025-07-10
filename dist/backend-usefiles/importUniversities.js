"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const db_1 = require("../../ypropel-backend/db"); // Correct path to your db.ts
async function importUniversities() {
    const filePath = path_1.default.join(process.cwd(), "backend-usefiles", "clean_universities_with_placeholders.json");
    const rawData = fs_1.default.readFileSync(filePath, "utf-8");
    const universities = JSON.parse(rawData);
    console.log(`Importing ${universities.length} universities into database...`);
    for (const uni of universities) {
        try {
            await db_1.pool.query(`INSERT INTO universities (id, title, cover_photo_url, website, description, country, state, city)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (id) DO NOTHING`, [
                uni.id,
                uni.title,
                uni.cover_photo_url,
                uni.website,
                uni.description,
                uni.country,
                uni.state,
                uni.city,
            ]);
        }
        catch (error) {
            console.error(`Failed to insert university ${uni.title}:`, error);
        }
    }
    console.log("Import complete.");
}
importUniversities().catch((err) => {
    console.error("Error during import:", err);
});
