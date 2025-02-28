if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const ExpressError = require('./utils/ExpressError.js');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user.js')
const port = 1137;



const listingsRouter = require('./routes/listing.js');
const reviewsRouter = require('./routes/review.js');
const userRouter = require('./routes/user.js');
const bookingRouter = require('./routes/bookings.js');


// connection with database
// const MONGO_URL = 'mongodb://127.0.0.1:27017/airbnb'
const dbUrl = process.env.ATLASDB_URL;

main()
    .then(() => { console.log("connected to database") })
    .catch(err => console.log(err));

async function main() {
    await mongoose.connect(dbUrl);
}

app.set('view engine', 'ejs');
app.set("views", path.join(__dirname, 'views'))
// Debug Session and User Data

app.use(express.urlencoded({ extended: true }))
app.use(methodOverride("_method"))
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));
app.use(express.static(path.join(__dirname, '/public')))
app.engine('ejs', ejsMate);

//Mongo store session info on mogoatlus
const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET || "mybackupsecret",
    },
    touchAfter: 24 * 60 * 60, // Update session every 24 hours
});

store.on("error", (err) => {
    console.log("Error in MongoSession store:", err);
});

const sessionOptions = {
    store,
    secret: process.env.SECRET || "mybackupsecret",
    resave: false,
    saveUninitialized: false, // Fix session undefined issue
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    }
};

app.use(session(sessionOptions));



//For passport setup
//Passport will use implementation of session it should be after session
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    console.log("SESSION:", req.session);
    console.log("CURRENT USER:", req.user);
    next();
});
app.use(flash());
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

app.use((req, res, next) => {
    console.log("FLASH SUCCESS:", req.flash("success"));
    console.log("FLASH ERROR:", req.flash("error"));
    next();
});

//Restructuring all routes
app.use("/listings", listingsRouter);
app.use("/listings/:id/reviews", reviewsRouter);
app.use("/", userRouter);
app.use('/bookings', bookingRouter);



app.get("/", (req, res) => {
    res.redirect("/listings");
});


app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page not Found"));
})

//Error handling 
app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong" } = err;
    res.status(statusCode).render("error.ejs", { err })
    // res.status(statusCode).send(message);
})

app.listen(port, () => {
    console.log(`listening on port ${port}`);
})


