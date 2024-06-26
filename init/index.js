const mongoose = require('mongoose');
const initData = require('./data.js');
const Listing = require('../models/listing.js');

//connection with database
const MONGO_URL = 'mongodb://127.0.0.1:27017/airbnb'

main()
    .then(() => { console.log("connected to database") })
    .catch(err => console.log(err));

async function main() {
    await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
    await Listing.deleteMany({});
    initData.data = initData.data.map((obj) => ({ ...obj, owner: '66235af432e778be29e2cb44' }))
    await Listing.insertMany(initData.data);
    console.log("data was initialized");
}

initDB();
