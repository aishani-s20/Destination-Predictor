const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const {isLoggedIn, isOwner, validateListing} = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const {storage} = require("../cloudConfig.js");
const multer  = require('multer');
const upload = multer({ storage });

// This router.route("/") block now handles GET and POST
router.route("/")
  .get(wrapAsync(listingController.index))
  .post(
    isLoggedIn, // 1. Check login
    (req, res, next) => {
      console.log("User is logged in. Calling Cloudinary upload...");
      next();
    },
    upload.single("image"), // 2. Upload to Cloudinary (This is where it's hanging)
    (req, res, next) => {
      console.log("Cloudinary upload complete. Calling validation...");
      next();
    },
    validateListing, // 3. Validate data
    wrapAsync(listingController.createListing) // 4. Run controller
  );

// new route
router.get("/new", isLoggedIn, (listingController.renderNewForm));

// Edit route
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync (listingController.renderEditForm));

// This router.route("/:id") block handles GET, PUT, and DELETE
router.route("/:id")
  .get(wrapAsync (listingController.showListing))
  .put(isLoggedIn, isOwner, upload.single("image"), validateListing, wrapAsync(listingController.updateListing))
  .delete(isLoggedIn, isOwner, wrapAsync(listingController.deleteListing));

  
module.exports = router;