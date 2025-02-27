// controllers/listings.js
const Listing = require('../models/listing.js');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });


module.exports.index = async (req, res) => {
    try {
        const allListing = await Listing.find({}) || [];
        res.render("./listings/index.ejs", { allListing });
    } catch (error) {
        console.error("Error fetching listings:", error);
        res.render("./listings/index.ejs", { allListing: [] });
    }
};

module.exports.renderNewForm = async (req, res) => {
    res.render("./listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
        .populate({ path: "reviews", populate: { path: "author" } }) // Nested populate
        .populate("owner");
    if (!listing) {
        req.flash('error', "Listing you are requested for does not exist!!");
        res.redirect(`/listings`);
    }
    res.render("./listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res) => {
    try {        
        let response = await geocodingClient
            .forwardGeocode({
                query: req.body.listing.location,
                limit: 1
            })
            .send();

        let geometryData = response.body.features.length > 0 ? response.body.features[0].geometry : { type: "Point", coordinates: [0, 0] };

        console.log("🔹 Uploaded File:", req.file); // Debugging

        if (!req.file) {
            req.flash("error", "Image upload failed. Please try again.");
            return res.redirect("/listings/new");
        }

        let url = req.file.path;
        let filename = req.file.filename;

        const newListing = new Listing({
            ...req.body.listing,
            image: req.file ? { url: req.file.path, filename: req.file.filename } : { url: "/images/default.jpg", filename: "default" },
            owner: req.user._id,
            geometry: geometryData
        });
        

        await newListing.save();
        req.flash('success', "New Listing Created!!");
        res.redirect('/listings');

    } catch (error) {
        console.error("🚨 Error creating listing:", error);
        req.flash("error", "Could not create listing. Try again.");
        res.redirect("/listings/new");
    }
};


module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash('error', "Listing you are requested for does not exist!!");
        res.redirect(`/listings`);
    }
    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
    console.log(originalImageUrl);
    res.render("./listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;

    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

    // For updating files
    if (typeof req.file !== 'undefined') {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
        await listing.save();
    }

    req.flash('success', "Listing Updated!!");
    res.redirect(`/listings/${id}`);
};

module.exports.deleteListing = async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash('success', "Listing Deleted!!");
    res.redirect(`/listings`);
};

