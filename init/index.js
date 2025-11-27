const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

if(process.env.NODE_ENV != "production"){
    require("dotenv").config({ path: '../.env' });
    console.log(process.env.SECRET);
}

// const MONGO_URL = "mongodb://127.0.0.1:27017/traveller";
const MONGO_URL = process.env.ATLASDB_URL;

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
  await Listing.deleteMany({});
  initData.data = initData.data.map((obj) => ({
    ...obj,
    owner: "68fb670210f78cf5d9844928"
  }));
  await Listing.insertMany(initData.data);
  console.log("data was initialized");
};

initDB();