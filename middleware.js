const Listing = require("./models/listing.js");
const ExpressError = require("./utils/expressError.js");
const {listingSchema, reviewSchema} = require("./schema.js");
const Review = require("./models/review.js");


module.exports.isLoggedIn = (req, res, next) => {
    console.log("Running isLoggedIn... Is authenticated?", req.isAuthenticated());
    if(!req.isAuthenticated()){
        // Extract the listing ID if the original URL is a review submission
        const url = req.originalUrl.includes("/reviews")
          ? req.originalUrl.split("/reviews")[0]  // e.g. /listings/68fbec0fb46d796457972fc7
          : req.originalUrl;
        
        req.session.redirectUrl = url;

        req.flash("error", "You must be logged in to perform this!");
        return res.redirect("/login");
    }
    next();
};


module.exports.saveRedirectUrl = (req, res, next) => {
    if(req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    if(!req.session.redirectUrl) {
        res.locals.redirectUrl = "/listings";
    }
    next();
};


module.exports.isOwner = async (req, res, next) => {
    let {id} = req.params;
    let listing = await Listing.findById(id);
    if(!listing.owner._id.equals(res.locals.currentUser._id)){
        req.flash("error", "You don't have permission to edit");
        return res.redirect(`/listings/${id}`);
    }

    next();
};

module.exports.validateListing = (req, res, next) => {
    let {error} = listingSchema.validate(req.body);
    // console.log(result);
    if(error){
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    }
    else{
        next();
    }
};


module.exports.validateReview = (req, res, next) => {
    let {error} = reviewSchema.validate(req.body);
    if(error){
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    }
    else{
        next();
    }
};


module.exports.isReviewAuthor = async(req, res, next) => {
    let {id, reviewId} = req.params;
    let review = await Review.findById(reviewId);

    if(!review.author.equals(res.locals.currentUser._id)){
        req.flash("error", "You are not the author of this review!");
        return res.redirect(`/listings/${id}`);
    }

    next();
};



