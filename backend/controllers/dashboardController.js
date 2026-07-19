const Interview = require("../models/Interview");

const getDashboard = async (req, res) => {

  try {

    const totalInterviews = await Interview.countDocuments({
  userId: req.user.id,
});

    const completedInterviews =
  await Interview.countDocuments({
    userId: req.user.id,
    status: "completed",
  });

    const ongoingInterviews =
  await Interview.countDocuments({
    userId: req.user.id,
    status: "ongoing",
  });

    const interviews =
  await Interview.find({
    userId: req.user.id,
    status: "completed",
  });

    let averageScore = 0;

    if (interviews.length > 0) {

      const totalScore = interviews.reduce(

        (sum, interview) =>

          sum +
          (interview.analysis?.overallScore || 0),

        0

      );

      averageScore = Math.round(
        totalScore / interviews.length
      );

    }
    let bestScore = 0;
let averageIntegrityScore = 0;
let totalDuration = 0;
let terminatedInterviews = 0;

if (interviews.length > 0) {

  bestScore = Math.max(
    ...interviews.map(
      (i) => i.analysis?.overallScore || 0
    )
  );

  const integrityTotal = interviews.reduce(
    (sum, i) =>
      sum + (i.integrity?.integrityScore || 100),
    0
  );

  averageIntegrityScore = Math.round(
    integrityTotal / interviews.length
  );

  totalDuration = interviews.reduce(
    (sum, i) =>
      sum + (i.duration || 0),
    0
  );

}

terminatedInterviews =
  await Interview.countDocuments({
    userId: req.user.id,
    status: "terminated",
  });
    const recentInterviews =
  await Interview.find({
    userId: req.user.id,
  })

        .sort({ createdAt: -1 })

        .limit(5)

        .select(
          "role company status createdAt analysis.overallScore"
        );

    res.json({

      success: true,

      statistics: {

  totalInterviews,

  completedInterviews,

  ongoingInterviews,

  terminatedInterviews,

  averageScore,

  bestScore,

  averageIntegrityScore,

  totalDuration,

},

      recentInterviews,

    });

  } catch (err) {

    console.log(err);

    res.status(500).json({

      success: false,

      message: "Failed to load dashboard",

    });

  }

};

module.exports = {

  getDashboard,

};