console.log("Starting backend server...");

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { query } from "./db";
import multer from "multer";
import path from "path";
//import "./cronoldjobfairs";

import { OAuth2Client } from "google-auth-library";

import adminRoutes from "./adminbackend/BackendRoutes";


import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // or your config
  // other config options if needed
});

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);




const multerMemoryStorage = multer.memoryStorage();
const uploadMemory = multer({ storage: multerMemoryStorage });


declare global {
  namespace Express {
    interface Request {
      user?: { userId: number; email?: string; isAdmin?: boolean };
    }
  }
}


const app = express();
app.use(cors());



import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

// 🔐 Replace with your actual Cloudinary credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});



/*const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "ypropel-news", // ✅ Correct way to set folder
   allowed_formats: ["jpg", "jpeg", "png", "mp4", "mov", "avi"], // added video formats
  }),
});*/
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype.startsWith("video/");
    return {
      folder: "ypropel-news",
      resource_type: isVideo ? "video" : "image",
      allowed_formats: isVideo
        ? ["mp4", "mov", "avi", "webm", "mkv"]
        : ["jpg", "jpeg", "png"],
    };
  },
});


const upload = multer({ storage });

const port = 4000;

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

console.log(
  "JWT_SECRET used:",
  JWT_SECRET === "your_jwt_secret_key"
    ? "DEFAULT SECRET (please set env JWT_SECRET!)"
    : "SECRET SET FROM ENV"
);

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));



function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return function (req: Request, res: Response, next: NextFunction) {
    fn(req, res, next).catch(next);
  };
}




// Middleware for token authentication (use this for protected routes)
import { sendEmail } from "./utils/sendEmail"; // ⬅️ make sure this is at the top of your file if not already

// ----------- Password Reset Request Route -----------
app.post(
  "/auth/google-login",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { tokenId } = req.body;
      if (!tokenId) {
        return res.status(400).json({ error: "tokenId is required" });
      }

      const ticket = await googleClient.verifyIdToken({
        idToken: tokenId,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload) {
        return res.status(401).json({ error: "Invalid Google token" });
      }

      const email = payload.email!;
      const name = payload.name!;
      const picture = payload.picture;

      // Check if user already exists
      const existingUserRes = await query("SELECT * FROM users WHERE email = $1", [email]);
      let user;
      if (existingUserRes.rows.length === 0) {
        // Create a dummy password hash for Google OAuth users
        const dummyPassword = "google_oauth_dummy_password_" + Date.now();
        const dummyPasswordHash = await bcrypt.hash(dummyPassword, 10);

        // Insert new user with dummy password hash to satisfy NOT NULL constraint
        const insertRes = await query(
          `INSERT INTO users (name, email, photo_url, password_hash, created_at, updated_at)
           VALUES ($1, $2, $3, $4, NOW(), NOW())
           RETURNING *`,
          [name, email, picture || null, dummyPasswordHash]
        );
        user = insertRes.rows[0];
      } else {
        user = existingUserRes.rows[0];
      }

      // Sign JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, is_admin: user.is_admin || false },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({ user, token, isNewUser: existingUserRes.rows.length === 0 });
    } catch (error) {
      console.error("Error in /auth/google-login:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  })
);


app.post(
  "/auth/forgot-password",
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const result = await query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No account found with this email" });
    }

    const user = result.rows[0];
   const token = jwt.sign(
  {
    userId: user.id,
    email: user.email,         // Optional, but helpful
    is_admin: user.is_admin,   // ✅ Required for admin access on frontend
  },
  JWT_SECRET,
  { expiresIn: "1h" }
);


    const resetLink = `http://localhost:3000/reset-password?token=${token}`;

    await sendEmail(
  email,
  "Reset your YPropel password",
  `<p>You requested a password reset.</p><p><a href="${resetLink}">Click here to reset your password</a></p>`
);


    res.json({ message: "Password reset email sent" });
  })
);


app.post(
  "/auth/reset-password",
  asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token and new password are required" });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [
  hashedPassword,
  decoded.userId,
]);


      res.json({ message: "Password has been reset successfully." });
    } catch (err) {
      console.error("Invalid or expired reset token", err);
      res.status(400).json({ error: "Invalid or expired reset token." });
    }
  })
);

function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers["authorization"];
  //console.log("🔥 Auth header:", authHeader);

  const token = authHeader?.split(" ")[1];

  if (!token) {
    console.log("⚠️ No token found in Authorization header");
    return ;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log("❌ JWT verification failed:", err.message);
      return ;
    }

    //console.log("✅ JWT verified. Decoded payload:", decoded);

    // Cast decoded payload
    const payload = decoded as { userId: number; email?: string; is_admin?: boolean };

    req.user = {
      userId: payload.userId,
      email: payload.email,
      isAdmin: payload.is_admin || false,
    };

    next();
  });
}


const defaultProfilePhotos = [
  "https://res.cloudinary.com/denggbgma/image/upload/v<version>/ypropel-users/default-profile1.png",
];
  async function signupHandler(req: Request, res: Response) {
  const {
    name,
    email,
    password,
    title,
    university,
    major,
    experience_level,
    skills,
    company,
    courses_completed,
    country,
    birthdate,
    volunteering_work,
    projects_completed,
    photo_url,
  } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }

  // Assign a random default photo if none provided or empty
  let photoUrlToUse = photo_url;
  if (!photoUrlToUse || photoUrlToUse.trim() === "") {
    photoUrlToUse =
      defaultProfilePhotos[Math.floor(Math.random() * defaultProfilePhotos.length)];
  }

  try {
    const existingUser = await query("SELECT * FROM users WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await query(
      `INSERT INTO users 
      (name, email, password_hash, title, university, major, experience_level, skills, company, courses_completed, country, birthdate, volunteering_work, projects_completed, photo_url, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15, NOW(), NOW())
      RETURNING id, name, email, title, university, major, experience_level, skills, company, courses_completed, country, birthdate, volunteering_work, projects_completed, photo_url`,
      [
        name,
        email,
        hashedPassword,
        title || null,
        university || null,
        major || null,
        experience_level || null,
        skills || null,
        company || null,
        courses_completed || null,
        country || null,
        birthdate || null,
        volunteering_work || null,
        projects_completed || null,
        photoUrlToUse,
      ]
    );

    const user = result.rows[0];

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({ user, token });
  } catch (error) {
    console.error("Error signing up user:", error);
    res.status(500).json({ error: (error as Error).message || "Unknown error" });
  }
}
//--------------

async function signinHandler(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const result = await query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0];

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // ✅ Updated: includes is_admin in the JWT payload
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        is_admin: user.is_admin, // ✅ <-- Added
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const { password_hash, ...userData } = user;
    res.json({ user: userData, token });
  } catch (error) {
    console.error("Error signing in user:", error);
    res.status(500).json({ error: (error as Error).message || "Unknown error" });
  }
}


// Register routes
app.post("/auth/signup", asyncHandler(signupHandler));
app.post("/auth/signin", asyncHandler(signinHandler));


