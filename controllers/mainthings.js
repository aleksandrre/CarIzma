export const addUserPhoto = async (req, res) => {
  try {
    const { userId } = req.user;

    const file = await configureMulter(1)(req, res);

    if (!userId) {
      return res.status(400).json({ error: "User ID not found" });
    }

    if (!file || file.length === 0) {
      console.error("No file found in the request.");
      return res.status(400).json({ error: "No files found in the request" });
    }

    const user =
      (await Student.findById(userId)) || (await Teacher.findById(userId));

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const previousPhotoPath = user.photo;

    const filePaths = await uploadFilesToS3([file]);

    // Update the user model with the new S3 file path
    user.photo = filePaths[0]; // Assuming you're using only one file for a photo
    await user.save();

    // If there's a previous photo path, delete it from S3
    if (previousPhotoPath) {
      await deleteFileFromS3(previousPhotoPath);
    }

    return res
      .status(200)
      .json({ success: "Photo added successfully", filePath: filePaths[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

import multer from "multer";
const configureMulter = (maxFiles) => {
  const storage = multer.memoryStorage();
  const upload = multer({
    storage: storage,
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  });

  return (req, res) =>
    new Promise((resolve, reject) => {
      const middleware =
        maxFiles && maxFiles > 1
          ? upload.array("files", maxFiles)
          : upload.single("file");

      middleware(req, res, (err) => {
        if (err) {
          console.error(err);
          reject("Error uploading files");
        }

        resolve(req.files || req.file); // Resolve with the uploaded files or file
      });
    });
};

export default configureMulter;

// services/s3Service.js
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
dotenv.config();
const s3Client = new S3Client({
  region: process.env.BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

export const uploadFilesToS3 = async (files) => {
  return Promise.all(
    files.map(async (file) => {
      const fileName = `uploads/${uuidv4()}-${file.originalname}`;
      const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      try {
        await s3Client.send(new PutObjectCommand(params));
        return fileName; // Return the S3 file path
      } catch (uploadError) {
        console.error(uploadError);
        throw new Error("Error uploading files to S3");
      }
    })
  );
};
export const deleteFileFromS3 = async (filePath) => {
  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: filePath,
  };

  try {
    await s3Client.send(new DeleteObjectCommand(params));
  } catch (deleteError) {
    console.error(deleteError);
    throw new Error("Error deleting file from S3");
  }
};

export async function downloadFileFromS3(filePath, res) {
  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: filePath, // Specify the key of the file in your S3 bucket
  };

  try {
    const data = await s3Client.send(new GetObjectCommand(params));

    // Set appropriate headers for the response
    res.setHeader("Content-disposition", `attachment; filePath=${filePath}`);
    res.setHeader("Content-type", data.ContentType);

    // Stream the file data to the response
    data.Body.pipe(res);
  } catch (error) {
    console.error("Error downloading file from S3:", error);
    res.status(500).send(error.message || "Internal Server Error");
  }
}
