const express = require('express');
const router = express.Router();
const Booking = require('../models/booking');
const Listing = require('../models/listing');
const { isLoggedIn } = require('../middleware.js');


// API to check availability
router.get('/check-availability/:listingId', isLoggedIn, async (req, res) => {
    try {
        const { listingId } = req.params;
        const { checkIn, checkOut } = req.query;

        const existingBookings = await Booking.find({
            listing: listingId,
            $or: [
                { checkIn: { $lt: new Date(checkOut), $gte: new Date(checkIn) } },
                { checkOut: { $gt: new Date(checkIn), $lte: new Date(checkOut) } }
            ]
        });

        if (existingBookings.length > 0) {
            return res.json({ available: false });
        }

        return res.json({ available: true });
    } catch (error) {
        console.error("Error checking availability:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Booking Route
router.post('/book/:listingId', async (req, res) => {
    try {
        const { listingId } = req.params;
        const { checkIn, checkOut, userId } = req.body;
        console.log("🔹 Booking Route Hit:", req.params.listingId);
        console.log("🔹 Request Body:", req.body);
        // Check if the listing is already booked
        const existingBookings = await Booking.find({
            listing: listingId,
            $or: [
                { checkIn: { $lt: new Date(checkOut), $gte: new Date(checkIn) } },
                { checkOut: { $gt: new Date(checkIn), $lte: new Date(checkOut) } }
            ]
        });

        if (existingBookings.length > 0) {
            return res.status(400).json({ error: "This listing is already booked for the selected dates." });
        }

        // Create a new booking
        const newBooking = new Booking({
            listing: listingId,
            user: userId,
            checkIn: new Date(checkIn),
            checkOut: new Date(checkOut)
        });

        await newBooking.save();
        res.status(201).json({ message: "Booking confirmed!", booking: newBooking });

    } catch (error) {
        console.error("Error booking:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
