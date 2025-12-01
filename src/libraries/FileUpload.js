import fs from "fs/promises"; // Using promises for async operations
import uniqid from "uniqid";
import commonConstants from "~/constants/commonConstants";
// import commonHelpers from "~/helpers/commonHelpers";
import sharp from "sharp";
// import AWS from "aws-sdk";
import Path from "path";

/* const s3Obj = new AWS.S3({
	accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
	secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
	region: process.env.AWS_S3_REGION,
}); */

const storageDirectory = process.env.STORAGE_DIRECTORY;

class FileUpload {

	// Helper to create directories if not exist
	async ensureDirectoryExists(directory) {
		try {
			await fs.mkdir(directory, { recursive: true });
		} catch (err) {
			console.error(`Error creating directory: ${directory}`, err);
			throw err;
		}
	}

	/**
	 * Upload a single file.
	 */
	async uploadFile(file, directory = "testing", name = "") {
		if (!file) {
			return { name: "" };
		}

		const ext = file.name.split(".").pop();
		const absolutePath = Path.join(commonConstants.SYSTEM.STORAGE_PATH, directory);
		const fileName = `${uniqid()}.${ext}`;

		try {
			await this.ensureDirectoryExists(absolutePath);
			const fileNameWithPath = Path.join(absolutePath, fileName);

			await file.mv(fileNameWithPath);
			return { name: fileName };
		} catch (err) {
			console.error("Error uploading file:", err);
			throw err;
		}
	}

	/**
	 * Upload a file and convert it to WebP format.
	 */
	async uploadFileWebp(file, folder) {
		if (!file) return { name: "" };

		const ext = file.name.split(".").pop();
		const directory = Path.join(commonConstants.SYSTEM.STORAGE_PATH, folder);
		const fileName = `${uniqid()}.webp`;

		try {
			await this.ensureDirectoryExists(directory);
			const fileNameWithPath = Path.join(directory, fileName);
			await file.mv(fileNameWithPath);

			// Convert to WebP
			const thumbData = await sharp(fileNameWithPath).webp({ quality: 25 }).toBuffer();
			const thumbImagePath = Path.join(directory, fileName);

			await fs.writeFile(thumbImagePath, thumbData);
			return { name: fileName, path: fileNameWithPath, thumbImagePath };
		} catch (error) {
			console.error("Error processing image:", error);
			throw error;
		}
	}

	/**
	 * Upload Multiple Files.
	 */
	async uploadMultipleFile(files, folder) {
		const fileArray = [];
		try {
			for (const file of files) {
				const result = await this.uploadFile(file, folder);
				fileArray.push(result.name);
			}
			return fileArray;
		} catch (err) {
			console.error("Error uploading multiple files:", err);
			throw err;
		}
	}

	/**
	 * Unlink a file.
	 */
	async unlinkFile(fileName, folder) {
		try {
			const path = Path.join(commonConstants.SYSTEM.STORAGE_PATH, folder, fileName);
			await fs.unlink(path);
		} catch (err) {
			console.error("Error deleting file:", err);
			throw err;
		}
	}

	/**
	 * Unlink a file using full path.
	 */
	async unlinkFileUsingPath(filePath) {
		try {
			await fs.unlink(filePath);
		} catch (err) {
			console.error("Error deleting file:", err);
			throw err;
		}
	}

	/**
	 * Upload file to S3 bucket.
	 */
	/*async uploadToS3(file, directory) {
		const extension = Path.extname(file.name).toLowerCase();
		const fileType = file.mimetype.split("/")[0];
		let fileName;

		if (extension === ".pdf") {
			fileName = `${commonHelpers.getRandomString(10)}.pdf`;
		} else if (fileType === "video") {
			fileName = `${commonHelpers.getRandomString(10)}.mp4`;
		} else {
			fileName = `${commonHelpers.getRandomString(10)}.webp`;
			file.data = await sharp(file.data).toBuffer(); // Convert to WebP if not PDF or Video
		}

		const fileNameWithPath = `${storageDirectory}/${directory}/${fileName}`;
		const params = {
			Bucket: process.env.AWS_S3_BUCKET_NAME,
			Key: fileNameWithPath,
			Body: file.data,
			ACL: "public-read",
			ContentDisposition: "inline",
		};

		try {
			await s3Obj.putObject(params).promise();
			return fileName;
		} catch (err) {
			console.error("Error uploading to S3:", err);
			throw err;
		}
	}*/

	/**
	 * Delete object from S3.
	 */
	/*async deleteFileFromS3(filePath) {
		const params = {
			Bucket: process.env.AWS_S3_BUCKET_NAME,
			Key: filePath,
		};

		try {
			await s3Obj.deleteObject(params).promise();
		} catch (err) {
			console.error("Error deleting from S3:", err);
			throw err;
		}
	}*/
}

module.exports = FileUpload;