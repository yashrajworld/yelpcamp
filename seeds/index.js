const express = require('express')
const app = express()
const path = require('path')
const mongoose = require('mongoose')
const Campground = require('../models/campground')
const cities = require('./cities')
const { places, descriptors } = require('./seedHelpers')
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding')
const mapboxToken = 'pk.eyJ1IjoieWFzaHJhandvcmxkIiwiYSI6ImNrcm03dTczZTFrM2cycHB2cWxkMTlkZ3EifQ._9q3D5ezKLVfF41nXLfajg'
const geocoder = mbxGeocoding({ accessToken: mapboxToken })
mongoose.connect('mongodb://localhost:27017/yelp-camp', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
})

const db = mongoose.connection
db.on('error', console.error.bind(console, "Connection Error:"))
db.once('open', () => {
    console.log('Database connected')
})
const sample = (array) => {
    return array[Math.floor(Math.random() * array.length)]
}
const seedDB = async () => {
    await Campground.deleteMany({})
    for (let i = 0; i < 400; i++) {
        const random1000 = Math.floor(Math.random() * 1000)
        const location = `${cities[random1000].city}, ${cities[random1000].state}`
        const price = Math.floor(Math.random() * 20) + 10
        const geoData = await geocoder.forwardGeocode({
            query: location,
            limit: 1
        }).send()
        const camp = new Campground({
            location: location,
            title: `${sample(descriptors)} ${sample(places)}`,

            description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Amet corporis, voluptas quam fugiat facilis porro enim voluptatibus hic in id officiis mollitia deserunt beatae delectus voluptatum. Placeat a at vel',
            price: price,
            author: "60f7ed06105bdd0d882b4a72", //Your User ID
            images: [
                {
                    url: 'https://res.cloudinary.com/yashrajworld/image/upload/h_400,w_650,c_scale/v1627310784/YelpCamp/Airport_Photo_Contest-tenderfoot-campground-pam-meindl-pen7gi_b7qisr.jpg',
                    filename: 'YelpCamp/Airport_Photo_Contest-tenderfoot-campground-pam-meindl-pen7gi_b7qisr'
                },
                {
                    url: 'https://res.cloudinary.com/yashrajworld/image/upload/h_400,w_650,c_scale/v1627310776/YelpCamp/campground__2_nsjjft.jpg',
                    filename: 'YelpCamp/campground__2_nsjjft'
                },
                {
                    url: 'https://res.cloudinary.com/yashrajworld/image/upload/h_400,w_650,c_scale/v1627310771/YelpCamp/MapleSpringsCampground-Campsite_qogc1z.jpg',
                    filename: 'YelpCamp/MapleSpringsCampground-Campsite_qogc1z'
                },
                {
                    url: 'https://res.cloudinary.com/yashrajworld/image/upload/h_400,w_650,c_scale/v1627310768/YelpCamp/OhanaCampground2016_CMeleedy_01_web_udxovs.jpg',
                    filename: 'YelpCamp/y1xccceg9vbnzmqj0dlOhanaCampground2016_CMeleedy_01_web_udxovs9'
                }
            ],
            geometry:geoData.body.features[0].geometry
        })
        await camp.save()
    }
}
seedDB().then(() => {
    mongoose.connection.close()
})