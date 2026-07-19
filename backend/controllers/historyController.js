const Interview = require("../models/Interview");

const getHistory = async (req, res) => {
  try {
    const interviews = await Interview.find({
  userId: req.user.id,
})
      .sort({ createdAt: -1 })
      .select(
        "role company status createdAt analysis.overallScore"
      );

    res.json({
      success: true,
      interviews,
    });

  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Failed to load history",
    });
  }
};

const deleteInterview = async (req, res) => {
  try {

    const interview = await Interview.findOneAndDelete({
  _id: req.params.id,
  userId: req.user.id,
});

if (!interview) {
  return res.status(404).json({
    success: false,
    message: "Interview not found",
  });
}
    res.json({
      success: true,
      message: "Interview deleted successfully",
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      success: false,
      message: "Delete failed",
    });

  }
};

module.exports = {
  getHistory,
  deleteInterview,
};