import type { Express, RequestHandler } from "express";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { storage } from "./storage";

// Lazy-initialize Supabase client to avoid crashes at module load time
let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    const errorMsg = "Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_ANON_KEY in Vercel dashboard.";
    console.error(errorMsg);
    console.error("Available env vars:", Object.keys(process.env).filter(k => k.includes('SUPABASE')));
    throw new Error(errorMsg);
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseClient;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient();
    return (client as any)[prop];
  }
});

// Helper to get user from JWT token
async function getUserFromToken(token: string) {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) {
      console.error("Supabase auth error:", error.message);
      return null;
    }
    if (!user) {
      return null;
    }
    return user;
  } catch (error) {
    console.error("Error getting user from token:", error);
    return null;
  }
}

// Middleware to extract and verify JWT token
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.substring(7);
    const user = await getUserFromToken(token);

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Upsert user in our database
    try {
      await storage.upsertUser({
        id: user.id,
        email: user.email || "",
        firstName: user.user_metadata?.first_name || user.user_metadata?.full_name?.split(" ")[0] || "",
        lastName: user.user_metadata?.last_name || user.user_metadata?.full_name?.split(" ").slice(1).join(" ") || "",
        profileImageUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
      });
    } catch (dbError) {
      console.error("Error upserting user to database:", dbError);
      // Continue anyway - user might already exist or DB issue
      // Don't fail auth if DB sync fails
    }

    // Attach user to request
    (req as any).user = {
      id: user.id,
      email: user.email,
      claims: {
        sub: user.id,
        email: user.email,
        first_name: user.user_metadata?.first_name || user.user_metadata?.full_name?.split(" ")[0] || "",
        last_name: user.user_metadata?.last_name || user.user_metadata?.full_name?.split(" ").slice(1).join(" ") || "",
        profile_image_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
      },
    };

    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

// Setup auth routes
export async function setupAuth(app: Express) {
  // Auth endpoint to get current user (for client-side)
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      let user = await storage.getUser(userId);
      
      // If user doesn't exist in DB yet, create them from Supabase user data
      if (!user) {
        try {
          user = await storage.upsertUser({
            id: req.user.id,
            email: req.user.email || "",
            firstName: req.user.claims?.first_name || "",
            lastName: req.user.claims?.last_name || "",
            profileImageUrl: req.user.claims?.profile_image_url || null,
          });
        } catch (upsertError) {
          console.error("Error creating user in database:", upsertError);
          return res.status(500).json({ message: "Failed to create user in database" });
        }
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Session endpoint (returns Supabase session info)
  app.get("/api/auth/session", isAuthenticated, async (req: any, res) => {
    res.json({
      user: req.user,
    });
  });
}