// -------- Protected route to get current user's profile ---------
app.get(
  "/users/me",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
   
    
    const userId = req.user?.userId;
    //console.log("Decoded user ID in middleware:", userId);
if (!userId) return res.status(401).json({ error: "Unauthorized" });


    const result = await query(
      `SELECT id, name, email, title, university, major, experience_level, skills, company,
       courses_completed, country, birthdate, volunteering_work, projects_completed, photo_url
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  })
);

// -------- Protected route to get all users ---------
app.get(
  "/users",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await query(
      `SELECT id, name, email, title, university, major, experience_level, skills, company,
        courses_completed, country, birthdate, volunteering_work, projects_completed, photo_url
      FROM users`
    );
    res.json(result.rows);
  })
);


// -------- Posts Routes ---------

// GET all posts with author info, followed, liked flags, and comments
app.get(
  "/posts",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {

    
    const userId = req.user?.userId;
if (!userId) return res.status(401).json({ error: "Unauthorized" });


    // Get all posts with author info
   const postsResult = await query(
  `SELECT p.id, p.user_id AS author_id, u.name AS author_name, p.content, p.image_url, p.video_url, p.created_at
   FROM posts p
   JOIN users u ON p.user_id = u.id
   ORDER BY p.created_at DESC`
);


    // Get list of post IDs the user follows
    const followsResult = await query(`SELECT post_id FROM post_follows WHERE user_id = $1`, [userId]);
    const followedPostIds = new Set(followsResult.rows.map((row) => row.post_id));

    // Get list of post IDs the user liked
    const likesResult = await query(`SELECT post_id FROM post_likes WHERE user_id = $1`, [userId]);
    const likedPostIds = new Set(likesResult.rows.map((row) => row.post_id));

    // Get comments for all posts in one query
    const postIds = postsResult.rows.map((post) => post.id);
    let commentsResult = { rows: [] as any[] };
    if (postIds.length > 0) {
      commentsResult = await query(
        `SELECT c.id, c.post_id, c.user_id, u.name AS user_name, c.content, c.created_at
         FROM comments c
         JOIN users u ON c.user_id = u.id
         WHERE c.post_id = ANY($1)
         ORDER BY c.created_at ASC`,
        [postIds]
      );
    }

    // Group comments by post_id
    const commentsByPostId: { [key: number]: any[] } = {};
    commentsResult.rows.forEach((comment) => {
      if (!commentsByPostId[comment.post_id]) {
        commentsByPostId[comment.post_id] = [];
      }
      commentsByPostId[comment.post_id].push({
        id: comment.id,
        userId: comment.user_id,
        userName: comment.user_name,
        content: comment.content,
        createdAt: comment.created_at,
      });
    });

    // Map posts and add followed, liked, comments
    const postsWithExtras = postsResult.rows.map((post) => ({
      id: post.id,
      authorId: post.author_id,
      authorName: post.author_name,
      title: post.title,
      content: post.content,
      imageUrl: post.image_url,
        videoUrl: post.video_url,
      createdAt: post.created_at,
      followed: followedPostIds.has(post.id),
      liked: likedPostIds.has(post.id),
      comments: commentsByPostId[post.id] || [],
    }));

    res.json(postsWithExtras);
  })
);

// -----POST create a new post
// POST create a new post
app.post(
  "/posts",
  authenticateToken,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const { content } = req.body;

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const imageFile = files?.image?.[0];
      const videoFile = files?.video?.[0];

      // Log files nicely
      //console.log("Image File:----->", JSON.stringify(imageFile, null, 2));
      //console.log("Video File:----->", JSON.stringify(videoFile, null, 2));

      const imageUrl = imageFile ? imageFile.path : null;
      const videoUrl = videoFile ? videoFile.path : null;

      if (!content && !imageFile && !videoFile) {
        console.error("⚠️ Post rejected: missing content and media.");
        return res.status(400).json({ error: "Post must contain content or media." });
      }

      const result = await query(
        `INSERT INTO posts (user_id, content, image_url, video_url, created_at)
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING id, user_id AS authorId, content, image_url AS imageUrl, video_url AS videoUrl, created_at`,
        [userId, content || "", imageUrl, videoUrl]
      );

      //console.log("✅ Post inserted:", result.rows[0]);
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("❌ Error inserting post:", error);
      res.status(500).json({ error: "Failed to create post" });
    }
  })
);


//----- PUT update a post by ID (protected)
app.put(
  "/posts/:postId",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const postId = parseInt(req.params.postId, 10);
    const {  content, imageUrl, videoUrl } = req.body;
 

    const userId = req.user?.userId;
if (!userId) return res.status(401).json({ error: "Unauthorized" });


    if (isNaN(postId)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }
    if (!content && !imageUrl && !videoUrl) {
  return res.status(400).json({ error: "Post must contain content or media." });
}


    const resultCheck = await query("SELECT user_id FROM posts WHERE id = $1", [postId]);
    if (resultCheck.rows.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }
    if (resultCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ error: "Forbidden: You can only edit your own posts" });
    }

   const result = await query(
  `UPDATE posts 
   SET content = $1, image_url = $2, video_url = $3, updated_at = NOW()
   WHERE id = $4
   RETURNING id, user_id AS authorId, content, image_url AS imageUrl, video_url AS videoUrl, created_at`,
  [content, imageUrl || null, videoUrl || null, postId]
);


    res.json(result.rows[0]);
  })
);
// POST toggle follow/unfollow for a post
app.post(
  "/posts/:postId/follow",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    
    const userId = req.user?.userId;
if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const postId = parseInt(req.params.postId, 10);

    if (isNaN(postId)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }

    // Check if user already follows this post
    const followCheck = await query("SELECT * FROM post_follows WHERE user_id = $1 AND post_id = $2", [userId, postId]);

    if (followCheck.rows.length > 0) {
      // User follows this post, so unfollow
      await query("DELETE FROM post_follows WHERE user_id = $1 AND post_id = $2", [userId, postId]);
      return res.json({ followed: false });
    } else {
      // User does not follow this post, so add follow
      await query("INSERT INTO post_follows (user_id, post_id) VALUES ($1, $2)", [userId, postId]);
      return res.json({ followed: true });
    }
  })
);

// POST toggle like/unlike for a post
app.post(
  "/posts/:postId/like",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
   
    const userId = req.user?.userId;
if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const postId = parseInt(req.params.postId, 10);

    if (isNaN(postId)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }

    // Check if user already liked this post
    const likeCheck = await query("SELECT * FROM post_likes WHERE user_id = $1 AND post_id = $2", [userId, postId]);

    if (likeCheck.rows.length > 0) {
      // User liked this post, so unlike (remove)
      await query("DELETE FROM post_likes WHERE user_id = $1 AND post_id = $2", [userId, postId]);
      return res.json({ liked: false });
    } else {
      // User did not like yet, add like
      await query("INSERT INTO post_likes (user_id, post_id) VALUES ($1, $2)", [userId, postId]);
      return res.json({ liked: true });
    }
  })
);

// POST share a post
app.post(
  "/posts/:postId/share",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    
    const userId = req.user?.userId;
if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const postId = parseInt(req.params.postId, 10);

    if (isNaN(postId)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }

    // Check if user already shared this post
    const shareCheck = await query("SELECT * FROM post_shares WHERE user_id = $1 AND post_id = $2", [userId, postId]);

    if (shareCheck.rows.length > 0) {
      return res.status(400).json({ error: "Post already shared" });
    } else {
      await query("INSERT INTO post_shares (user_id, post_id, shared_at) VALUES ($1, $2, NOW())", [userId, postId]);
      return res.json({ shared: true });
    }
  })
);

// -------- COMMENTS ROUTES ---------

// GET comments for a post
app.get(
  "/posts/:postId/comments",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const postId = parseInt(req.params.postId, 10);

    if (isNaN(postId)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }

    const result = await query(
      `SELECT 
         c.id, 
         c.post_id, 
         c.user_id AS "userId", 
         u.name AS "userName", 
         c.content, 
         c.created_at
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC`,
      [postId]
    );

    res.json(result.rows);
  })
);
//---------------NEws and updates-------
app.get("/news", async (req: Request, res: Response) => {
  try {
    const result = await query("SELECT * FROM news ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

//-------------------------
app.post("/news", (req: Request, res: Response): void => {
  (async () => {
    const { title, content, image_url } = req.body;
    if (!title || !content) {
      res.status(400).json({ error: "Missing title or content" });
      return;
    }

    try {
      await query(
        "INSERT INTO news (title, content, image_url) VALUES ($1, $2, $3)",
        [title, content, image_url || null]
      );
      res.status(201).json({ message: "News added successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to add news" });
    }
  })();
});

//--------Add news image------

app.post(
  "/upload-news-image",
  upload.single("image"),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      console.error("❌ No file uploaded.");
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    console.log("✅ Uploaded file via Cloudinary:");
    console.dir(req.file, { depth: null });

    // ✅ Use `path` instead of `secure_url`
   res.status(200).json({ imageUrl: req.file.path }); // currently only returns path? Need secure_url instead

  })
);






//-------Edit My profile routes-------------
//---------------Routes to display majors in dropdown in edit profile-------------------------

app.put("/users/:id", authenticateToken, asyncHandler(async (req, res) => {
  const userId = Number(req.params.id);

  // List all possible fields, adding major_id and major_other
  const allowedFields = [
    "name",
    "email",
    "title",
    "university",
    "major", // keep for legacy, but ideally avoid updating this
    "major_id",
    "major_other",
    "experience_level",
    "skills",
    "company",
    "courses_completed",
    "country",
    "state",
    "city",
    "birthdate",
    "volunteering_work",
    "projects_completed",
    "photo_url",
  ];

  // Validate major_id if provided
  if (req.body.major_id !== undefined && req.body.major_id !== null) {
    const majorCheck = await query(
      "SELECT id FROM standard_majors WHERE id = $1",
      [req.body.major_id]
    );
    if (majorCheck.rowCount === 0) {
      return res.status(400).json({ error: "Invalid major_id" });
    }
  }

  // Filter fields present in req.body
  const fieldsToUpdate = allowedFields.filter(field => req.body[field] !== undefined);

  if (fieldsToUpdate.length === 0) {
    return res.status(400).json({ error: "No valid fields provided for update" });
  }

  // Build SET clause dynamically
  const setClause = fieldsToUpdate
    .map((field, idx) => `${field}=$${idx + 1}`)
    .join(", ");

  // Collect values in same order
  const values = fieldsToUpdate.map(field => req.body[field]);

  // Add userId as last parameter
  values.push(userId);

  // Execute dynamic query
  const result = await query(
    `UPDATE users SET ${setClause} WHERE id=$${values.length} RETURNING *`,
    values
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json(result.rows[0]);
}));

// GET /standard_majors - fetch all standard majors
app.get("/standard_majors", asyncHandler(async (req, res) => {
  const result = await query("SELECT id, name FROM standard_majors ORDER BY name ASC");
  res.json(result.rows);
}));

//----insert new  majors added by users in pending majors to approve
app.post("/pending_majors", authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const { name } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "Major name is required" });
  }

  const existingStandard = await query(
    `SELECT id FROM standard_majors WHERE LOWER(name) = LOWER($1)`,
    [name.trim()]
  );

  if (existingStandard?.rowCount && existingStandard.rowCount > 0) {
    return res.status(400).json({ error: "Major already exists" });
  }

  const existingPending = await query(
    `SELECT id FROM pending_majors WHERE LOWER(name) = LOWER($1)`,
    [name.trim()]
  );

  if (existingPending?.rowCount && existingPending.rowCount > 0) {
    return res.status(400).json({ error: "Major already submitted and pending approval" });
  }

  const result = await query(
    `INSERT INTO pending_majors (name, submitted_by) VALUES ($1, $2) RETURNING *`,
    [name.trim(), userId]
  );

  res.status(201).json(result.rows[0]);
}));

//-----Routes to get experience level for drop down in edite profile


// GET all standard experience levels
app.get(
  "/standard_experience_levels",
  asyncHandler(async (req, res) => {
    const result = await query(
      `SELECT id, level_name FROM standard_experience_levels ORDER BY id`
    );
    res.json(result.rows);
  })
);


//--------------------


// -------- Protected route to delete user profile ---------
app.delete(
  "/users/:id",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
     const userId = parseInt(req.params.id, 10);
    const tokenUserId = req.user?.userId;
if (!tokenUserId || isNaN(tokenUserId)) {
  return res.status(400).json({ error: "Invalid or missing user ID" });
}

    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Only allow deleting own account
    if (userId !== tokenUserId) {
      return res.status(403).json({ error: "Forbidden: You can only delete your own account" });
    }

    const result = await query("DELETE FROM users WHERE id = $1 RETURNING id", [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  })
);


// POST add a comment to a post
app.post(
  "/posts/:postId/comments",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
  
    const userId = req.user?.userId;
if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const postId = parseInt(req.params.postId, 10);
    const { content } = req.body;

    if (isNaN(postId)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }
    if (!content || content.trim() === "") {
      return res.status(400).json({ error: "Content is required" });
    }

    const result = await query(
      `INSERT INTO comments (post_id, user_id, content, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, post_id, user_id, content, created_at`,
      [postId, userId, content]
    );

    res.status(201).json(result.rows[0]);
  })
);

// DELETE a comment
// -------- DELETE a post by ID (protected) --------
app.delete(
  "/posts/:postId",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const postId = parseInt(req.params.postId, 10);
    
    const userId = req.user?.userId;
if (!userId) return res.status(401).json({ error: "Unauthorized" });


    if (isNaN(postId)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }

    // Check if post exists and belongs to the user
    const result = await query("SELECT user_id FROM posts WHERE id = $1", [postId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (result.rows[0].user_id !== userId) {
      return res.status(403).json({ error: "Forbidden: You can only delete your own posts" });
    }

    await query("DELETE FROM posts WHERE id = $1", [postId]);

    res.json({ message: "Post deleted successfully" });
  })
);

app.delete(
  "/comments/:commentId",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const commentId = parseInt(req.params.commentId, 10);
 
    const userId = req.user?.userId;
if (!userId) return res.status(401).json({ error: "Unauthorized" });


    if (isNaN(commentId)) {
      return res.status(400).json({ error: "Invalid comment ID" });
    }

    // Verify comment exists and belongs to user
    const commentResult = await query("SELECT user_id FROM comments WHERE id = $1", [commentId]);
    if (commentResult.rows.length === 0) {
      return res.status(404).json({ error: "Comment not found" });
    }
    if (commentResult.rows[0].user_id !== userId) {
      return res.status(403).json({ error: "Forbidden: You can only delete your own comments" });
    }

    await query("DELETE FROM comments WHERE id = $1", [commentId]);

    res.json({ message: "Comment deleted successfully" });
  })
);

// PUT update a comment
app.put(
  "/posts/:postId/comments/:commentId",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const postId = parseInt(req.params.postId, 10);
    const commentId = parseInt(req.params.commentId, 10);
    const { content } = req.body;
    
    const userId = req.user?.userId;
if (!userId) return res.status(401).json({ error: "Unauthorized" });


    if (isNaN(postId) || isNaN(commentId)) {
      return res.status(400).json({ error: "Invalid post ID or comment ID" });
    }

    if (!content || content.trim() === "") {
      return res.status(400).json({ error: "Content is required" });
    }

    // Check if the comment belongs to the user and matches the post
    const commentResult = await query(
      "SELECT * FROM comments WHERE id = $1 AND post_id = $2 AND user_id = $3",
      [commentId, postId, userId]
    );

    if (commentResult.rows.length === 0) {
      return res.status(404).json({ error: "Comment not found or you are not the author" });
    }

    const updateResult = await query(
      `UPDATE comments
       SET content = $1, created_at = NOW()
       WHERE id = $2
       RETURNING id, post_id, user_id, content, created_at`,
      [content, commentId]
    );

    res.json(updateResult.rows[0]);
  })
);

//------messages for memebers chat routes----------
//-------------chat routes---------
// GET conversation messages between two users
app.get(
  "/messages/conversation",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const user1 = parseInt(req.query.user1 as string);
    const user2 = parseInt(req.query.user2 as string);

    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (!user1 || !user2) return res.status(400).json({ error: "Missing user1 or user2 query params" });

    // Security: Ensure the logged-in user is one of the two users
    if (userId !== user1 && userId !== user2) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const sql = `
      SELECT id, sender_id, receiver_id, message_text, sent_at, read_at
      FROM messages
      WHERE (sender_id = $1 AND receiver_id = $2)
         OR (sender_id = $2 AND receiver_id = $1)
      ORDER BY sent_at ASC
    `;

    const result = await query(sql, [user1, user2]);
    res.json(result.rows);
  })
);

// POST send a message
app.post(
  "/messages",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const sender_id = req.user?.userId;
    const { receiver_id, message_text } = req.body;

    if (!sender_id) return res.status(401).json({ error: "Unauthorized" });
    if (!receiver_id || !message_text || message_text.trim() === "") {
      return res.status(400).json({ error: "receiver_id and message_text are required" });
    }

    const sql = `
      INSERT INTO messages (sender_id, receiver_id, message_text, sent_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING id, sender_id, receiver_id, message_text, sent_at, read_at
    `;

    const result = await query(sql, [sender_id, receiver_id, message_text.trim()]);
    res.status(201).json(result.rows[0]);
  })
);
//---fetch all members for member-list component
app.get("/members", authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  const members = await query(
    `SELECT id, name, photo_url FROM users WHERE id != $1 ORDER BY name ASC`,
    [userId]
  );
  res.json(members.rows);
}));

//-------add red notification with new message--
app.get('/messages/unread-count', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  const result = await query(
    `SELECT COUNT(*) FROM messages WHERE receiver_id = $1 AND read_at IS NULL`,
    [userId]
  );
  res.json({ unreadCount: parseInt(result.rows[0].count, 10) });
}));
app.post(
  "/messages/mark-read",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { otherUserId } = req.body;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (!otherUserId) return res.status(400).json({ error: "Missing otherUserId" });

    // Update all unread messages sent from otherUserId to userId
    const result = await query(
      `UPDATE messages
       SET read_at = NOW()
       WHERE sender_id = $1 AND receiver_id = $2 AND read_at IS NULL`,
      [otherUserId, userId]
    );

    res.json({ message: "Messages marked as read" });
  })
);

app.get(
  "/members/combined-list",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const userId = req.user?.userId;

    const sql = `
      SELECT u.id, u.name, u.photo_url, recent.last_message
      FROM users u
      LEFT JOIN (
        SELECT
          CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END AS member_id,
          MAX(sent_at) as last_message
        FROM messages
        WHERE sender_id = $1 OR receiver_id = $1
        GROUP BY member_id
      ) recent ON u.id = recent.member_id
      WHERE u.id != $1
      ORDER BY
        CASE WHEN recent.last_message IS NULL THEN 1 ELSE 0 END,
        recent.last_message DESC NULLS LAST,
        u.name ASC
    `;

    const result = await query(sql, [userId]);

    const recentMembers = result.rows.filter((m) => m.last_message !== null);
    const otherMembers = result.rows.filter((m) => m.last_message === null);

    res.json({ recentMembers, otherMembers });
  })
);

app.get(
  "/messages/unread-count-by-sender",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const result = await query(
      `SELECT sender_id, COUNT(*) AS unread_count
       FROM messages
       WHERE receiver_id = $1 AND read_at IS NULL
       GROUP BY sender_id`,
      [userId]
    );

    // Format as { sender_id: unread_count, ... }
    const unreadCounts: Record<number, number> = {};
    result.rows.forEach((row) => {
      unreadCounts[row.sender_id] = parseInt(row.unread_count, 10);
    });

    res.json(unreadCounts);
  })
);

//---------------------------------------------
// --------------Discussion Topics route---------------
//--------------Post Discussion Topic---------------
app.post(
  "/discussion_topics",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { topic } = req.body;
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (!topic || topic.trim() === "") {
      return res.status(400).json({ error: "Topic content is required" });
    }

    // 1. Insert topic
    const insertResult = await query(
      `INSERT INTO discussion_topics (user_id, topic, created_at)
       VALUES ($1, $2, NOW())
       RETURNING id, user_id, topic, created_at`,
      [userId, topic]
    );
    const newTopic = insertResult.rows[0];

    // 2. Get author name
    const authorResult = await query("SELECT name FROM users WHERE id = $1", [userId]);
    const authorName = authorResult.rows[0]?.name || "Unknown";

    // 3. Return enriched topic object
    res.status(201).json({
      id: newTopic.id,
      topic: newTopic.topic,
      createdAt: newTopic.created_at,
      author: authorName,
      liked: false,
      followed: false,
      upvoted: false,
      likes: 0,
      shares: 0,
      upvotes: 0,
      comments: [],
    });
  })
);



//----Post discussion topics likes-----
app.post(
  "/discussion_topics/:topicId/like",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const topicId = parseInt(req.params.topicId, 10);
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (isNaN(topicId)) return res.status(400).json({ error: "Invalid topic ID" });

    let liked = false;

    const likeCheck = await query(
      "SELECT * FROM discussion_likes WHERE user_id = $1 AND topic_id = $2",
      [userId, topicId]
    );

    if (likeCheck.rows.length > 0) {
      await query("DELETE FROM discussion_likes WHERE user_id = $1 AND topic_id = $2", [userId, topicId]);
      liked = false;
    } else {
      await query("INSERT INTO discussion_likes (user_id, topic_id) VALUES ($1, $2)", [userId, topicId]);
      liked = true;
    }

    const countResult = await query(
      "SELECT COUNT(*) FROM discussion_likes WHERE topic_id = $1",
      [topicId]
    );

    const totalLikes = parseInt(countResult.rows[0].count, 10);

    return res.json({ liked, totalLikes });
  })
);
//----Post disucssion topics follows----
app.post(
  "/discussion_topics/:topicId/follow",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const topicId = parseInt(req.params.topicId, 10);
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (isNaN(topicId)) return res.status(400).json({ error: "Invalid topic ID" });

    const followCheck = await query(
      "SELECT * FROM discussion_follows WHERE user_id = $1 AND topic_id = $2",
      [userId, topicId]
    );

    if (followCheck.rows.length > 0) {
      await query("DELETE FROM discussion_follows WHERE user_id = $1 AND topic_id = $2", [userId, topicId]);
      return res.json({ followed: false });
    } else {
      await query("INSERT INTO discussion_follows (user_id, topic_id) VALUES ($1, $2)", [userId, topicId]);
      return res.json({ followed: true });
    }
  })
);

// ---Post discussion topics upvote--
app.post(
  "/discussion_topics/:topicId/upvote",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const topicId = parseInt(req.params.topicId, 10);
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (isNaN(topicId)) return res.status(400).json({ error: "Invalid topic ID" });

    const upvoteCheck = await query(
      "SELECT * FROM discussion_upvotes WHERE user_id = $1 AND topic_id = $2",
      [userId, topicId]
    );

    if (upvoteCheck.rows.length > 0) {
      await query("DELETE FROM discussion_upvotes WHERE user_id = $1 AND topic_id = $2", [userId, topicId]);
      return res.json({ upvoted: false });
    } else {
      await query("INSERT INTO discussion_upvotes (user_id, topic_id) VALUES ($1, $2)", [userId, topicId]);
      return res.json({ upvoted: true });
    }
  })
);


//--Get All discussion topics---
// ✅ GET discussion topics with author, comments, likes, follows
app.get(
  "/discussion_topics",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // ✅ 1. Get topics with author names
    const topicsResult = await query(
  `SELECT dt.*, u.name AS author_name,
     (SELECT COUNT(*) FROM discussion_upvotes du WHERE du.topic_id = dt.id) AS upvotes
   FROM discussion_topics dt
   JOIN users u ON dt.user_id = u.id
   ORDER BY dt.created_at DESC`
);

//--get upvotes--
    const upvotesResult = await query(
  "SELECT topic_id FROM discussion_upvotes WHERE user_id = $1",
  [userId]
);
const upvotedTopicIds = new Set(upvotesResult.rows.map((r) => r.topic_id));
//----------------
    const topicIds = topicsResult.rows.map((t) => t.id);

    // ✅ 2. Get comment list
    let commentsResult = { rows: [] as any[] };
    if (topicIds.length > 0) {
      commentsResult = await query(
        `SELECT c.*, u.name AS user_name
         FROM discussion_comments c
         JOIN users u ON c.user_id = u.id
         WHERE c.topic_id = ANY($1::int[])
         ORDER BY c.created_at ASC`,
        [topicIds]
      );
    }

    // ✅ 3. Organize comments by topic ID
    const commentsByTopicId: { [key: number]: any[] } = {};
    for (const comment of commentsResult.rows) {
      if (!commentsByTopicId[comment.topic_id]) {
        commentsByTopicId[comment.topic_id] = [];
      }
      commentsByTopicId[comment.topic_id].push(comment);
    }

    // ✅ 4. Get user's likes and follows
    const likesResult = await query(
      "SELECT topic_id FROM discussion_likes WHERE user_id = $1",
      [userId]
    );
    const followsResult = await query(
      "SELECT topic_id FROM discussion_follows WHERE user_id = $1",
      [userId]
    );

    

    const likedTopicIds = new Set(likesResult.rows.map((r) => r.topic_id));
    const followedTopicIds = new Set(followsResult.rows.map((r) => r.topic_id));

    // ✅ 5. Get like counts
    const likeCountsResult = await query(
      `SELECT topic_id, COUNT(*) as like_count
       FROM discussion_likes
       GROUP BY topic_id`
    );
    const likeCounts: { [key: number]: number } = {};
    for (const row of likeCountsResult.rows) {
      likeCounts[row.topic_id] = parseInt(row.like_count, 10);
    }

    


    // ✅ 6. Merge everything into enriched topic objects
    const enrichedTopics = topicsResult.rows.map((topic) => ({
  id: topic.id,
  topic: topic.topic,
  createdAt: topic.created_at,
  author: topic.author_name,
  likes: likeCounts[topic.id] || 0,
  shares: topic.shares || 0,
  upvotes: topic.upvotes || 0,  // ✅ add this line
  liked: likedTopicIds.has(topic.id),
  followed: followedTopicIds.has(topic.id),
  upvoted: upvotedTopicIds.has(topic.id),
  comments: commentsByTopicId[topic.id] || [],
  
}));


    // ✅ 7. Return to frontend
    res.json(enrichedTopics);
  })
);

//----delete discussion topic---
app.delete(
  "/discussion_topics/:topicId",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const topicId = parseInt(req.params.topicId, 10);
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (isNaN(topicId)) return res.status(400).json({ error: "Invalid topic ID" });

    const topicCheck = await query("SELECT user_id FROM discussion_topics WHERE id = $1", [topicId]);
    if (topicCheck.rows.length === 0) {
      return res.status(404).json({ error: "Topic not found" });
    }

    if (topicCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ error: "Forbidden: You can only delete your own topic" });
    }

    await query("DELETE FROM discussion_topics WHERE id = $1", [topicId]);

    res.json({ message: "Topic deleted successfully" });
  })
);
//---Update discussion topic---
app.put(
  "/discussion_topics/:topicId",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const topicId = parseInt(req.params.topicId, 10);
    const userId = req.user?.userId;
    const { topic } = req.body;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (isNaN(topicId)) return res.status(400).json({ error: "Invalid topic ID" });
    if (!topic || topic.trim() === "") return res.status(400).json({ error: "Topic content is required" });

    const topicCheck = await query("SELECT user_id FROM discussion_topics WHERE id = $1", [topicId]);
    if (topicCheck.rows.length === 0) {
      return res.status(404).json({ error: "Topic not found" });
    }

    if (topicCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ error: "Forbidden: You can only edit your own topic" });
    }

    await query("UPDATE discussion_topics SET topic = $1, created_at = NOW() WHERE id = $2", [
      topic,
      topicId,
    ]);

    res.json({ message: "Topic updated successfully" });
  })
);


//---------------Create Study circle route-------
app.post(
  "/study-circles",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { name, isPublic, members } = req.body;
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (!name || name.trim() === "") return res.status(400).json({ error: "Study circle name is required" });

    console.log("📥 Received request to create study circle:", { name, isPublic, members });

    // ✅ Insert study circle
    const result = await query(
      `INSERT INTO study_circles (user_id, name, is_public, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, user_id, name, is_public, created_at`,
      [userId, name.trim(), isPublic]
    );

    const circleId = result.rows[0].id;
    console.log("✅ Circle created successfully with ID:", circleId);

    // ✅ Auto-add the creator
    await query("INSERT INTO study_circle_members (circle_id, user_id) VALUES ($1, $2)", [circleId, userId]);
    //console.log("👤 Creator added as member");

    // ✅ Add additional members if any
    if (Array.isArray(members) && members.length > 0) {
      for (const email of members) {
        const userResult = await query("SELECT id FROM users WHERE email = $1", [email]);

        if (userResult.rows.length > 0) {
          const memberId = userResult.rows[0].id;
          if (memberId !== userId) {
            await query("INSERT INTO study_circle_members (circle_id, user_id) VALUES ($1, $2)", [circleId, memberId]);
            console.log(`👥 Added member ${email} (ID: ${memberId})`);
          }
        } else {
          console.log(`⚠️ No user found with email ${email}`);
        }
      }
    }

    res.status(201).json({ message: "Study circle created", id: circleId });
  })
);


//-------------Get all study circles----------
app.get(
  "/study-circles",
  authenticateToken,
  asyncHandler(async (_req: Request, res: Response) => {
    const circles = await query(
      `SELECT sc.id, sc.name, sc.is_public, sc.created_at, sc.user_id AS created_by, u.name AS creator
       FROM study_circles sc
       JOIN users u ON sc.user_id = u.id
       ORDER BY sc.created_at DESC`
    );

    const memberResults = await query(
      `SELECT scm.circle_id, u.email
       FROM study_circle_members scm
       JOIN users u ON scm.user_id = u.id`
    );

    // ✅ FIXED: Include `created_by` in the type definition
    const circleMap = new Map<number, {
      id: number;
      name: string;
      is_public: boolean;
      creator: string;
      created_by: number; // ✅ Important for permission checks
      members: string[];
    }>();

    circles.rows.forEach(circle => {
      circleMap.set(circle.id, { ...circle, members: [] });
    });

    memberResults.rows.forEach(member => {
      if (circleMap.has(member.circle_id)) {
        circleMap.get(member.circle_id)!.members.push(member.email);
      }
    });

    res.json(Array.from(circleMap.values()));
  })
);





//----------------------Circle messaging -------------
app.get(
  "/study-circles/:id/messages",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const circleId = parseInt(req.params.id, 10);

    const result = await query(
      `SELECT cm.id, cm.message, cm.created_at, cm.user_id AS senderId, u.name AS sender
       FROM circle_messages cm
       JOIN users u ON cm.user_id = u.id
       WHERE cm.circle_id = $1
       ORDER BY cm.created_at ASC`,
      [circleId]
    );

    res.json(result.rows);
  })
);


app.post(
  "/study-circles/:id/messages",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const circleId = parseInt(req.params.id, 10);
    const { message } = req.body;

    if (!message || !userId || isNaN(circleId)) {
      return res.status(400).json({ error: "Missing data" });
    }

    // Insert the new message
    const insertResult = await query(
      `INSERT INTO circle_messages (circle_id, user_id, message)
       VALUES ($1, $2, $3)
       RETURNING id, message, created_at`,
      [circleId, userId, message]
    );

    const savedMessage = insertResult.rows[0];

    // Get sender name
    const userResult = await query(`SELECT name FROM users WHERE id = $1`, [userId]);
    const senderName = userResult.rows[0]?.name || "Unknown";

    res.status(201).json({
      ...savedMessage,
      senderId: userId,
      sender: senderName,
    });
  })
);


app.post(
  "/study-circles/:circleId/add-member",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const circleId = parseInt(req.params.circleId, 10);
    const { userId } = req.body;

    if (!circleId || !userId) {
      return res.status(400).json({ error: "Circle ID and user ID are required" });
    }

    // Check if user already exists in the circle
    const existing = await query(
      `SELECT * FROM study_circle_members WHERE circle_id = $1 AND user_id = $2`,
      [circleId, userId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "User is already a member of this circle" });
    }

    await query(
      `INSERT INTO study_circle_members (circle_id, user_id) VALUES ($1, $2)`,
      [circleId, userId]
    );

    return res.json({ success: true });
  })
);



//---------add memebrs to study circles---------
// ----------------- SEARCH USERS -----------------


// ----------------- SEARCH USERS -----------------
// 🔍 Search users by name or email (case-insensitive)

app.get("/users/search", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const queryParam = req.query.query;

  if (!queryParam || typeof queryParam !== "string") {
    res.status(400).json({ error: "Missing or invalid search query" });
    return;
  }

  try {
    const results = await query(
      `SELECT id, name, email FROM users
       WHERE LOWER(name) LIKE LOWER($1) OR LOWER(email) LIKE LOWER($1)
       LIMIT 10`,
      [`%${queryParam}%`]
    );

    res.json(results.rows);
  } catch (err) {
    console.error("Error searching users:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});




//---------------------------------------

    //-------Discussion comments and --------
    app.post(
  "/discussion_topics/:topicId/comments",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const topicId = parseInt(req.params.topicId, 10);
    const userId = req.user?.userId;
    const { content } = req.body;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (isNaN(topicId)) return res.status(400).json({ error: "Invalid topic ID" });
    if (!content || content.trim() === "") {
      return res.status(400).json({ error: "Content is required" });
    }

    const result = await query(
      `INSERT INTO discussion_comments (topic_id, user_id, content, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, topic_id, user_id, content, created_at`,
      [topicId, userId, content]
    );

    res.status(201).json(result.rows[0]);
  })
);

//----Get comments for discussion topic---
app.get(
  "/discussion_topics",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Get all discussion topics with author names
    const topicsResult = await query(
      `SELECT dt.*, u.name AS author_name
       FROM discussion_topics dt
       JOIN users u ON dt.user_id = u.id
       ORDER BY dt.created_at DESC`
    );
    // Get all upvotes for the current user
const upvotesResult = await query(
  "SELECT topic_id FROM discussion_upvotes WHERE user_id = $1",
  [userId]
);

// Count total upvotes per topic
const upvoteCountsResult = await query(`
  SELECT topic_id, COUNT(*) AS count
  FROM discussion_upvotes
  GROUP BY topic_id
`);

const upvotedTopicIds = new Set(upvotesResult.rows.map((r) => r.topic_id));
const upvoteCountsMap: { [key: number]: number } = {};
for (const row of upvoteCountsResult.rows) {
  upvoteCountsMap[row.topic_id] = parseInt(row.count, 10);
}


    const topicIds = topicsResult.rows.map((t) => t.id);
    let commentsResult = { rows: [] as any[] };

    if (topicIds.length > 0) {
      commentsResult = await query(
        `SELECT c.*, u.name AS user_name
         FROM discussion_comments c
         JOIN users u ON c.user_id = u.id
         WHERE c.topic_id = ANY($1::int[])
         ORDER BY c.created_at ASC`,
        [topicIds]
      );
    }

    const commentsByTopicId: { [key: number]: any[] } = {};
    for (const comment of commentsResult.rows) {
      if (!commentsByTopicId[comment.topic_id]) {
        commentsByTopicId[comment.topic_id] = [];
      }
      commentsByTopicId[comment.topic_id].push(comment);
    }

    // Fetch likes and follows by the current user
    const likesResult = await query(
      "SELECT topic_id FROM discussion_likes WHERE user_id = $1",
      [userId]
    );
    const followsResult = await query(
      "SELECT topic_id FROM discussion_follows WHERE user_id = $1",
      [userId]
    );

    const likedTopicIds = new Set(likesResult.rows.map((r) => r.topic_id));
    const followedTopicIds = new Set(followsResult.rows.map((r) => r.topic_id));

    const enrichedTopics = topicsResult.rows.map((topic) => ({
      id: topic.id,
      topic: topic.topic,
      createdAt: topic.created_at,
      author: topic.author_name,
      likes: topic.likes || 0,
      shares: topic.shares || 0,
      liked: likedTopicIds.has(topic.id),
      followed: followedTopicIds.has(topic.id),
      comments: commentsByTopicId[topic.id] || [],
    }));

    res.json(enrichedTopics);
  })
);


// -------- Get user by ID (protected) --------
//-- Before new edit profile
/* app.get(
  "/users/:id",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id, 10);

    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const result = await query(
      `SELECT id, name, email, title, university, major, experience_level, skills, company,
        courses_completed, country, birthdate, volunteering_work, projects_completed, photo_url
      FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  })
);*/
app.get(
  "/users/:id",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id, 10);

    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Authorization check: allow only the user themselves or admins
    if (req.user!.userId !== userId && !req.user!.isAdmin) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const result = await query(
      `SELECT id, name, email, title, university, major, experience_level, skills, company,
        courses_completed, country, state, city, birthdate, volunteering_work, projects_completed, photo_url
      FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  })
);





//---------Join- leave Circles logic------------------
app.post(
  "/study-circles/:id/join",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const circleId = parseInt(req.params.id, 10);

    if (!userId || isNaN(circleId)) {
      return res.status(400).json({ error: "Invalid user or circle ID" });
    }

    // Check if user is already a member
    const check = await query(
      "SELECT * FROM study_circle_members WHERE user_id = $1 AND circle_id = $2",
      [userId, circleId]
    );

    if (check.rows.length > 0) {
      // Already a member — so remove (leave)
      await query(
        "DELETE FROM study_circle_members WHERE user_id = $1 AND circle_id = $2",
        [userId, circleId]
      );
      return res.json({ joined: false });
    } else {
      // Not a member — so join
      await query(
        "INSERT INTO study_circle_members (user_id, circle_id) VALUES ($1, $2)",
        [userId, circleId]
      );
      return res.json({ joined: true });
    }
  })
);

// --------DELETE study circle by creator--------------
app.delete("/study-circles/:id", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const circleId = parseInt(req.params.id, 10);
    const result = await query("SELECT user_id FROM study_circles WHERE id = $1", [circleId]);


    if (result.rows.length === 0) {
      
      res.status(404).json({ error: "Circle not found" });
      return;
    }

    const created_by = result.rows[0].user_id;

    console.log("🔍 Created by:", created_by, "| Requesting userId:", userId, "| Typeof:", typeof created_by, typeof userId);
if (Number(created_by) !== Number(userId)) {

      console.log("❌ Not authorized - user is not creator");
      res.status(403).json({ error: "Not authorized to delete this circle" });
      return;
    }

    await query("DELETE FROM study_circle_members WHERE circle_id = $1", [circleId]);
    await query("DELETE FROM circle_messages WHERE circle_id = $1", [circleId]);
    await query("DELETE FROM study_circles WHERE id = $1", [circleId]);

    console.log("✅ Circle deleted");
    res.status(200).json({ message: "Circle deleted successfully." });
  } catch (err) {
    console.error("🔥 Error deleting circle:", err);
    res.status(500).json({ error: "Failed to delete circle" });
  }
});
//---------------------------------------------------------------------------------

//---------PitchPoint Video---------
// GET /api/videos - list all videos with counts

// GET /api/videos - list all videos with counts
app.get(
  "/api/videos",
  asyncHandler(async (req, res) => {
    const videosRes = await query(`
      SELECT 
        v.id,
        v.user_id,
        v.title,
        v.description,
        v.video_url,
        v.category,
        COALESCE(l.likes_count, 0) AS likes,
        COALESCE(f.follows_count, 0) AS follows,
        COALESCE(v.share_count, 0) AS shares
      FROM pitchpoint_videos v
      LEFT JOIN (
        SELECT video_id, COUNT(*) AS likes_count
        FROM pitchpoint_video_likes
        GROUP BY video_id
      ) l ON v.id = l.video_id
      LEFT JOIN (
        SELECT video_id, COUNT(*) AS follows_count
        FROM pitchpoint_video_follows
        GROUP BY video_id
      ) f ON v.id = f.video_id
      ORDER BY v.created_at DESC;
    `);
    res.json(videosRes.rows);
  })
);


// POST /api/videos - add new video
app.post(
  "/api/videos",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { title, description, video_url, category } = req.body;
    const userId = req.user?.userId;

    if (!title || !video_url) {
      res.status(400).json({ error: "Title and video_url are required" });
      return;
    }

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const insertRes = await query(
      `INSERT INTO pitchpoint_videos (user_id, title, description, video_url, category, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *`,
      [userId, title, description || null, video_url, category || null]
    );

    res.status(201).json(insertRes.rows[0]);
  })
);



// POST /api/videos/:id/like - toggle like
// POST /api/videos/:id/like - toggle like
app.post(
  "/api/videos/:id/like",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const videoId = parseInt(req.params.id);
    const userId = req.user?.userId;
    const { liked } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (typeof liked !== "boolean") {
      res.status(400).json({ error: "liked must be boolean" });
      return;
    }

    if (liked) {
      await query(
        `INSERT INTO pitchpoint_video_likes (video_id, user_id, liked_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (video_id, user_id) DO NOTHING`,
        [videoId, userId]
      );
    } else {
      await query(
        `DELETE FROM pitchpoint_video_likes WHERE video_id = $1 AND user_id = $2`,
        [videoId, userId]
      );
    }

    const likesRes = await query(
      `SELECT COUNT(*) FROM pitchpoint_video_likes WHERE video_id = $1`,
      [videoId]
    );

    res.json({
      likes: parseInt(likesRes.rows[0].count, 10),
      likedByUser: liked,
    });
  })
);

// POST /api/videos/:id/follow - toggle follow
app.post(
  "/api/videos/:id/follow",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const videoId = parseInt(req.params.id);
    const userId = req.user?.userId;
    const { followed } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (typeof followed !== "boolean") {
      res.status(400).json({ error: "followed must be boolean" });
      return;
    }

    if (followed) {
      await query(
        `INSERT INTO pitchpoint_video_follows (video_id, user_id, followed_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (video_id, user_id) DO NOTHING`,
        [videoId, userId]
      );
    } else {
      await query(
        `DELETE FROM pitchpoint_video_follows WHERE video_id = $1 AND user_id = $2`,
        [videoId, userId]
      );
    }

    const followsRes = await query(
      `SELECT COUNT(*) FROM pitchpoint_video_follows WHERE video_id = $1`,
      [videoId]
    );

    res.json({
      follows: parseInt(followsRes.rows[0].count, 10),
      followedByUser: followed,
    });
  })
);

// POST /api/videos/:id/share - register share (increment count)
app.post(
  "/api/videos/:id/share",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const videoId = parseInt(req.params.id);
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await query(
      `UPDATE pitchpoint_videos SET share_count = COALESCE(share_count, 0) + 1, updated_at = NOW() WHERE id = $1`,
      [videoId]
    );

    const sharesRes = await query(
      `SELECT COALESCE(share_count, 0) AS shares FROM pitchpoint_videos WHERE id = $1`,
      [videoId]
    );

    res.json({ shares: sharesRes.rows[0].shares });
  })
);


app.post(
  "/api/upload-video",
  authenticateToken,
  uploadMemory.single("file"),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const streamUpload = () => {
      return new Promise<{ secure_url: string }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: "video",
            folder: "ypropel-videos",
          },
          (error, result) => {
            if (error || !result) {
              reject(error || new Error("Upload failed"));
            } else {
              resolve(result);
            }
          }
        );

        // Here add non-null assertion to assure TypeScript req.file is defined
        stream.end(req.file!.buffer);
      });
    };

    try {
      const uploadResult = await streamUpload();
      res.json({ videoUrl: uploadResult.secure_url });
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      res.status(500).json({ error: "Failed to upload video" });
    }
  })
);
// DELETE /api/videos/:id - delete a video if owned by the authenticated user
app.delete(
  "/api/videos/:id",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const videoId = parseInt(req.params.id);
    //const userId = (req as any).user.id;
const userId = req.user?.userId;
    // Verify video exists and is owned by user
    const videoRes = await query("SELECT user_id FROM pitchpoint_videos WHERE id = $1", [videoId]);
    if (videoRes.rowCount === 0) {
      return res.status(404).json({ error: "Video not found" });
    }
    if (videoRes.rows[0].user_id !== userId) {
      return res.status(403).json({ error: "Not authorized to delete this video" });
    }

    // Delete video
    await query("DELETE FROM pitchpoint_videos WHERE id = $1", [videoId]);

    res.json({ success: true });
  })
);


//-------------------Universities ---------------------------------------
//------- get universities list to public 
app.get("/api/universities", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    const state = req.query.state as string;

    let baseQuery = `FROM universities WHERE country='United States'`;
    const queryParams: any[] = [];

    if (state && state !== "") {
      queryParams.push(state);
      baseQuery += ` AND state = $${queryParams.length}`;
    }

    // Get total count
    const countResult = await query(`SELECT COUNT(*) ${baseQuery}`, queryParams);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    // Get current page results
    queryParams.push(limit);
    queryParams.push(offset);
    const dataResult = await query(
      `SELECT id, title, website, description, country, state, city ${baseQuery} ORDER BY state LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`,
      queryParams
    );

    res.json({ totalCount, universities: dataResult.rows });
  } catch (error) {
    console.error("Error fetching universities:", error);
    res.status(500).json({ error: "Failed to fetch universities" });
  }
});
//-- Create routes to search universities by name & description
app.get("/api/universities/search", async (req, res) => {
  console.log("Search universities route hit");
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    const state = req.query.state as string | undefined;
    const name = (req.query.name as string | undefined)?.trim();
    const knownFor = (req.query.known_for as string | undefined)?.trim();

    let baseQuery = `
      SELECT id, title, website, description, country, state, city
      FROM universities
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (state && state !== "") {
      baseQuery += ` AND state = $${paramIndex++}`;
      params.push(state);
    }
    if (name && name !== "") {
      baseQuery += ` AND LOWER(title) LIKE LOWER($${paramIndex++})`;
      params.push(`%${name}%`);
    }
    if (knownFor && knownFor !== "") {
      baseQuery += ` AND LOWER(description) LIKE LOWER($${paramIndex++})`;
      params.push(`%${knownFor}%`);
    }

    // Count total matching rows for pagination
    const countQuery = `SELECT COUNT(*) FROM (${baseQuery}) AS sub`;
    const countResult = await pool.query(countQuery, params);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    baseQuery += ` ORDER BY title ASC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const dataResult = await pool.query(baseQuery, params);

    res.json({
      totalCount,
      universities: dataResult.rows,
    });
  } catch (error) {
    console.error("Error fetching universities (search):", error);
    res.status(500).json({ error: "Internal server error" });
  }
});



//----------------------------

//-------------------trade schools ---------------------------------------
// get schools list to public 

// GET /trade-schools/states - get distinct states
app.get(
  "/trade-schools/states",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await query("SELECT DISTINCT state FROM trade_schools ORDER BY state ASC");
    const states = result.rows.map((row) => row.state);
    res.json(states);
  })
);

// GET /trade-schools - paginated list with optional state filter
app.get(
  "/trade-schools",
  asyncHandler(async (req: Request, res: Response) => {
    const { state, page = "1", limit = "20" } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    let baseQuery = "SELECT * FROM trade_schools";
    const params: any[] = [];
    let whereClause = "";

    if (state) {
      params.push(state);
      whereClause = ` WHERE state = $${params.length}`;
    }

    const paginatedQuery = `${baseQuery}${whereClause} ORDER BY title ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limitNum, offset);

    const result = await query(paginatedQuery, params);

    const countQuery = `SELECT COUNT(*) FROM trade_schools${whereClause}`;
    const countResult = await query(countQuery, state ? [state] : []);

    res.json({
      tradeSchools: result.rows,
      total: parseInt(countResult.rows[0].count, 10),
      page: pageNum,
      limit: limitNum,
    });
  })
);

//-------music schools----------

// GET /music-majors — fetch all music majors
app.get('/music-majors', asyncHandler(async (req, res) => {
  const result = await query(`
    SELECT id, title, description, top_universities, cover_photo_url 
    FROM music_majors
    ORDER BY title ASC
  `);
  res.json(result.rows);
}));

//----------------Pre-college summer programs---------------
//---------return all summer programs to the frontend:-----
app.get("/summer-programs", async (req: Request, res: Response) => {
  try {
    const result = await query("SELECT * FROM pre_college_summer_programs ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching summer programs:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
//-------------Create Freelance page Routes----------
//---Allow members to post freelance service
app.post(
  "/freelance-services",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const {
      name,
      description,
      about,
      service_type,
      other_service,  // New field added here
      state,
      city,
      location,
      rate,
      email,
      website,
      gallery,
    } = req.body;

    if (!name) return res.status(400).json({ error: "Service name is required" });

    const galleryJson = gallery ? JSON.stringify(gallery) : null;

    const result = await query(
      `INSERT INTO freelance_services
      (member_id, name, description, about, service_type, other_service, state, city, rate, email, website, gallery)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *`,
      [userId, name, description, about, service_type, other_service, state, city, rate, email, website, galleryJson]
    );

    res.status(201).json(result.rows[0]);
  })
);

//-------------Get All Freelance Services (public)-----------------
app.get(
  "/freelance-services",
  asyncHandler(async (_req: Request, res: Response) => {
    const result = await query(
      `SELECT fs.id, fs.member_id, fs.name, fs.description, fs.about, fs.service_type, fs.other_service, fs.state, fs.city, fs.rate, fs.email, fs.website, fs.gallery, fs.created_at, fs.updated_at,
              u.photo_url AS profile_photo
       FROM freelance_services fs
       LEFT JOIN users u ON fs.member_id = u.id
       ORDER BY fs.created_at DESC`
    );

    const services = result.rows.map((r) => ({
      ...r,
      gallery: r.gallery ? JSON.parse(r.gallery) : [],
    }));

    res.json(services);
  })
);

//--------get services dropdown list
app.get(
  "/service-types",
  asyncHandler(async (_req: Request, res: Response) => {
    const result = await query("SELECT id, name FROM service_types ORDER BY name");
    res.json(result.rows);
  })
);

//--------Get Current User's Freelance Services so users can handle thier own listing----------------
app.get(
  "/freelance-services/mine",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    const result = await query(
      `SELECT fs.*, u.photo_url AS profile_photo
       FROM freelance_services fs
       JOIN users u ON fs.member_id = u.id
       WHERE fs.member_id = $1
       ORDER BY fs.created_at DESC`,
      [userId]
    );

    const services = result.rows.map((r) => ({
      ...r,
      gallery: r.gallery ? JSON.parse(r.gallery) : [],
    }));

    res.json(services);
  })
);


//-------------Update Freelance Service (owner only)-----------------
//------------- Update Freelance Service (owner only) -------------
app.put(
  "/freelance-services/:id",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const isAdmin = req.user?.isAdmin;

    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid service ID" });

    // Verify ownership or admin
    const serviceResult = await query("SELECT * FROM freelance_services WHERE id = $1", [id]);
    if (serviceResult.rows.length === 0) return res.status(404).json({ error: "Service not found" });

    if (serviceResult.rows[0].member_id !== userId && !isAdmin) {
      return res.status(403).json({ error: "Forbidden: Not your service" });
    }

    const {
      name,
      description,
      about,
      service_type,
      other_service, // New field added here
      state,
      city,
      location,
      rate,
      email,
      website,
      gallery,
    } = req.body;

    if (!name) return res.status(400).json({ error: "Service name is required" });

    const galleryJson = gallery ? JSON.stringify(gallery) : null;

    await query(
      `UPDATE freelance_services SET
        name=$1,
        description=$2,
        about=$3,
        service_type=$4,
        other_service=$5,
        state=$6,
        city=$7,
        location=$8,
        rate=$9,
        email=$10,
        website=$11,
        gallery=$12,
        updated_at=NOW()
      WHERE id=$13`,
      [
        name,
        description,
        about,
        service_type,
        other_service,
        state,
        city,
        location,
        rate,
        email,
        website,
        galleryJson,
        id,
      ]
    );

    res.json({ message: "Service updated successfully" });
  })
);

//------------- Delete Freelance Service (owner only) -------------
app.delete(
  "/freelance-services/:id",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const isAdmin = req.user?.isAdmin;

    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid service ID" });

    // Verify ownership or admin
    const serviceResult = await query("SELECT * FROM freelance_services WHERE id = $1", [id]);
    if (serviceResult.rows.length === 0) return res.status(404).json({ error: "Service not found" });

    if (serviceResult.rows[0].member_id !== userId && !isAdmin) {
      return res.status(403).json({ error: "Forbidden: Not your service" });
    }

    await query("DELETE FROM freelance_services WHERE id = $1", [id]);

    res.json({ message: "Service deleted successfully" });
  })
);

