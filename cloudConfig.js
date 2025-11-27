const cloudinary = require("cloudinary").v2;
const {CloudinaryStorage} = require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});

// const storage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: 'traveller_DEV',
//     allowedFormats: ["png", "jpg", "jpeg"],
//   },
// });

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    // We removed 'folder' for now, as it was causing the hang.
    allowedFormats: ["png", "jpg", "jpeg"], // This part is good to keep.
  },
});

module.exports = {
    cloudinary,
    storage
}
