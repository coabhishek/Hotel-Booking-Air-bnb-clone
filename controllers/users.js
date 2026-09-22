const User = require("../models/user");

// 1. Render Signup Form
module.exports.renderSignupForm = (req, res) => {
  res.render("users/signup.ejs");
};

// 2. POST Signup Logic
module.exports.signup = async (req, res, next) => {
  try {
    let { username, email, password } = req.body;
    let newUser = new User({ email, username });

    const registeredUser = await User.register(newUser, password);

    // Signup ke baad automatic login
    req.login(registeredUser, (err) => {
      if (err) {
        return next(err);
      }
      req.flash("success", "Welcome to Wanderlust!");
      let redirectUrl = req.session.redirectUrl || "/listings";
      delete req.session.redirectUrl;
      res.redirect(redirectUrl);
    });
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/signup");
  }
};

// 3. Render Login Form
module.exports.renderLoginForm = (req, res) => {
  res.render("users/login.ejs");
};

// 4. POST Login Logic
module.exports.login = async (req, res) => {
  req.flash("success", "Welcome back to Wanderlust! You are Logged In");
  let redirectUrl = res.locals.redirectUrl || "/listings";
  res.redirect(redirectUrl);
};

// 5. Logout Logic
module.exports.logout = (req, res, next) => {
  req.logOut((err) => {
    if (err) {
      return next(err);
    }
    req.flash("success", "You are logged out!");
    res.redirect("/listings");
  });
};