//-----------Upload resume Page routes---------------
app.post(
  "/members/resumes",
  authenticateToken,
  uploadMemory.single("resume"),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    if (!req.file) {
      return res.status(400).json({ error: "Resume file is required" });
    }

    try {
      // Convert buffer to base64 string with data URI prefix
      const base64Str = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

      // Upload to Cloudinary as raw resource using base64 string
      const uploadResult = await cloudinary.uploader.upload(base64Str, {
        resource_type: "raw",
        folder: "ypropel/resumes",
      });

      //--- save reusme also in users table in resume field
      // Update user's resume URL in users table
          await query(
            `UPDATE users SET resume_url = $1 WHERE id = $2`,
             [uploadResult.secure_url, userId]
            );
//-----------

      // Fetch user profile
      const userProfileRes = await query(
        `SELECT name, email, title, university, major, experience_level, skills, company, courses_completed, country, birthdate, volunteering_work, projects_completed FROM users WHERE id = $1`,
        [userId]
      );

      if (userProfileRes.rows.length === 0) {
        return res.status(404).json({ error: "User profile not found" });
      }

      const profile = userProfileRes.rows[0];

      // Insert resume record in DB
      const insertResult = await query(
        `INSERT INTO members_resumes (
          member_id, resume_url, file_name, file_size, member_name, member_email,
          member_title, member_university, member_major, member_experience_level,
          member_skills, member_company, member_courses_completed, member_country,
          member_birthdate, member_volunteering_work, member_projects_completed
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10,
          $11, $12, $13, $14,
          $15, $16, $17
        ) RETURNING *`,
        [
          userId,
          uploadResult.secure_url,
          req.file.originalname,
          req.file.size,
          profile.name,
          profile.email,
          profile.title,
          profile.university,
          profile.major,
          profile.experience_level,
          profile.skills,
          profile.company,
          profile.courses_completed,
          profile.country,
          profile.birthdate,
          profile.volunteering_work,
          profile.projects_completed,
        ]
      );

      res.status(201).json(insertResult.rows[0]);
    } catch (error) {
      console.error("Upload resume error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  })
);
//-------display user's resumes 
// GET /members/resumes - get all resumes for logged-in user
app.get(
  "/members/resumes",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const result = await query(
      `SELECT id, resume_url, file_name, file_size, created_at
       FROM members_resumes
       WHERE member_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  })
);
//-------Delete user's resumes
// DELETE /members/resumes/:id - delete a resume by ID
app.delete(
  "/members/resumes/:id",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const resumeId = parseInt(req.params.id, 10);

    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (isNaN(resumeId)) return res.status(400).json({ error: "Invalid resume ID" });

    // Verify resume ownership
    const resumeRes = await query(
      `SELECT member_id FROM members_resumes WHERE id = $1`,
      [resumeId]
    );
    if (resumeRes.rows.length === 0) {
      return res.status(404).json({ error: "Resume not found" });
    }
    if (resumeRes.rows[0].member_id !== userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Delete resume record
    await query(`DELETE FROM members_resumes WHERE id = $1`, [resumeId]);
    res.json({ message: "Resume deleted successfully" });
  })
);

//---------------HERE Starts Admin backend functions----------
//----------------------------------------------------------------------------------
//-------AdminNews Delete Route--- Delete news and updates news

/*---before new edit profile
app.delete("/admin/news/:id", (req: Request, res: Response) => {
  (async () => {
    
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      if (!decoded.is_admin) {
        return res.status(403).json({ error: "Access denied. Admins only." });
      }

      const newsId = parseInt(req.params.id);
      if (isNaN(newsId)) {
        return res.status(400).json({ error: "Invalid news ID" });
      }

      await query("DELETE FROM news WHERE id = $1", [newsId]);
      res.json({ message: "News item deleted successfully" });
    } catch (err) {
      console.error("Error deleting news:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  })();
}); */

app.delete("/admin/news/:id", authenticateToken, asyncHandler(async (req, res) => {
  // Check admin rights via req.user.isAdmin, no need to decode JWT again
  console.log("req.user in DELETE:", req.user);
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: "Access denied. Admins only." });
  }

  const newsId = parseInt(req.params.id);
  if (isNaN(newsId)) {
    return res.status(400).json({ error: "Invalid news ID" });
  }

  await query("DELETE FROM news WHERE id = $1", [newsId]);
  res.json({ message: "News item deleted successfully" });
}));



//------------Pre college summer programs Admin routes------------
//----Add pre-college-summer program by Admin---
// Admin-only: Add a new summer program
app.get("/admin/test", (req, res) => {
  res.json({ msg: "Admin routes are working!" });
});


app.post("/admin/summer-programs", async (req: Request, res: Response) => {
  const {
    title,
    description,
    cover_photo_url,
    program_type,
    is_paid,
    price,
    location,
    program_url, // ✅ Add this line
  } = req.body;

  try {
    console.log("Backend received:", {
  title,
  cover_photo_url,
});

   await query(
  `
  INSERT INTO pre_college_summer_programs
  (title, description, program_type, cover_photo_url, is_paid, price, location, program_url)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `,
  [title, description, program_type, cover_photo_url, is_paid, price, location, program_url]
);

    res.status(201).json({ message: "Program added successfully" });
  } catch (err) {
    console.error("Error adding program:", err);
    res.status(500).json({ error: "Server error" });
  }
});

//-------------Delete pre-college summer program by Admin------
/*--- before new edit profile
// ✅ Delete a summer program (admin only)
app.delete("/admin/summer-programs/:id", (req: Request, res: Response) => {
  (async () => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
     const isAdmin = decoded.isAdmin ?? decoded.is_admin;
if (!isAdmin) {
  return res.status(403).json({ error: "Access denied. Admins only." });
}


      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

      await query("DELETE FROM pre_college_summer_programs WHERE id = $1", [id]);

      res.json({ message: "Summer program deleted successfully" });
    } catch (err) {
      console.error("Error deleting summer program:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  })();
});*/
app.delete(
  "/admin/summer-programs/:id",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    await query("DELETE FROM pre_college_summer_programs WHERE id = $1", [id]);

    res.json({ message: "Summer program deleted successfully" });
  })
);


//-----------------
//----- get precollege summer program category for the Admin drop down list
app.get("/program-types", async (req: Request, res: Response) => {
  try {
    const result = await query("SELECT * FROM program_types ORDER BY name ASC");
    res.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch program types", err);
    res.status(500).json({ error: "Server error" });
  }
});

//------------------------------
app.post ( 
  "/admin/program-types", 
  authenticateToken, asyncHandler (async (req: Request, res: Response)=>  { 
 
 
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Type name is required" });
  }

  try {
    const result = await query(
      "INSERT INTO program_types (name) VALUES ($1) RETURNING *",
      [name.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.code === "23505") {
      return res.status(400).json({ error: "This type already exists" });
    }
    console.error("Failed to add program type", err);
    res.status(500).json({ error: "Server error" });
  }
}));

//-------------Add job fair by Admin------------------
// ✅ POST /admin/job-fairs - Add a new job fair
app.post(
  "/admin/job-fairs",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const {
      title,
      description,
      location_state,
      location_city,
      start_datetime,
      website,
      cover_photo_url,
    } = req.body;

    const location = `${location_state} - ${location_city}`;

    if (!title || !location_state || !location_city || !start_datetime || !cover_photo_url) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const result = await query(
        `
        INSERT INTO job_fairs
        (title, description, location, start_datetime, website, cover_image_url)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
        `,
        [title, description, location, start_datetime, website, cover_photo_url]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error("❌ Failed to add job fair:", err);
      res.status(500).json({ error: "Server error" });
    }
  })
);

//----------------------------------------------
// ✅ GET /job-fairs - Public route
app.get("/job-fairs", async (req: Request, res: Response) => {
  try {
    const result = await query(
      "SELECT * FROM job_fairs ORDER BY start_datetime DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch job fairs:", err);
    res.status(500).json({ error: "Server error" });
  }
});


//--------get US states and cities for Job fair drop down list in for Admin

// ✅ GET /us-states
app.get("/us-states", async (req: Request, res: Response) => {
  try {
    const result = await query("SELECT name FROM us_states ORDER BY name ASC");
    res.json(result.rows.map((r) => r.name));
  } catch (err) {
    console.error("Failed to fetch states:", err);
    res.status(500).json({ error: "Server error" });
  }
});

//----------Get job-fair cities for the selected states to display on the dropdown-----
// ✅ GET /us-cities?state=Texas
app.get(
  "/us-cities",
  asyncHandler(async (req: Request, res: Response) => {
    const stateName = req.query.state as string;

    if (!stateName || !stateName.trim()) {
      return res.status(400).json({ error: "Missing or invalid state name" });
    }

               // Get the ID of the state
    const stateResult = await query(
      "SELECT id FROM us_states WHERE name = $1",
      [stateName.trim()]
    );

    if (stateResult.rows.length === 0) {
      return res.status(404).json({ error: "State not found" });
    }

    const stateId = stateResult.rows[0].id;

    // Get cities with that state_id
    const cityResult = await query(
      "SELECT name FROM us_cities WHERE state_id = $1 ORDER BY name ASC",
      [stateId]
    );

    const cities = cityResult.rows.map((row) => row.name);
    res.json(cities);
  })
);

//---------Get countries for drop downlist 
app.get("/countries", async (req: Request, res: Response) => {
  try {
    // Select distinct countries from the us_states table (or us_cities)
    const result = await query("SELECT DISTINCT country FROM us_states ORDER BY country ASC");
    const countries = result.rows.map((r) => r.country);
    res.json(countries);
  } catch (err) {
    console.error("Failed to fetch countries:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET all mini courses (public, with optional category filter)
app.get(
  "/mini-courses",
  asyncHandler(async (req: Request, res: Response) => {
    const { category } = req.query;
    let sql = "SELECT * FROM mini_courses";
    const params: any[] = [];

    if (category) {
      sql += " WHERE category = $1";
      params.push(category);
    }

    const result = await query(sql, params);
    res.json(result.rows);
  })
);

// GET mini course by ID (public)
app.get(
  "/mini-courses/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid course ID" });

    const result = await query("SELECT * FROM mini_courses WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.json(result.rows[0]);
  })
);

// POST create a new mini course (admin only)
app.post(
  "/mini-courses",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.isAdmin) return res.status(403).json({ error: "Admins only" });

    const {
      title,
      description,
      brief,               // <-- added here
      author_id,
      price,
      category,
      duration,
      content_url,
      cover_photo_url,
    } = req.body;

    if (!title) return res.status(400).json({ error: "Title is required" });

    const sql = `
      INSERT INTO mini_courses
      (title, description, brief, author_id, price, category, duration, content_url, cover_photo_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;

    const values = [
      title,
      description || null,
      brief || null,        // <-- added here
      author_id || null,
      price || null,
      category || null,
      duration || null,
      content_url || null,
      cover_photo_url || null,
    ];

    const result = await query(sql, values);
    res.status(201).json(result.rows[0]);
  })
);

// PUT update a mini course (admin only)
app.put(
  "/mini-courses/:id",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.isAdmin) return res.status(403).json({ error: "Admins only" });

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid course ID" });

    const existing = await query("SELECT * FROM mini_courses WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Course not found" });
    }

    const {
      title,
      description,
      brief,               // <-- added here
      author_id,
      price,
      category,
      duration,
      content_url,
      cover_photo_url,
    } = req.body;

    const sql = `
      UPDATE mini_courses SET
        title = $1,
        description = $2,
        brief = $3,          -- <-- added here
        author_id = $4,
        price = $5,
        category = $6,
        duration = $7,
        content_url = $8,
        cover_photo_url = $9
      WHERE id = $10
      RETURNING *;
    `;

    const values = [
      title || existing.rows[0].title,
      description || existing.rows[0].description,
      brief || existing.rows[0].brief,         // <-- added here
      author_id || existing.rows[0].author_id,
      price || existing.rows[0].price,
      category || existing.rows[0].category,
      duration || existing.rows[0].duration,
      content_url || existing.rows[0].content_url,
      cover_photo_url || existing.rows[0].cover_photo_url,
      id,
    ];

    const result = await query(sql, values);
    res.json(result.rows[0]);
  })
);

