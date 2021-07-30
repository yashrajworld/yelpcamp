const Campground = require('../models/campground')
const Review = require('../models/review')
module.exports.addReview = async (req, res) => {
    const campground = await Campground.findById(req.params.id)
    const review = new Review(req.body.review)
    review.author = req.user._id
    campground.reviews.push(review)
    await review.save()
    await campground.save()
    req.flash('success', 'Created new review')
    res.redirect(`/campgrounds/${campground._id}`)
}

module.exports.delete = async (req, res) => {
    await Review.findByIdAndDelete(req.params.reviewId)
    const campground = await Campground.findByIdAndUpdate(req.params.id, { $pull: { reviews: req.params.reviewId } })
    req.flash('success', 'Successfully deleted the review')
    res.redirect(`/campgrounds/${req.params.id}`)
}