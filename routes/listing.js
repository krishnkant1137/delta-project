// routes/listings.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const wrapAsync = require('../utils/wrapAsync.js');
const { isLoggedIn, validateListing, isOwner } = require('../middleware.js');
const listingController = require('../controllers/listings.js');
const multer = require('multer');
const { storage } = require('../cloudConfig.js');
const upload = multer({ storage });
const Listing = require('../models/listing.js');

router.post("/", isLoggedIn, upload.single("listing[image]"), validateListing, wrapAsync(async (req, res) => {
    console.log("🔹 New Listing Request Received:", req.body);
    console.log("🔹 Uploaded File:", req.file);
    console.log("🔹 User Logged In:", req.user);

    if (!req.body.listing) {
        console.log("🚨 Error: No listing data found in request body!");
        req.flash("error", "Invalid listing data.");
        return res.redirect("/listings/new");
    }

    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;

    await newListing.save();
    req.flash('success', "New Listing Created!!");
    res.redirect('/listings');
}));

// all listings
router.route("/")
    .get(wrapAsync(listingController.index))  // ✅ Only use the controller function
    .post(
        isLoggedIn,
        upload.single("listing[image]"),
        validateListing,
        wrapAsync(listingController.createListing)
    );

// Render form to create new listing
router.get('/new', isLoggedIn, wrapAsync(listingController.renderNewForm));

// Search Listings by location
router.get('/search', wrapAsync(async (req, res) => {
    console.log("Search Query Received:", req.query); // Debugging log
    const { query } = req.query;
    if (!query) {
        req.flash('error', 'Please enter a location to search.');
        return res.redirect('/listings');
    }

    const regex = new RegExp(query, 'i'); // Case-insensitive search
    const listings = await Listing.find({ location: regex });

    console.log("Search Results:", listings); // Debugging log
    res.render("listings/index", { allListing: listings, searchQuery: query });
}));

// Get, update, and delete a listing by ID
router.route("/:id")
    .get(wrapAsync(listingController.showListing))
    .put(
        isLoggedIn,
        upload.single("listing[image]"),
        validateListing,
        isOwner,
        wrapAsync(listingController.updateListing)
    )
    .delete(
        isLoggedIn,
        isOwner,
        wrapAsync(listingController.deleteListing)
    );

// Render edit form for a listing
router.get('/:id/edit',
    isLoggedIn,
    isOwner,
    wrapAsync(listingController.renderEditForm)
);

module.exports = router;