// DELETE a mini course (admin only)
app.delete(
  "/mini-courses/:id",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.isAdmin) return res.status(403).json({ error: "Admins only" });

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid course ID" });

    const existing = await query("SELECT * FROM mini_courses WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Course not found" });
    }

    await query("DELETE FROM mini_courses WHERE id = $1", [id]);
    res.json({ message: "Course deleted successfully" });
  })
);

//-----------------Jobs-------------------
//-----------Job positng for Admin----------
//------------------
//------- Get all job categories for admin page cateogey drop-down list
app.get(
  "/admin/job-categories",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.isAdmin) return res.status(403).json({ error: "Admins only" });
    const result = await query("SELECT id, name FROM job_categories ORDER BY name");
    res.json(result.rows);
  })
);

// Add new job category to the job category dropdown list from Admin frontend
app.post(
  "/admin/job-categories",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.isAdmin) return res.status(403).json({ error: "Admins only" });
    const { name } = req.body;
    if (!name || name.trim() === "") return res.status(400).json({ error: "Name is required" });
    try {
      const result = await query(
        "INSERT INTO job_categories (name) VALUES ($1) RETURNING id, name",
        [name.trim()]
      );
      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      if (error.code === "23505") {
        // unique_violation
        return res.status(409).json({ error: "Category already exists" });
      }
      throw error;
    }
  })
);
//--- delete job category from the admin job category drop down list
app.delete(
  "/admin/job-categories/:id",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admins only" });
    }

    const { id } = req.params;

    // Optionally check if category is in use before deletion

    const result = await query("DELETE FROM job_categories WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json({ message: "Category deleted successfully" });
  })
);

