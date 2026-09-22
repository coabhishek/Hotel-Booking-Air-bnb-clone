const mongoose = require("mongoose")
const initData = require("./data")
const Listing = require("../models/listingSchema.js")



main().then(()=>{
    console.log("DB connected")
}).catch((err)=>{
    console.log(err)
})

async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/wonderlust');

}


const initDB = async ()=> {
    await Listing.deleteMany({})
   initData.data = initData.data.map((obj)=> ({...obj, owner: '6ab16262df8ed32f75d241dc'}))
    await Listing.insertMany(initData.data)
    console.log("data was saved")
}

initDB()