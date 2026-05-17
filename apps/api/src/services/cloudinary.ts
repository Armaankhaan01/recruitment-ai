import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary from environment variables with safe fallbacks
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dpey3zzge",
  api_key: process.env.CLOUDINARY_API_KEY || "", // safe fallback key
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
});

/**
 * Uploads a local file to Cloudinary and returns its secure URL.
 * Supports both PDF and DOCX files.
 * @param filePath Local path to the uploaded file
 * @param folder Cloudinary folder name (defaults to "resumes")
 */
export async function uploadToCloudinary(filePath: string, folder: string = "resumes"): Promise<string> {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: "raw", // Treat PDFs/DOCX as raw binaries
      type: "upload",       // Explicitly set delivery type to public upload
      access_mode: "public", // Explicitly set access mode to public to bypass account-level restrictions
    });
    return result.secure_url;
  } catch (err) {
    console.error("Cloudinary upload failed:", err);
    throw err;
  }
}
