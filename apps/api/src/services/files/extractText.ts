import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import fs from "fs";

/**
 * Extracts plain text from an uploaded resume buffer (PDF or DOCX).
 * Seamlessly supports both local file paths and remote Cloudinary HTTP/S URLs.
 * @param filePath Local path or Cloudinary URL to the file
 * @param fileType Extension of the file (e.g. "pdf" or "docx")
 */
export async function extractText(filePath: string, fileType: string): Promise<string> {
  let buffer: Buffer;

  // If the path is a remote URL, fetch the file contents into memory
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    console.log(`[extractText] Downloading remote resume: ${filePath}`);
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to fetch file from Cloudinary URL: ${response.statusText} (${response.status}) at path: ${filePath}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  } else {
    // Fallback: Read from the local filesystem
    console.log(`[extractText] Reading local resume: ${filePath}`);
    buffer = fs.readFileSync(filePath);
  }

  if (fileType.toLowerCase() === "pdf") {
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (fileType.toLowerCase() === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  throw new Error(`Unsupported file type: ${fileType}`);
}
