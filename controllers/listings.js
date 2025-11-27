const Listing = require("../models/listing.js");
const axios = require("axios");


module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    res.render("./listings/index.ejs", {allListings});
};

module.exports.renderNewForm = (req, res) => {
    res.render("./listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
    let {id} = req.params;
    // res.send(`showing info for id: ${id}`);
    const listing = await Listing.findById(id).populate({
        path: "reviews",
        populate: {
            path: "author"
        }
    }).populate("owner");
    if(!listing){
        req.flash("error", "Listing you requested, does not exist!");
        return res.redirect("/listings");
    }
    res.render("./listings/show.ejs", {listing});
};


// module.exports.createListing = async (req, res) => {
//   const newListing = new Listing(req.body.listing);
//   newListing.owner = req.user._id;

//   if (req.file) {
//     newListing.image = {
//       url: req.file.path,       // Cloudinary gives URL
//       filename: req.file.filename // and file identifier
//     };
//   }

//   await newListing.save();
//   req.flash("success", "New listing created!");
//   res.redirect(`/listings/${newListing._id}`);
// };


// module.exports.createListing = async (req, res) => {
//   console.log("Body:", req.body);
//   console.log("File:", req.file);
//   const newListing = new Listing(req.body.listing);
//   newListing.owner = req.user._id;

//   if (req.file) {
//     newListing.image = {
//       url: req.file.path,
//       filename: req.file.filename
//     };
//   }

//   await newListing.save();
//   req.flash("success", "New listing created!");
//   res.redirect(`/listings/${newListing._id}`);
// };


// module.exports.createListing = async (req, res, next) => {
//   try {
//     console.log("File received:", req.file);
//     const newListing = new Listing(req.body.listing);
//     newListing.owner = req.user._id;

//     if (req.file) {
//       newListing.image = {
//         url: req.file.path,
//         filename: req.file.filename
//       };
//     }

//     await newListing.save();
//     req.flash("success", "New listing created!");
//     res.redirect(`/listings/${newListing._id}`);
//   } catch (err) {
//     console.error("Error during upload:", err);
//     req.flash("error", "Upload failed");
//     res.redirect("/listings/new");
//   }
// };


// module.exports.createListing = async (req, res, next)=> {
//         if(!req.body.listing){
//             throw new ExpressError(400, "Send valid data for listing");
//         }
//         // let { listing } = req.body;
//         // if (!listing.image.filename || listing.image.filename.trim() === "") {
//         //     listing.image.filename = "listingimage";
//         // }

//         // const newListing = new Listing(req.body.listing);

//         // if(!newListing.image.filename || newListing.image.filename.trim() === ""){
//         //     newListing.image.filename = "listingimage";
//         // }

//         // if(!newListing.description){
//         //     throw new ExpressError(400, "Description is missing");
//         // }
//         // if(!newListing.price){
//         //     throw new ExpressError(400, "Price is missing");
//         // }

//         // if(!newListing.title){
//         //     throw new ExpressError(400, "Title is missing");
//         // }

//         // if(!newListing.location) {
//         //     throw new ExpressError(400, "Location is missing");
//         // }

//         // if(!newListing.country) {
//         //     throw new ExpressError(400, "Country is missing");
//         // }
//         const newListing = new Listing(req.body.listing);
//         newListing.owner = req.user._id;
//         await newListing.save();
//         req.flash("success", "New listing created!");
//         res.redirect("/listings");   
// };

// In controllers/listings.js

// ... (keep your index, renderNewForm, and showListing functions above this) ...

// ⬇️ DELETE all your 'createListing' functions and REPLACE with this ⬇️
module.exports.createListing = async (req, res, next) => {
  try {
    console.log("createListing controller started."); // Log 3
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;

    const location = req.body.listing.location;

      // Request GeoJSON data from Nominatim
      const geoRes = await axios.get("https://nominatim.openstreetmap.org/search", {
        params: {
          q: location,
          format: "geojson",
          limit: 1, // only one best match
        }
      });

      const geoData = geoRes.data;

      if (
        geoData &&
        geoData.features &&
        geoData.features.length > 0
      ) {
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

    console.log("[4/4] Attempting to save to MongoDB..."); // Log 4
    await newListing.save(); // <-- This is the suspect
    console.log("Save to MongoDB complete."); // Log 5

    req.flash("success", "New listing created!");
    res.redirect(`/listings/${newListing._id}`); // Redirect to the NEW listing

  } catch (err) {
    console.error("Error in createListing controller:", err);
    req.flash("error", "Failed to create listing.");
    res.redirect("/listings/new");
  }
};
// ⬆️ This is your only 'createListing' function now ⬆️

// ... (keep your renderEditForm, updateListing, and deleteListing functions below this) ...


module.exports.renderEditForm = async (req, res) => {
    let{id} = req.params;
    let listing = await Listing.findById(id);
    if(!listing){
        req.flash("error", "Listing you requested, does not exist!");
        return res.redirect("/listings");
    }

    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/h_250,w_350");

    res.render("./listings/edit.ejs", {listing, originalImageUrl});  
};


module.exports.updateListing = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Use { new: true } to get the updated version of the document
    const listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing }, { new: true });

    const location = req.body.listing.location;
    if (location) {
      const geoRes = await axios.get("https://nominatim.openstreetmap.org/search", {
        params: {
          q: location,
          format: "geojson",
          limit: 1
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

    // ✅ Update image if new one uploaded
    if (req.file) {
      listing.image = {
        url: req.file.path,
        filename: req.file.filename
      };
    }

    // ✅ Now actually save the updated geometry and/or image
    await listing.save();

    req.flash("success", "Listing updated!");
    res.redirect(`/listings/${listing._id}`);
  } catch (err) {
    console.error("Error in updateListing:", err);
    req.flash("error", "Failed to update listing.");
    res.redirect("/listings");
  }
};



module.exports.deleteListing = async(req, res) => {
    let {id} = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success", "Listing deleted!");
    res.redirect("/listings/");
};