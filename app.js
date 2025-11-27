const express = require("express")
const app = express();

if(process.env.NODE_ENV != "production"){
    require("dotenv").config();
    console.log(process.env.SECRET);
}

const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/expressError.js");
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const userRouter = require("./routes/user.js");




// Unused
// const {listingSchema, reviewSchema} = require("./schema.js");
// const Review = require("./models/review.js");
// const wrapAsync = require("./utils/wrapAsync.js");
// const Listing = require("./models/listing.js");


const MONGO_URL = process.env.ATLASDB_URL;

async function main(){
    await mongoose.connect(MONGO_URL);
}

main()
    .then(() => {
        console.log("connected to DB");
    })
    .catch((err) => {
        console.log(err);
    })

app.use(flash());



// root route
// app.get("/", (req, res) => {
//     res.send("root working");
// });

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static("public"));


const store = MongoStore.create({
    mongoUrl: MONGO_URL,
    crypto: {
        secret: process.env.SECRET
    },
    touchAfter: 24*3600
});

store.on("error", ()=> {
    console.log("error in mongo session store", err);
});

const sessionOptions = {
    store: store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7*24*60*60*1000, 
        maxAge: 7*24*60*60*1000,
        httpOnly: true,
    }
};



app.use(session(sessionOptions));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currentUser = req.user;
    next();
});


app.get("/demouser", async (req, res) => {
    let fakeUser = new User ({
        email: "aishani@gmail.com",
        username: "aish04"
    });

    let registeredUser = await User.register(fakeUser, "helloworld");
    res.send(registeredUser);
});


app.get("/predict", (req, res) => {
    // We will create 'predict.ejs' in the 'views' folder
    res.render("predict.ejs");
});

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

// app.get("/testListing", async (req, res) => {
//     let sampleListing = new Listing({
//         title : "My New Villa",
//         description: "By the beach",
//         price : 1200,
//         location : "Calangute, Goa",
//         country : "India"
//     });

//     await sampleListing.save();
//     console.log("sample was saved");
//     res.send("successful testing");
// });

app.use((req, res, next) => {
    next(new ExpressError(404, "Page Not Found"));
});

// Middleware to handle incorrect data during entry to DB
// app.use((err, req, res, next) => {
//     let {statusCode = 500, message = "Some error"} = err;
//     res.status(statusCode).render("../views/error.ejs", {statusCode, message});
//     // res.status(statusCode).send(message);
// });


// Middleware to handle incorrect data during entry to DB
app.use((err, req, res, next) => {
    console.error(err); // This will log the *actual* upload error
    
    let {statusCode = 500, message = "Some error"} = err;

    // We MUST pass all variables your layout needs
    res.status(statusCode).render("../views/error.ejs", {
        statusCode, 
        message, 
        currentUser: req.user || null, // For navbar.ejs
        success: [],                   // For flash.ejs
        error: []                      // For flash.ejs
    });
});


app.listen(8080, () => {
    console.log("server is listening to port 8080");
});

