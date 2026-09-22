const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");

// Controller Import
const listingController = require("../controllers/listings.js");

// Cloudinary & Multer Setup
const multer = require("multer");
const { storage } = require("../cloudConfig.js"); // File name check: cloudConfig.js
const upload = multer({ storage });

// 1. INDEX & CREATE ROUTES
router
  .route("/")
  .get(wrapAsync(listingController.index))
  .post(
    isLoggedIn,
    upload.single("listing[image]"), // 1. Image upload (Pehle chalega taaki req.body populate ho sake)
    validateListing,                 // 2. Joi Validation Schema
    wrapAsync(listingController.createListing)
  );

// 2. NEW ROUTE
router.get("/new", isLoggedIn, listingController.renderNewForm);

// 3. SHOW, UPDATE & DELETE ROUTES
router
  .route("/:id")
  .get(wrapAsync(listingController.showListing))
  .put(
    isLoggedIn,
    isOwner,
    upload.single("listing[image]"), // 1. Image upload for update
    validateListing,                 // 2. Joi Validation Schema
    wrapAsync(listingController.updateListing)
  )
  .delete(
    isLoggedIn,
    isOwner,
    wrapAsync(listingController.destroyListing)
  );

// 4. EDIT ROUTE
router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.renderEditForm)
);

module.exports = router;