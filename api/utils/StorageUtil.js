/* eslint-disable eqeqeq */
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const Config = require('./../../config');

const credentials = {
	accessKeyId: Config.AWS_ACCESS_KEY_ID,
	secretAccessKey: Config.AWS_SECRET_ACCESS_KEY,
};
const S3 = new S3Client({ credentials, region: Config.AWS_REGION });

async function upload(command) {
	let res = {};
	const response = await S3.send(command);
	if (response.$metadata.httpStatusCode == 200) {
		res = {
			Location: `https://${command.input.Bucket}.s3.amazonaws.com/${command.input.Key}`,
			Key: command.input.Key,
			key: command.input.Key,
			Bucket: command.input.Bucket,
			ETag: response.ETag,
			ServerSideEncryption: response.ServerSideEncryption,
		};
	}
	return res;
}

module.exports = {
	uploadImage: async (title, file, mime) => {
		const command = new PutObjectCommand({
			Bucket: Config.AWS_BUCKET_NAME,
			Key: title,
			Body: file,
			ContentType: mime,
		});
		const result = await upload(command);
		return result;
	},

	deleteImage: async (file) => {
		const command = new DeleteObjectCommand({
			Bucket: Config.AWS_BUCKET_NAME,
			Key: file.substring(file.lastIndexOf('/') + 1),
		});
		const result = await upload(command);
		return result;
	},
};
