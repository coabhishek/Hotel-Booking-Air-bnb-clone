const Listing = require("../models/listingSchema.js");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mapToken ? mbxGeocoding({ accessToken: mapToken }) : null;

// 1. Index Route (Supports Search Query 'q' & Category Filtering)
module.exports.index = async (req, res) => {
  const { category, q } = req.query;
  let filter = {};

  // Category filter check
  if (category) {
    filter.category = category;
  }

  // Search query filter (Matches Title, Location, or Country case-insensitively)
  if (q && q.trim() !== "") {
    const searchRegex = new RegExp(q.trim(), "i");
    filter.$or = [
      { title: searchRegex },
      { location: searchRegex },
      { country: searchRegex }
    ];
  }

  let allListing = await Listing.find(filter);
  res.render("listings/index.ejs", { allListing, searchQuery: q || "" });
};

// 2. Render New Form
module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

// 3. Create Listing (with Geocoding, Category & Marker Setup)
module.exports.createListing = async (req, res) => {
  let response;
  
  if (geocodingClient) {
    response = await geocodingClient
      .forwardGeocode({
        query: `${req.body.listing.location}, ${req.body.listing.country}`,
        limit: 1,
      })
      .send();
  }

  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;

  // Cloudinary Image Upload Check
  if (typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    newListing.image = { url, filename };
  }

  // Save GeoJSON Geometry / Coordinates
  if (response && response.body && response.body.features && response.body.features.length) {
    newListing.geometry = response.body.features[0].geometry;
  } else {
    // Default Fallback Coordinates (Delhi)
    newListing.geometry = { type: "Point", coordinates: [77.2090, 28.6139] };
  }

  await newListing.save();
  req.flash("success", "New Listing Created!");
  res.redirect("/listings");
};

// 4. Show Listing
module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");

  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }
  res.render("listings/show.ejs", { listing });
};

// 5. Render Edit Form
module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }

  // Cloudinary Image Transformation for preview
  let originalImageUrl = listing.image ? listing.image.url : "";
  if (originalImageUrl) {
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
  }

  res.render("listings/edit.ejs", { listing, originalImageUrl });
};

// 6. Update Listing
module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing not found!");
    return res.redirect("/listings");
  }

  // Details Update (Including Category)
  listing.title = req.body.listing.title;
  listing.description = req.body.listing.description;
  listing.price = req.body.listing.price;
  listing.location = req.body.listing.location;
  listing.country = req.body.listing.country;
  listing.category = req.body.listing.category;

  // Re-geocode if Location changes
  if (geocodingClient && (req.body.listing.location || req.body.listing.country)) {
    let response = await geocodingClient
      .forwardGeocode({
        query: `${req.body.listing.location}, ${req.body.listing.country}`,
        limit: 1,
      })
      .send();

    if (response && response.body && response.body.features && response.body.features.length) {
      listing.geometry = response.body.features[0].geometry;
    }
  }

  // New Image Check
  if (typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
  }

  await listing.save();

  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};

// 7. Delete Listing
module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};