const express = require("express");
const router = express.Router();

const {
  getHistory,
  deleteInterview,
} = require("../controllers/historyController");

const authMiddleware = require("../middleware/authMiddleware");

router.get("/", authMiddleware, getHistory);

router.delete("/:id", deleteInterview);

module.exports = router;