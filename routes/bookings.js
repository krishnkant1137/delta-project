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
router.post('/book/:listingId', isLoggedIn, async (req, res) => {
  try {
      const { listingId } = req.params;
      const { checkIn, checkOut } = req.body;
      
      // Check if listing is already booked
      const existingBookings = await Booking.find({
          listing: listingId,
          $or: [
              { checkIn: { $lt: new Date(checkOut), $gte: new Date(checkIn) } },
              { checkOut: { $gt: new Date(checkIn), $lte: new Date(checkOut) } }
          ]
      });

      if (existingBookings.length > 0) {
          req.flash('error', 'This listing is already booked for the selected dates!');
          return res.redirect(`/listings/${listingId}`);  // ✅ Redirect to same listing page
      }

      // Create a new booking
      const newBooking = new Booking({
          listing: listingId,
          user: req.user._id,  // ✅ `userId` ki zarurat nahi, `req.user._id` use karo
          checkIn: new Date(checkIn),
          checkOut: new Date(checkOut)
      });

      await newBooking.save();
      req.flash('success', 'Your booking is successfully confirmed!');
      console.log("FLASH SET:", req.session.flash);  // Debugging flash set or not
      return res.redirect(`/listings/${listingId}`);  // ✅ Redirect to same listing page

  } catch (error) {
      console.error("Error booking:", error);
      req.flash("error", "Something went wrong. Try again!");
      res.redirect(`/listings/${listingId}`);  // ✅ Redirect to same listing page
  }
});


module.exports = router;
