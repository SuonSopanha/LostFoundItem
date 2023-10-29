const express = require('express');
const router = express.Router();
const controller = require('../controllers/controller');
const matching = require('../controllers/matchingSystem'); 
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({storage: storage});

// Define routes with their corresponding controller functions

// GET routes

// Home page route
router.get('/', controller.homepage);

// Lost item page route
router.get('/lostItemPage', controller.lostItemPage);

// Found item page route
router.get('/foundItemPage', controller.foundItemPage);

// Sign-in page route
router.get('/signInPage', controller.signInPage);

// Sign-up page route
router.get('/signUpPage', controller.signUpPage);

// Successful login page route
router.get('/LoginSuc', controller.LoginSuc);

// Successful signup page route
router.get('/signupSuc', controller.signupSuc);

// Form page route
router.get('/form', controller.form);

// Login page route
router.get('/login', controller.login);

// Failed login page route
router.get('/loginFailed', controller.loginFailed);

// Search page route
router.get('/search', controller.search);

// Item detail page route
router.get('/itemDetail/:id', controller.itemDetail);

// Search by category route
router.get('/searchCat/:category', controller.searchCat);

// User profile page route
router.get('/Profile', controller.profile);

// Logout route
router.get('/logout', controller.logout);

// Admin account page route
router.get('/admin/account', controller.adminAccount);

// Admin report page route
router.get('/admin/report', controller.adminReport);

// Admin overview page route
router.get('/admin/overview', controller.adminOverview);

// Edit form page route
router.get('/editForm/:id', controller.formEdit);

// Delete item route
router.get('/delete/:id', controller.delete);

// Message page route
router.get('/message', controller.message);

// Message body page route
router.get('/messageBody/:id', controller.messageBody);

// Matching system route
router.get('/matching', matching.matchingFucntion);

// POST routes

// Form submission route with file upload
router.post('/form', upload.single('image'), controller.postForm);

// Edit item submission route
router.post('/edit/:id', controller.edit);

// Send message submission route
router.post('/send_message/:id', controller.send_message);

router.post('/changeName/:id',controller.changeName);

module.exports = router;
