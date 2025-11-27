const express = require("express");
const router = express.Router({mergeParams:true});
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/expressError.js");
const Listing = require("../models/listing.js");
const {isLoggedIn} = require("../middleware.js");
const {validateReview} = require("../middleware.js");
const {isReviewAuthor} = require("../middleware.js");
const Review = require("../models/review.js");
const reviewController = require("../controllers/reviews.js");

// Review route
// post review
router.post("/", isLoggedIn, validateReview, wrapAsync (reviewController.createReview));


// delete review
router.delete("/:reviewId", isLoggedIn, isReviewAuthor, wrapAsync(reviewController.deleteReview));

module.exports = router;