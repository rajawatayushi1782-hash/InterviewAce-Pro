const Interview = require("../models/Interview");

const getHistory = async (req, res) => {
  try {
    const interviews = await Interview.find()
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

    await Interview.findByIdAndDelete(req.params.id);

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