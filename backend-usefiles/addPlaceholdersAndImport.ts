import fs from "fs";
import path from "path";

const placeholderUrl = "https://via.placeholder.com/400x200?text=University+Image";

const filePath = path.join(process.cwd(), "backend-usefiles", "clean_universities.json");
const rawData = fs.readFileSync(filePath, "utf-8");
const universities = JSON.parse(rawData);

const updatedUniversities = universities.map((uni: any) => ({
  ...uni,
  cover_photo_url: placeholderUrl,
}));

const updatedFilePath = path.join(process.cwd(), "backend-usefiles", "clean_universities_with_placeholders.json");
fs.writeFileSync(updatedFilePath, JSON.stringify(updatedUniversities, null, 2));

console.log(`Updated universities saved with placeholders at ${updatedFilePath}`);
