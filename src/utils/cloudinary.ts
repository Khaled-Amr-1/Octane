import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export const uploadToCloudinary = async (fileBuffer: Buffer, filename: string) => {
  return await new Promise<string>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { resource_type: "image", public_id: filename },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve(result.secure_url);
      }
    ).end(fileBuffer);
  });
};

export const deleteFromCloudinaryByUrl = async (url: string) => {
  // Only handle real Cloudinary URLs
  const cloudinaryHost = "res.cloudinary.com";
  if (!url.includes(cloudinaryHost)) return false;

  // Example URL: https://res.cloudinary.com/<cloud_name>/image/upload/v<number>/<public_id>.<ext>
  const parts = url.split("/");
  const uploadIndex = parts.indexOf("upload");
  if (uploadIndex === -1 || !parts[uploadIndex + 2]) return false;

  // public_id may be in the form of folder/file (without extension)
  const publicIdWithExt = parts.slice(uploadIndex + 1).join("/"); // includes version and file name
  // Remove version and extension
  // Example: v1750343132/acknowledgment_1750343131895.png -> acknowledgment_1750343131895
  const fileWithExt = parts[uploadIndex + 2]; // e.g., acknowledgment_1750343131895.png
  const fileName = fileWithExt.split(".")[0]; // acknowledgment_1750343131895
  const publicId = parts.slice(uploadIndex + 1, uploadIndex + 2).join("/") + "/" + fileName;

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
    return true;
  } catch (err) {
    console.error("Failed to delete Cloudinary image:", url, err);
    return false;
  }
};