// controllers/listings.js
const Listing = require('../models/listing.js');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });
// console.log("Mapbox Token:", process.env.MAP_TOKEN);


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
    console.log(listing.geometry.coordinates);
    res.render("./listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res) => {
    try {
        console.log("🔹 Mapbox Geocoding Request for:", req.body.listing.location);
        
        let response = await geocodingClient
            .forwardGeocode({
                query: req.body.listing.location,
                limit: 1
            })
            .send();

        console.log("🔹 Mapbox Response:", response.body);

        let geometryData = response.body.features.length > 0 ? response.body.features[0].geometry : { type: "Point", coordinates: [0, 0] };

        let url = req.file ? req.file.path : "/images/default.jpg";
        let filename = req.file ? req.file.filename : "default";

        const newListing = new Listing({
            ...req.body.listing,
            image: { url, filename },
            owner: req.user._id,
            geometry: geometryData // ✅ Ensure geometry is always set
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

