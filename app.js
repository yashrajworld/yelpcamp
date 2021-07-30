if (process.env.NODE_ENV != "production") {
    require('dotenv').config()
}

//Add all these in .env file
console.log(process.env.CLOUDINARY_SECRET)
console.log(process.env.CLOUDINARY_KEY)
console.log(process.env.MAPBOX_TOKEN)
console.log(process.env.CLOUDINARY_CLOUD_NAME)
console.log(process.env.SECRET)
console.log(process.env.DB_URL)


const express = require('express')
const app = express()
const path = require('path')
const mongoose = require('mongoose')
const ejsMate = require('ejs-mate')
const Joi = require('joi')
const ExpressError = require('./utils/ExpressError')
const methodOverride = require('method-override')
const Campground = require('./models/campground')
const Review = require('./models/review')
const User = require('./models/user')
const { campgroundSchema, reviewSchema } = require('./schemas')
const session = require('express-session')
const flash = require('connect-flash')
const passport = require('passport')
const LocalStrategy = require('passport-local')
const mongoSanitize = require('express-mongo-sanitize')
const helmet = require('helmet')
const MongoDBStore = require('connect-mongo')(session)

const reviewRoutes = require('./routes/reviews')
const campgroundRoutes = require('./routes/campgrounds')
const userRoutes = require('./routes/users')
const dbUrl = process.env.DB_URL
// const dbUrl = 'mongodb://localhost:27017/yelp-camp'
mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
})

const db = mongoose.connection
db.on('error', console.error.bind(console, "Connection Error:"))
db.once('open', () => {
    console.log('Database connected')
})

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method'))
app.use(mongoSanitize())
const secret = process.env.SECRET || "'thisshouldbeabettersecret'"
app.use(helmet({ contentSecurityPolicy: false }))
const store = new MongoDBStore({
    url: dbUrl,
    secret: secret,
    touchAfter: 24 * 3600
})

store.on("error", function (e) {
    console.log("Session store error")
})
app.use(express.static(path.join(__dirname, 'public'))) //making public directory default to serve static files

app.use(session({
    store: store,
    name: 'session',
    secret: secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        htppOnly: true,
        // secure: true, when we are deploying we want that to be true
        expires: Date.now() + (1000 * 60 * 60 * 24 * 7),
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}))

app.use(flash())

app.use(passport.initialize())
app.use(passport.session())
passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser()) //serialization basically means how do we store user in a session
passport.deserializeUser(User.deserializeUser())

app.use((req, res, next) => {
    res.locals.success = req.flash('success')
    res.locals.error = req.flash('error')
    res.locals.currentUser = req.user // currentUser will store info of the usr logged in globally!
    next()
})

app.get('/', (req, res) => {
    res.render('home')
})

app.use('/campgrounds', campgroundRoutes)
app.use('/campgrounds/:id/reviews', reviewRoutes)
app.use('/', userRoutes)

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
})

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err
    if (!err.message) {
        err.message = 'Oh No, Something went wrong'
    }
    res.status(statusCode).render('error', { err })
})
const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log('Serving on port ' + port)
})