//------------------

// Create job posting (admin only)
const ALLOWED_LOCATIONS = ["Remote", "Onsite", "Hybrid"];
app.post(
  "/admin/jobs",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admins only" });
    }

    const {
      title,
      description,
      category,
      company,
      location,
      requirements,
      apply_url,
      salary,
      is_active,
      expires_at,
        job_type,  
        country,
      state,
      city,
    } = req.body;

    const posted_by = req.user.userId;
   
    if (location && !ALLOWED_LOCATIONS.includes(location)) {
      return res.status(400).json({ error: "Invalid location value. Allowed: Remote, Onsite, Hybrid" });
    }
    // Convert empty or whitespace-only expires_at to null
    const expiresAtValue = expires_at && expires_at.trim() !== "" ? expires_at : null;

    const result = await query(
      `INSERT INTO jobs
        (title, description, category, company, location, requirements, apply_url, salary, posted_by, posted_at, is_active, expires_at, job_type, country, state, city)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,CURRENT_TIMESTAMP,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        title,
        description,
        category,
        company,
        location,
        requirements,
        apply_url,
        salary,
        posted_by,
        is_active ?? true,
        expiresAtValue,
        job_type || 'entry_level',
        country,
        state,
        city,
        
      ]
    );

    res.status(201).json(result.rows[0]);
  })
);

// Admin: Get all jobs (admin only)
app.get(
  "/admin/jobs",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admins only" });
    }

    const result = await query(
      "SELECT * FROM jobs ORDER BY posted_at DESC"
    );

    res.json(result.rows);
  })
);
//---- edit job post by Admin only
app.put(
  "/admin/jobs/:id",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admins only" });
    }

    const { id } = req.params;
    const {
      title,
      description,
      category,
      company,
      location,
      requirements,
      apply_url,
      salary,
      is_active,
      expires_at,
      job_type,
      country,
      state,
      city,
    } = req.body;

     if (location && !ALLOWED_LOCATIONS.includes(location)) {
      return res.status(400).json({ error: "Invalid location value. Allowed: Remote, Onsite, Hybrid" });
    }

    // Convert empty or whitespace-only expires_at to null
    const expiresAtValue = expires_at && expires_at.trim() !== "" ? expires_at : null;

    const result = await query(
      `UPDATE jobs SET
        title=$1,
        description=$2,
        category=$3,
        company=$4,
        location=$5,
        requirements=$6,
        apply_url=$7,
        salary=$8,
        is_active=$9,
        expires_at=$10,
        job_type=$11,
        country=$12,
        state=$13,
        city=$14
      WHERE id=$15
      RETURNING *`,
      [
        title,
        description,
        category,
        company,
        location,
        requirements,
        apply_url,
        salary,
        is_active,
        expiresAtValue,
        job_type,
        country,
        state,
        city,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json(result.rows[0]);
  })
);


// Delete job posting (admin only)
app.delete(
  "/admin/jobs/:id",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admins only" });
    }

    const { id } = req.params;

    const result = await query("DELETE FROM jobs WHERE id=$1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json({ message: "Job deleted successfully" });
  })
);

// Public: Get all active jobs for users
// Public: Get all active jobs, optionally filtered by job_type
app.get(
  "/jobs",
  asyncHandler(async (req: Request, res: Response) => {
    const { job_type, country, state, city, category } = req.query;

    let queryStr = "SELECT * FROM jobs WHERE is_active = TRUE";
    const params: any[] = [];
    
    if (job_type) {
      params.push(job_type);
      queryStr += ` AND job_type = $${params.length}`;
    }
    if (country) {
      params.push(country);
      queryStr += ` AND country = $${params.length}`;
    }
    if (state) {
      params.push(state);
      queryStr += ` AND state = $${params.length}`;
    }
    if (city) {
      params.push(city);
      queryStr += ` AND city = $${params.length}`;
    }
    if (category) {
      params.push(category);
      queryStr += ` AND category = $${params.length}`;
    }

    queryStr += " ORDER BY posted_at DESC";

    const result = await query(queryStr, params);
    res.json(result.rows);
  })
);
//--------get job categories for the fitler drop down for public 
app.get(
  "/job-categories",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await query("SELECT id, name FROM job_categories ORDER BY name");
    res.json(result.rows);
  })
);


//---------------------
//----------Delete Job Fairs by Admin

// ✅ DELETE /admin/job-fairs/:id
/* ----before new edit profile
app.delete(
  "/admin/job-fairs/:id",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (!decoded.is_admin && !decoded.isAdmin) {
      return res.status(403).json({ error: "Admins only" });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    try {
      await query("DELETE FROM job_fairs WHERE id = $1", [id]);
      res.json({ message: "Job fair deleted successfully" });
    } catch (err) {
      console.error("Failed to delete job fair:", err);
      res.status(500).json({ error: "Server error" });
    }
  })
); */
app.delete(
  "/admin/job-fairs/:id",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admins only" });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    try {
      await query("DELETE FROM job_fairs WHERE id = $1", [id]);
      res.json({ message: "Job fair deleted successfully" });
    } catch (err) {
      console.error("Failed to delete job fair:", err);
      res.status(500).json({ error: "Server error" });
    }
  })
);

//--------------------------------------
//-------Add articles by Admin backend
// POST /admin/articles — Create a new article (admin only)
/* -- Before new edit profile 

app.get(
  "/admin/articles",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded: any = jwt.verify(token, JWT_SECRET as string);
    if (!decoded.is_admin) return res.status(403).json({ error: "Admins only" });

    const result = await query(
      "SELECT id, title, content, cover_image, author_id, published_at FROM articles ORDER BY published_at DESC"
    );

    res.json(result.rows);
  })
);  */

app.get(
  "/admin/articles",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admins only" });
    }

    const result = await query(
      "SELECT id, title, content, cover_image, author_id, published_at FROM articles ORDER BY published_at DESC"
    );

    res.json(result.rows);
  })
);

//------  Admin post articles
//-- before new edit profile non - but orignal missed
app.post(
  "/admin/articles",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admins only" });
    }

    const { title, content, cover_image } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    const result = await query(
      `INSERT INTO articles (title, content, cover_image, author_id, published_at)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
      [title, content, cover_image || null, req.user.userId]
    );

    res.status(201).json(result.rows[0]);
  })
);

