const Listing = require("../models/listing.js");
const axios = require("axios");

module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    res.render("./listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
    res.render("./listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id).populate({
        path: "reviews",
        populate: {
            path: "author"
        }
    }).populate("owner");
    if (!listing) {
        req.flash("error", "Listing you requested, does not exist!");
        return res.redirect("/listings");
    }
    res.render("./listings/show.ejs", { listing });
};

// ---------------------------------------------------------
// FIX APPLIED HERE: Added 'headers' to the axios call
// ---------------------------------------------------------
module.exports.createListing = async (req, res, next) => {
    try {
        console.log("createListing controller started.");
        const newListing = new Listing(req.body.listing);
        newListing.owner = req.user._id;

        const location = req.body.listing.location;

        // Request GeoJSON data from Nominatim
        const geoRes = await axios.get("https://nominatim.openstreetmap.org/search", {
            params: {
                q: location,
                format: "geojson",
                limit: 1,
            },
            headers: {
                // REQUIRED: Identify your app to avoid 403 Forbidden errors
                "User-Agent": "TravellerApp/1.0 (my-email@example.com)" 
            }
        });

        const geoData = geoRes.data;

        if (geoData && geoData.features && geoData.features.length > 0) {
            console.log(geoData.features[0].geometry);
            newListing.geometry = geoData.features[0].geometry;
        } else {
            console.log("No coordinates found for:", location);
        }

        if (req.file) {
            console.log("File received, adding to newListing:", req.file.path);
            newListing.image = {
                url: req.file.path,
                filename: req.file.filename
            };
        } else {
            console.log("No file received by controller.");
        }

        console.log("[4/4] Attempting to save to MongoDB...");
        await newListing.save();
        console.log("Save to MongoDB complete.");

        req.flash("success", "New listing created!");
        res.redirect(`/listings/${newListing._id}`);

    } catch (err) {
        console.error("Error in createListing controller:", err);
        req.flash("error", "Failed to create listing.");
        res.redirect("/listings/new");
    }
};

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing you requested, does not exist!");
        return res.redirect("/listings");
    }

    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/h_250,w_350");

    res.render("./listings/edit.ejs", { listing, originalImageUrl });
};

// ---------------------------------------------------------
// FIX APPLIED HERE ALSO: Added 'headers' to update logic
// ---------------------------------------------------------
module.exports.updateListing = async (req, res) => {
    try {
        const { id } = req.params;

        const listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing }, { new: true });

        const location = req.body.listing.location;
        if (location) {
            const geoRes = await axios.get("https://nominatim.openstreetmap.org/search", {
                params: {
                    q: location,
                    format: "geojson",
                    limit: 1
                },
                headers: {
                    // REQUIRED: Identify your app here as well
                    "User-Agent": "TravellerApp/1.0 (my-email@example.com)"
                }
            });

            const geoData = geoRes.data;

            if (geoData && geoData.features && geoData.features.length > 0) {
                console.log("Updated geometry:", geoData.features[0].geometry);
                listing.geometry = geoData.features[0].geometry;
            } else {
                console.log("No coordinates found for:", location);
            }
        }

        if (req.file) {
            listing.image = {
                url: req.file.path,
                filename: req.file.filename
            };
        }

        await listing.save();

        req.flash("success", "Listing updated!");
        res.redirect(`/listings/${listing._id}`);
    } catch (err) {
        console.error("Error in updateListing:", err);
        req.flash("error", "Failed to update listing.");
        res.redirect("/listings");
    }
};

module.exports.deleteListing = async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success", "Listing deleted!");
    res.redirect("/listings/");
};