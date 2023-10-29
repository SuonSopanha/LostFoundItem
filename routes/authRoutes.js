const express = require('express');
const passport = require('../passport');
const User = require('../models/user');
const bcrypt = require('bcrypt');
const flash = require('connect-flash');

const router = express.Router();

// Signup route
router.post('/signup', async (req, res, next) => {
    const name = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    const confirmedPassword = req.body.comfirmPassword;

    // Check if all required fields are provided
    if (!name || !email || !password || !confirmedPassword) {
        const error = true;
        const message = "name, email, password are required";
        res.render('signUpPage', { error: error, message: message });
        return res.status(400);
    }

    // Check if password and confirmed password match
    if (password !== confirmedPassword) {
        const error = true;
        const message = "password and confirmedPassword don't match";
        res.render('signUpPage', { error: error, message: message });
        return res.status(400);
    }

    // Check if password length is at least 8 characters
    if (password.length < 8) {
        const error = true;
        const message = "password must be at least 8 characters";
        res.render('signUpPage', { error: error, message: message });
        return res.status(400);
    }

    // Check if password contains both numbers and alphabets
    if (!/^[a-zA-Z0-9]+$/.test(password)) {
        const error = true;
        const message = "password must contain numbers and alphabets";
        res.render('signUpPage', { error: error, message: message });
        return res.status(400);
    }

    // Hash the password
    const hash = await bcrypt.hash(password, 10);

    // Create a new user with the hashed password
    const newUser = new User({
        name: name,
        email: email,
        password: hash
    });

    try {
        await newUser.save();
        res.redirect('/signupSuc');
    } catch (err) {
        next(err);
    }
});


// Login route
router.post('/login', passport.authenticate('local', { failureRedirect: '/loginFailed', failureFlash: true }), (req, res) => {
    res.redirect('/LoginSuc');
});


// Google OAuth2.0 route
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
    res.redirect('/LoginSuc');
});

// Logout route
router.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/');
    });
});

module.exports = router;