//--------Add added articles lists to admin page so they can edit and delete
/* before edit  new profile 
app.put(
  "/admin/articles/:id",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const articleId = parseInt(req.params.id);
    if (isNaN(articleId)) {
      return res.status(400).json({ error: "Invalid article ID" });
    }

    const { title, content, cover_image } = req.body;

    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded: any = jwt.verify(token, JWT_SECRET as string);
    if (!decoded.is_admin) return res.status(403).json({ error: "Admins only" });

    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    await query(
      `UPDATE articles
       SET title = $1, content = $2, cover_image = $3, updated_at = NOW()
       WHERE id = $4`,
      [title, content, cover_image || null, articleId]
    );

    res.json({ message: "✅ Article updated successfully" });
  })
);*/

app.put(
  "/admin/articles/:id",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const articleId = parseInt(req.params.id);
    if (isNaN(articleId)) {
      return res.status(400).json({ error: "Invalid article ID" });
    }

    const { title, content, cover_image } = req.body;

    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admins only" });
    }

    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    await query(
      `UPDATE articles
       SET title = $1, content = $2, cover_image = $3, updated_at = NOW()
       WHERE id = $4`,
      [title, content, cover_image || null, articleId]
    );

    res.json({ message: "✅ Article updated successfully" });
  })
);

