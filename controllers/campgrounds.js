const Campground = require('../models/campground')
const { cloudinary } = require('../cloudinary')
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding')
const mapboxToken = process.env.MAPBOX_TOKEN
const geocoder = mbxGeocoding({ accessToken: mapboxToken })
module.exports.index = async (req, res) => {
    const campgrounds = await Campground.find()
    res.render('campgrounds/index', { campgrounds })
}

module.exports.renderNewForm = (req, res) => {
    res.render('campgrounds/new')
}

module.exports.createNew = async (req, res, next) => {
    const geoData = await geocoder.forwardGeocode({
        query: req.body.campground.location,
        limit: 1
    }).send()
    //if (!req.body.campground) throw new ExpressError('Invalid Campground Data', 400) //we have already setup our client side validation using bootstrap but user can still hit the error if using AJAX or Postman

    const campground = new Campground(req.body.campground)
    campground.geometry = geoData.body.features[0].geometry
    for (let file of req.files) {
        let temp = file.path
        file.path = temp.replace("image/upload", "image/upload/h_400,w_650,c_scale")
    }
    campground.images = req.files.map(f => ({ url: f.path, filename: f.filename }))
    campground.author = req.user._id
    await campground.save()
    console.log(campground)
    req.flash('success', 'Successfully made new campground')
    res.redirect(`/campgrounds/${campground._id}`)

}

module.exports.show = async (req, res) => {
    const campground = await Campground.findById(req.params.id).populate({ //populating information about each review(in that campground) which we will be requiring
        path: 'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author')
    if (!campground) {
        req.flash('error', 'Cannot find that campground')
        res.redirect('/campgrounds')
    }
    console.log(campground.geometry.coordinates)
    res.render("campgrounds/show", { campground })
}

module.exports.renderEditForm = async (req, res) => {
    const campground = await Campground.findById(req.params.id)
    if (!campground) {
        req.flash('error', 'Cannot find that campground')
        res.redirect('/campgrounds')
    }
    for (let img of campground.images) {
        console.log(img.thumbnail)
    }
    res.render("campgrounds/edit", { campground })
}

module.exports.editForm = async (req, res) => {
    const { id } = req.params
    const campground = await Campground.findByIdAndUpdate(req.params.id, req.body.campground)
    const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }))
    await campground.images.push(...imgs)

    await campground.save()
    console.log(req.body.deleteImages)
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename)
        }
        await campground.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } })
    }

    req.flash('success', 'Successfully updated campground')
    res.redirect(`/campgrounds/${campground._id}`)
}

module.exports.delete = async (req, res) => {
    await Campground.findByIdAndDelete(req.params.id)
    req.flash('success', 'Successfully deleted campground')
    res.redirect('/campgrounds')
}