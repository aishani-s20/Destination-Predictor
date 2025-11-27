const User = require("../models/user.js");
const passport = require("passport");

module.exports.renderSignupForm = (req, res) => {
    res.render("../views/users/signup.ejs");
};

module.exports.signup = async (req, res) => {
    try{
        let {username, email, password} = req.body;
        const newUser = User({email, username});

        let registeredUser = await User.register(newUser, password);
        console.log(registeredUser);
        req.login(registeredUser, (err) => {
            if(err){
                return next(err);
            }
            req.flash("success", "Welcome to Traveller!");
            res.redirect("/listings");
        });
    }
    catch(e){
        req.flash("error", e.message);
        res.redirect("/signup");
    }
    
};


module.exports.renderLoginForm = (req, res) => {
    res.render("../views/users/login.ejs");
};


module.exports.login = async(req, res) => {
    req.flash("success", "Welcome back!");
    res.redirect(res.locals.redirectUrl);
};