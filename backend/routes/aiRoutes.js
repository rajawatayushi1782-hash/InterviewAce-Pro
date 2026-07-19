const authMiddleware = require("../middleware/authMiddleware");
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

router.post("/question", authMiddleware, generateQuestion);

// =======================================
// NEXT QUESTION
// =======================================

router.post("/next-question", authMiddleware, nextQuestion);

// =======================================
// END INTERVIEW
// =======================================

router.post("/end-interview", authMiddleware, endInterview);   

// =======================================
// REPORT INTERVIEW VIOLATION
// =======================================

router.post("/violation", authMiddleware, reportViolation);
// =======================================
// GET INTERVIEW REPORT
// =======================================


router.get("/report/:interviewId", authMiddleware, getReport);

module.exports = router;