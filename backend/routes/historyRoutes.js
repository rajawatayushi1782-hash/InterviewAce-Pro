const express = require("express");
const router = express.Router();

const {
  getHistory,
  deleteInterview,
} = require("../controllers/historyController");

router.get("/", getHistory);

router.delete("/:id", deleteInterview);

module.exports = router;