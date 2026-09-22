const Listing = require("../models/listingSchema");
const Review = require("../models/review"); // FIXED: Singular 'Review' matching implementation

// 1. Create Review
module.exports.createReview = async (req, res) => {
  let listing = await Listing.findById(req.params.id);

  if (!listing) {
    req.flash("error", "Listing not found!");
    return res.redirect("/listings");
  }

  let newReview = new Review(req.body.review);
  
  // Logged-in user ko review ka author set kar rahe hain
  newReview.author = req.user._id;

  listing.reviews.push(newReview);

  await newReview.save();
  await listing.save();

  req.flash("success", "New Review Created!");
  res.redirect(`/listings/${listing._id}`);
};

// 2. Delete Review
module.exports.destroyReview = async (req, res) => {
  let { id, reviewId } = req.params;

  // Listing array se review reference pull karke review document delete karein
  await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
  await Review.findByIdAndDelete(reviewId);

  req.flash("success", "Review Deleted!");
  res.redirect(`/listings/${id}`);
};