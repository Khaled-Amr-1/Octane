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

  try {
    // Extract the part after '/upload/' (removes query params)
    const uploadParts = url.split("/upload/");
    if (uploadParts.length < 2) return false;

    let afterUpload = uploadParts[1].split(/[?#]/)[0]; // remove ? or # fragments if any
    // Remove version if present (starts with v + digits + /)
    afterUpload = afterUpload.replace(/^v\d+\//, "");

    // Remove file extension
    const publicId = afterUpload.replace(/\.[^.]+$/, "");

    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
    return true;
  } catch (err) {
    console.error("Failed to delete Cloudinary image:", url, err);
    return false;
  }
};