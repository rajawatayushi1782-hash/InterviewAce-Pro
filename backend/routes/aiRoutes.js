const express = require("express");

const router = express.Router();

const {
  generateQuestion,
  nextQuestion,
  endInterview,
  getReport,
  reportViolation,
} = require("../controllers/aiController");

// =======================================
// START INTERVIEW
// =======================================

router.post("/question", generateQuestion);

// =======================================
// NEXT QUESTION
// =======================================

router.post("/next-question", nextQuestion);

// =======================================
// END INTERVIEW
// =======================================

router.post("/end-interview", endInterview);   

// =======================================
// REPORT INTERVIEW VIOLATION
// =======================================

router.post("/violation", reportViolation);
// =======================================
// GET INTERVIEW REPORT
// =======================================


router.get("/report/:interviewId", getReport);

module.exports = router;