//-----Allow admin delete articles 
/* before eedit new profile---
app.delete(
  "/admin/articles/:id",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const articleId = parseInt(req.params.id);
    if (isNaN(articleId)) {
      return res.status(400).json({ error: "Invalid article ID" });
    }

    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded: any = jwt.verify(token, JWT_SECRET as string);
    if (!decoded.is_admin) return res.status(403).json({ error: "Admins only" });

    await query("DELETE FROM articles WHERE id = $1", [articleId]);

    res.json({ message: "✅ Article deleted successfully" });
  })
); */
app.delete(
  "/admin/articles/:id",
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const articleId = parseInt(req.params.id);
    if (isNaN(articleId)) {
      return res.status(400).json({ error: "Invalid article ID" });
    }

    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admins only" });
    }

    await query("DELETE FROM articles WHERE id = $1", [articleId]);

    res.json({ message: "✅ Article deleted successfully" });
  })
);



//-------Get articles grid  for articles page for frontend
app.get(
  "/articles",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await query(
      "SELECT id, title, cover_image, content FROM articles ORDER BY published_at DESC"
    );
    res.json(result.rows);
  })
);


//----------Get and display individual  article page
// GET /articles — Get all published articles

app.get("/articles/:id", asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  const result = await query("SELECT * FROM articles WHERE id = $1", [id]);
  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Article not found" });
  }

  res.json(result.rows[0]);
}));



//------------------------END of Admin BackEnd routes----------------------------
//---DB check block
(async () => {
  try {
    const result = await query("SELECT current_database();");
    console.log("Connected to DB:", result.rows[0].current_database);
  } catch (err) {
    console.error("Error checking DB:", err);
  }
})();
//-------------

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log("✅ All routes registered. Ready to receive requests.");
});
