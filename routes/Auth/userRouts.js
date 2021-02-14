const express = require('express');

const router = express.Router();

const userController = require('../../Controller/userController');
const userMiddleWear = require('../../Utils/auth');

router.post('/register', userController.registerUser);

router.post('/login', userController.loginUser);

router.get('/getall', userMiddleWear, userController.getAllUsers);

router.post('/update', userMiddleWear, userController.updateUser);

router.get('/search', userMiddleWear, userController.searchUser);

module.exports = router;