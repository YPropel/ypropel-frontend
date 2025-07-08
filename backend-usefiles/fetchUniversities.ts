import https from "https";
import fs from "fs";
import path from "path";

const DATA_URL =
  "https://raw.githubusercontent.com/Hipo/university-domains-list/master/world_universities_and_domains.json";

type RawUniversity = {
  name: string;
  country: string;
  web_pages: string[];
};

type CleanUniversity = {
  id: string;
  title: string;
  cover_photo_url: string;
  website: string;
  description: string;
  country: string;
  state: string;
  city: string;
};

function fetchData(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https
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
    const rawUniversities: RawUniversity[] = JSON.parse(rawData);

    console.log(`Total universities fetched: ${rawUniversities.length}`);

    const cleanUniversities: CleanUniversity[] = rawUniversities.map((uni, index) => ({
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
    const outPath = path.join(process.cwd(), "backend-usefiles", "clean_universities.json");
    fs.writeFileSync(outPath, JSON.stringify(cleanUniversities, null, 2), "utf-8");
    console.log(`Cleaned data saved to ${outPath}`);
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
