"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const https_1 = __importDefault(require("https"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DATA_URL = "https://raw.githubusercontent.com/Hipo/university-domains-list/master/world_universities_and_domains.json";
function fetchData(url) {
    return new Promise((resolve, reject) => {
        https_1.default
            .get(url, (res) => {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => resolve(data));
        })
            .on("error", (err) => reject(err));
    });
}
async function main() {
    try {
        console.log("Fetching raw data...");
        const rawData = await fetchData(DATA_URL);
        const rawUniversities = JSON.parse(rawData);
        console.log(`Total universities fetched: ${rawUniversities.length}`);
        const cleanUniversities = rawUniversities.map((uni, index) => ({
            id: `uni${index + 1}`,
            title: uni.name,
            cover_photo_url: "",
            website: uni.web_pages[0] || "",
            description: "",
            country: uni.country,
            state: "",
            city: "",
        }));
        // Save cleaned data inside backend-usefiles folder
        const outPath = path_1.default.join(process.cwd(), "backend-usefiles", "clean_universities.json");
        fs_1.default.writeFileSync(outPath, JSON.stringify(cleanUniversities, null, 2), "utf-8");
        console.log(`Cleaned data saved to ${outPath}`);
    }
    catch (error) {
        console.error("Error:", error);
    }
}
main();
