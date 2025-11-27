const mongoose = require("mongoose")
const Schema = mongoose.Schema;
const Review = require("./review.js");

const listingSchema = new Schema({
    title : {
        type: String,
        required: true
    },
    description : String, 
    image : {
        filename : String,
        url : String,
        // default : "https://cloudinary-marketing-res.cloudinary.com/image/upload/w_1300/q_auto/f_auto/hiking_dog_mountain",
        // set : (v) => v === " " ? "https://cloudinary-marketing-res.cloudinary.com/image/upload/w_1300/q_auto/f_auto/hiking_dog_mountain" : v,
    },
    price : Number,
    location : String,
    country : String,
    reviews : [
        {
            type: Schema.Types.ObjectId,
            ref: "Review"
        }
    ],

    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },

    geometry: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    }
});

// mongoose middleware to delete all reviews of the post that was deleted
listingSchema.post("findOneAndDelete", async (listing) => {
    if(listing){
        await Review.deleteMany({id: {$in: listing.reviews}});
    }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;