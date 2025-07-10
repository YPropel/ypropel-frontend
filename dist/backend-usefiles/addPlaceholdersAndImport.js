"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const placeholderUrl = "https://via.placeholder.com/400x200?text=University+Image";
const filePath = path_1.default.join(process.cwd(), "backend-usefiles", "clean_universities.json");
const rawData = fs_1.default.readFileSync(filePath, "utf-8");
const universities = JSON.parse(rawData);
const updatedUniversities = universities.map((uni) => ({
    ...uni,
    cover_photo_url: placeholderUrl,
}));
const updatedFilePath = path_1.default.join(process.cwd(), "backend-usefiles", "clean_universities_with_placeholders.json");
fs_1.default.writeFileSync(updatedFilePath, JSON.stringify(updatedUniversities, null, 2));
console.log(`Updated universities saved with placeholders at ${updatedFilePath}`);
