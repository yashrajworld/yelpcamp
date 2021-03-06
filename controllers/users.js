const User = require('../models/user')

module.exports.renderRegister = (req, res) => {
    res.render('users/register')
}

module.exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body
        const user = new User({ username: username, email: email })
        const newUser = await User.register(user, password)
        req.login(newUser, err => {
            if (err) {
                return next(err)
            }
            else {
                req.flash('success', 'Welcome to Yelp Camp!')
                res.redirect('/campgrounds')
            }
        })
    }
    catch (e) {
        req.flash('error', e.message)
        res.redirect('/register')
    }
}

module.exports.renderLogin = (req, res) => {
    res.render('users/login')
}

module.exports.login = (req, res) => {
    req.flash('success', 'Welcome back!')
    const redirectUrl = req.session.returnTo || '/campgrounds'
    delete req.session.returnTo
    res.redirect(redirectUrl)
}

module.exports.logout = (req, res) => {
    req.logout()
    req.flash('success', 'Logged out successfully!')
    res.redirect('/campgrounds')
}

