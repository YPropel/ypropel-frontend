import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import axios from "axios";
import { query } from "../db";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

interface AuthRequest extends Request {
  user?: { userId: number; email?: string; isAdmin?: boolean };
}

// Async wrapper to catch errors
function asyncHandler(
  fn: (req: AuthRequest, res: Response, next: NextFunction) => Promise<any>
) {
  return function (req: AuthRequest, res: Response, next: NextFunction) {
    fn(req, res, next).catch(next);
  };
}

// Authentication middleware
function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Unauthorized: No token provided" });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      res.status(403).json({ error: "Forbidden: Invalid token" });
      return;
    }

    const payload = user as { userId: number; email?: string; is_admin?: boolean };

    req.user = {
      userId: payload.userId,
      email: payload.email,
      isAdmin: payload.is_admin || false,
    };

    next();
  });
}

// Admin-only middleware
function adminOnly(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user?.isAdmin) {
    res.status(403).json({ error: "Access denied. Admins only." });
    return;
  }
  next();
}

// Protect all routes below this middleware with authentication
router.use(authenticateToken);

// ----------------- ADZUNA IMPORT -------------------
router.post(
  "/import-entry-jobs",
  adminOnly,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID!;
    const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY!;
    const ADZUNA_COUNTRY = "us";

    const {
      keyword = "",
      location = "United States",
      pages = 3,
      job_type = "entry_level",
    } = req.body;

    const excludeKeywords = [
      "cook",
      "customer support",
      "technician",
      "cashier",
      "driver",
      "security",
      "hourly",
      "shift supervisor",
      "supervisor",
      "janitor",
    ];

    function isValidJobTitle(title: string): boolean {
      const lowerTitle = title.toLowerCase();
      return !excludeKeywords.some((kw) => lowerTitle.includes(kw));
    }

    let insertedCount = 0;

    for (let page = 1; page <= pages; page++) {
      console.log(`Fetching Adzuna page ${page}...`);

      const adzunaUrl = `https://api.adzuna.com/v1/api/jobs/${ADZUNA_COUNTRY}/search/${page}?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=50&max_days_old=30&content-type=application/json${keyword ? `&what=${encodeURIComponent(keyword)}` : ""}${location ? `&where=${encodeURIComponent(location)}` : ""}`;

      const response = await axios.get(adzunaUrl);
      const jobs = response.data.results;
      console.log(`Fetched ${jobs.length} jobs from Adzuna.`);

      for (const job of jobs) {
        if (!job.title || !isValidJobTitle(job.title)) {
          console.log(`Skipped job due to excluded title: ${job.title}`);
          continue;
        }

        const existing = await query(
          "SELECT id FROM jobs WHERE title = $1 AND company = $2 AND location = $3",
          [job.title, job.company?.display_name || null, job.location?.display_name || null]
        );

        if (existing.rows.length > 0) {
          console.log(`Job already exists: ${job.title} at ${job.company?.display_name}`);
          continue;
        }

        const loc = job.location || {};
        const city = loc.area ? loc.area[1] || null : null;
        const state = loc.area ? loc.area[2] || null : null;
        const country = loc.area ? loc.area[0] || null : null;

        try {
          await query(
            `INSERT INTO jobs (
              title, description, category, company, location, requirements,
              apply_url, posted_at, is_active, job_type, country, state, city
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
            [
              job.title,
              job.description,
              job.category?.label || null,
              job.company?.display_name || null,
              job.location?.display_name || null,
              null,
              job.redirect_url,
              job.created,
              true,
              job_type,
              country,
              state,
              city,
            ]
          );
          insertedCount++;
          console.log(`Inserted job: ${job.title}`);
        } catch (error) {
          console.error(`Error inserting job ${job.title}:`, error);
        }
      }
    }

    console.log(`Adzuna import completed. Total inserted jobs: ${insertedCount}`);

    res.json({ success: true, inserted: insertedCount });
  })
);

// ----------------- CAREERJET IMPORT -------------------
router.post(
  "/import-careerjet-jobs",
  adminOnly,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const CAREERJET_AFFID = process.env.CAREERJET_AFFID!;
    const { keyword = "", location = "United States", pages = 3, job_type = "entry_level" } = req.body;

    let insertedCount = 0;

    for (let page = 1; page <= pages; page++) {
      console.log(`Fetching Careerjet page ${page}...`);

      const careerjetUrl = `http://public.api.careerjet.net/search?affid=${CAREERJET_AFFID}&keywords=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}&pagesize=50&pagenumber=${page}&sort=relevance`;

      try {
        const response = await axios.get(careerjetUrl, {
          headers: {
            "User-Agent": "ypropel-backend/1.0",
          },
        });

        const data = response.data;

        if (data.type === "ERROR") {
          console.error("Careerjet API error:", data.error);
          return res.status(500).json({ error: "Careerjet API error: " + data.error });
        }

        if (data.type === "JOBS" && data.jobs && Array.isArray(data.jobs)) {
          console.log(`Fetched ${data.jobs.length} jobs from Careerjet.`);

          for (const job of data.jobs) {
            if (!job.title) {
              console.log("Skipped job with missing title");
              continue;
            }

            const existing = await query(
              "SELECT id FROM jobs WHERE title = $1 AND company = $2 AND location = $3",
              [job.title, job.company || null, job.locations || null]
            );

            if (existing.rows.length > 0) {
              console.log(`Job already exists: ${job.title} at ${job.company}`);
              continue;
            }

            try {
              await query(
                `INSERT INTO jobs (
                  title, description, category, company, location, requirements,
                  apply_url, posted_at, is_active, job_type, country, state, city
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
                [
                  job.title,
                  job.description,
                  null,
                  job.company || null,
                  job.locations || null,
                  null,
                  job.url,
                  new Date(job.date),
                  true,
                  job_type,
                  "United States",
                  null,
                  null,
                ]
              );
              insertedCount++;
              console.log(`Inserted job: ${job.title}`);
            } catch (error) {
              console.error(`Error inserting job ${job.title}:`, error);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching Careerjet data:", error);
      }
    }

    console.log(`Careerjet import completed. Total inserted jobs: ${insertedCount}`);

    res.json({ success: true, inserted: insertedCount });
  })
);

// ----------------- GOOGLE CAREERS IMPORT -------------------
router.post(
  "/import-google-jobs",
  adminOnly,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { keyword = "", location = "United States", pages = 3, job_type = "entry_level" } = req.body;

    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const now = new Date();

    let insertedCount = 0;

    for (let page = 0; page < pages; page++) {
      const start = page * 10;

      const filter = `location=${encodeURIComponent(location)}`;
      const employmentType = job_type === "internship" ? "INTERN" : "FULL_TIME";
      const url = `https://careers.google.com/api/v3/search/?query=${encodeURIComponent(
        keyword
      )}&${filter}&offset=${start}&limit=10&employment_type=${employmentType}`;

      try {
        const response = await axios.get(url);
        const jobs = response.data.jobs;

        if (!jobs || jobs.length === 0) {
          console.log(`No jobs found on Google Careers page ${page + 1}`);
          break;
        }

        for (const job of jobs) {
          const title = job.title || "";
          const company = job.company?.name || "Google";
          const locationStr =
            job.locations?.map((loc: any) => loc.name).join(", ") || "";
          const jobUrl = job.applyUrl || `https://careers.google.com/jobs/results/${job.jobId}/`;
          const description = job.description || "";
          const postedDate = job.postedDate ? new Date(job.postedDate) : null;

          if (!postedDate || now.getTime() - postedDate.getTime() > THIRTY_DAYS_MS) {
            console.log(`Skipped old or missing date job: ${title}`);
            continue;
          }

          const titleLower = title.toLowerCase();
          if (titleLower.includes("senior") || titleLower.includes("manager") || titleLower.includes("lead")) {
            console.log(`Skipped senior/manager job: ${title}`);
            continue;
          }

          const existing = await query(
            "SELECT id FROM jobs WHERE title = $1 AND company = $2 AND location = $3",
            [title, company, locationStr]
          );

          if (existing.rows.length > 0) {
            console.log(`Job already exists: ${title} at ${company}`);
            continue;
          }

          if (!jobUrl || jobUrl.includes("job-not-found") || jobUrl.includes("removed")) {
            console.log(`Skipped job with invalid apply URL: ${title}`);
            continue;
          }

          try {
            await query(
              `INSERT INTO jobs (
                title, description, category, company, location, requirements,
                apply_url, posted_at, is_active, job_type, country, state, city
              ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
              [
                title,
                description,
                null,
                company,
                locationStr,
                null,
                jobUrl,
                postedDate,
                true,
                job_type,
                "United States",
                null,
                null,
              ]
            );
            insertedCount++;
            console.log(`Inserted job: ${title}`);
          } catch (err) {
            console.error(`Error inserting job ${title}:`, err);
          }
        }
      } catch (error) {
        console.error(`Error fetching Google Careers page ${page + 1}:`, error);
        return res.status(500).json({ error: "Failed to fetch jobs from Google Careers" });
      }
    }

    console.log(`Google Careers import completed. Total inserted jobs: ${insertedCount}`);
    res.json({ success: true, inserted: insertedCount });
  })
);

// ----------------- TESLA IMPORT (new company scraper example) -------------------
router.post(
  "/import-tesla-jobs",
  adminOnly,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { keyword = "", location = "United States", pages = 1, job_type = "entry_level" } = req.body;

    let insertedCount = 0;

    for (let page = 0; page < pages; page++) {
      console.log(`Fetching Tesla jobs page ${page + 1}...`);

      try {
        const response = await axios.post("https://www.tesla.com/careers/api/v1/search", {
          filters: {
            keywords: keyword || "",
            location: location || "",
          },
          page: page,
          pageSize: 50,
        });

        console.log("Tesla response data sample:", JSON.stringify(response.data, null, 2));

        const jobs = response.data.data || [];

        if (!jobs.length) {
          console.log(`No Tesla jobs found on page ${page + 1}`);
          break;
        }

        for (const job of jobs) {
          console.log("Tesla job item:", job);

          const title = job.title || "";
          const company = "Tesla";
          const locationStr = job.location || location;
          const jobUrl = `https://www.tesla.com/careers/job/${job.id}`;
          const description = job.description || "";
          const postedDate = job.postedDate ? new Date(job.postedDate) : null;

          if (!postedDate) {
            console.log(`Tesla job missing postedDate, skipping: ${title}`);
            continue; // or accept, your choice
          }

          const titleLower = title.toLowerCase();
          if (titleLower.includes("senior") || titleLower.includes("manager") || titleLower.includes("lead")) {
            console.log(`Skipped senior/manager Tesla job: ${title}`);
            continue;
          }

          const existing = await query(
            "SELECT id FROM jobs WHERE title = $1 AND company = $2 AND location = $3",
            [title, company, locationStr]
          );

          if (existing.rows.length > 0) {
            console.log(`Tesla job already exists: ${title} at ${company}`);
            continue;
          }

          try {
            await query(
              `INSERT INTO jobs (
                title, description, category, company, location, requirements,
                apply_url, posted_at, is_active, job_type, country, state, city
              ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
              [
                title,
                description,
                null,
                company,
                locationStr,
                null,
                jobUrl,
                postedDate,
                true,
                job_type,
                "United States",
                null,
                null,
              ]
            );
            insertedCount++;
            console.log(`Inserted Tesla job: ${title}`);
          } catch (err) {
            console.error(`Error inserting Tesla job ${title}:`, err);
          }
        }
      } catch (error) {
        console.error(`Error fetching Tesla jobs page ${page + 1}:`, error);
        return res.status(500).json({ error: "Failed to fetch jobs from Tesla Careers" });
      }
    }

    console.log(`Tesla import completed. Total inserted jobs: ${insertedCount}`);
    res.json({ success: true, inserted: insertedCount });
  })
);


router.post(
  "/import-microsoft-jobs",
  adminOnly,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { keyword = "", location = "United States", pages = 1, job_type = "entry_level" } = req.body;

    let insertedCount = 0;

    for (let page = 1; page <= pages; page++) {
      console.log(`Fetching Microsoft jobs page ${page}...`);

      try {
        // Microsoft careers API endpoint
        const response = await axios.get("https://careers.microsoft.com/api/jobs", {
          params: {
            keyword,
            location,
            page,
            pageSize: 50,
          },
        });

        const jobs = response.data?.jobs || [];

        if (jobs.length === 0) {
          console.log(`No Microsoft jobs found on page ${page}`);
          break;
        }

        for (const job of jobs) {
          const title = job.title || "";
          const company = "Microsoft";
          const locationStr = job.location || location;
          const jobUrl = job.url || `https://careers.microsoft.com/us/en/job/${job.id}`;
          const description = job.description || "";
          const postedDate = job.postedDate ? new Date(job.postedDate) : new Date();

          // Optional: skip senior roles
          const titleLower = title.toLowerCase();
          if (titleLower.includes("senior") || titleLower.includes("manager") || titleLower.includes("lead")) {
            console.log(`Skipped senior/manager job: ${title}`);
            continue;
          }

          // Check if job already exists
          const existing = await query(
            "SELECT id FROM jobs WHERE title = $1 AND company = $2 AND location = $3",
            [title, company, locationStr]
          );

          if (existing.rows.length > 0) {
            console.log(`Job already exists: ${title} at ${company}`);
            continue;
          }

          try {
            await query(
              `INSERT INTO jobs (
                title, description, category, company, location, requirements,
                apply_url, posted_at, is_active, job_type, country, state, city
              ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
              [
                title,
                description,
                null,
                company,
                locationStr,
                null,
                jobUrl,
                postedDate,
                true,
                job_type,
                "United States",
                null,
                null,
              ]
            );
            insertedCount++;
            console.log(`Inserted Microsoft job: ${title}`);
          } catch (err) {
            console.error(`Error inserting Microsoft job ${title}:`, err);
          }
        }
      } catch (error) {
        console.error(`Error fetching Microsoft jobs page ${page}:`, error);
        return res.status(500).json({ error: "Failed to fetch jobs from Microsoft Careers" });
      }
    }

    console.log(`Microsoft import completed. Total inserted jobs: ${insertedCount}`);
    res.json({ success: true, inserted: insertedCount });
  })
);



export default router;
