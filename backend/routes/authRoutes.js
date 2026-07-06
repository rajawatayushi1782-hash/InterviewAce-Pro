const express = require("express");

const router = express.Router();

const { signup } = require("../controllers/authController");

// Signup Route
router.post("/signup", signup);

module.exports = router;