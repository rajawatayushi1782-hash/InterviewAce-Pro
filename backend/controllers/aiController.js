const ai = require("../config/gemini");
const Interview = require("../models/Interview");
const Resume = require("../models/Resume");
// =======================================
// ERROR RESPONSE HELPER
// =======================================

const handleError = (res, err, defaultMessage) => {

  console.error("AI Controller Error:", err);

  // Gemini quota exceeded
  if (
    err?.status === 429 ||
    err?.message?.includes("RESOURCE_EXHAUSTED") ||
    err?.message?.includes("Quota")
  ) {
    return res.status(429).json({
      success: false,
      message:
        "Gemini API quota exceeded. Please wait a minute and try again, or use another API key.",
    });
  }

  return res.status(500).json({
    success: false,
    message: err?.message || defaultMessage,
  });
};
// =======================================
// SAFE JSON PARSER
// =======================================

const extractJSON = (text) => {

  try {

    if (!text) return null;

    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const start = text.indexOf("{");

    const end = text.lastIndexOf("}");

    if (start === -1 || end === -1) {

      return null;

    }

    const json = text.substring(
      start,
      end + 1
    );

    return JSON.parse(json);

  } catch (err) {

    console.log("JSON Parse Error");

    return null;

  }

};
// =======================================
// GEMINI REQUEST WITH RETRY
// =======================================

const generateAIResponse = async (prompt) => {

  let lastError = null;

  for (let attempt = 1; attempt <= 2; attempt++) {

    try {

      const response =
  await ai.models.generateContent({

    model: "gemini-3.5-flash",

    contents: prompt,

  });

console.log("========== GEMINI RAW ==========");
console.log(response);
console.log("================================");

const result = extractJSON(
  response.text
);

      if (result) {

        return result;

      }

      throw new Error(
        "Invalid JSON received"
      );

    } catch (err) {

      lastError = err;

      console.log(
        `Gemini Attempt ${attempt} Failed`
      );

    }

  }

  throw lastError;

};

// =======================================
// START INTERVIEW
// =======================================

const generateQuestion = async (req, res) => {

  try {

    const {
      role,
      level,
      experience,
      type,
      company,
      language,
      resumeId,
    } = req.body;
    if (!role || !level || !type || !language) {

  return res.status(400).json({

    success: false,

    message: "Required interview details are missing.",

  });

}

    let resumeText = "";

    if (resumeId) {

      const resume =
        await Resume.findById(resumeId);

      if (resume) {

        resumeText = resume.resumeText;

      }

    }

    const prompt = `

You are InterviewAce AI.

Conduct a realistic mock interview.

Candidate Details

Role : ${role}

Experience : ${experience}

Interview Type : ${type}

Difficulty : ${level}

Target Company : ${company || "General"}

Language : ${language}

Candidate Resume

${resumeText || "No Resume Uploaded"}

Instructions

- Read the resume carefully.
- Ask questions mainly from projects, internships, technologies, achievements and skills mentioned in the resume.
- If resume is empty, ask normal interview questions.
- Behave like a Senior Software Engineer.
- Ask only ONE interview question.
- Never answer your own question.
- Never repeat previous questions.
- Do not add explanations.

`;

    const response =
      await ai.models.generateContent({

        model: "gemini-3.5-flash",

        contents: prompt,

      });

    const interview =
      await Interview.create({
  
        userId: req.user.id,
        role,

        level,

        experience,

        interviewType: type,

        company,

        language,

        resumeText,

        analysis: {

          overallScore: 0,

          technical: 0,

          communication: 0,

          confidence: 0,

          grammar: 0,

          fluency: 0,

          atsScore: 0,

          summary: "",

          strengths: [],

          weaknesses: [],

          suggestions: [],

          skills: [],

        },

        messages: [

          {

            role: "assistant",

            content: response.text,

          },

        ],

      });

    res.json({

      success: true,

      interviewId: interview._id,

      question: response.text,

    });

  } catch (err) {

  return handleError(

    res,

    err,

    "Failed to start interview"

  );

}

};
// =======================================
// NEXT QUESTION
// =======================================

const nextQuestion = async (req, res) => {

  try {

    const { interviewId, answer } = req.body;
    if (!interviewId) {

  return res.status(400).json({

    success: false,

    message: "Interview ID is required.",

  });

}

if (
  typeof answer !== "string" ||
  !answer.trim()
) {

  return res.status(400).json({

    success: false,

    message: "Answer is required.",

  });

}

    const interview = await Interview.findOne({
  _id: interviewId,
  userId: req.user.id,
});

    if (!interview) {

      return res.status(404).json({

        success: false,

        message: "Interview not found",

      });

    }

    interview.messages.push({

  role: "user",

  content: answer,

  feedback: "",

  scores: {}

});

    const history = interview.messages

      .map(
        (m) => `${m.role}: ${m.content}`
      )

      .join("\n");

    const prompt = `

You are InterviewAce AI.
Candidate Details

Role:
${interview.role}

Difficulty:
${interview.level}

Target Company:
${interview.company || "General"}

Experience:
${interview.experience}

Candidate Resume

${interview.resumeText}

Interview History

${history}

Latest Candidate Answer

${answer}

Instructions

- Read the resume carefully.
- Evaluate ONLY the latest answer.
- Give feedback in ONE sentence.
 
 Follow-up Rules

- If the candidate mentions any technology, framework, tool, project or concept in the latest answer, ask a follow-up question on the SAME topic.
- Only move to a new topic if the current topic has been explored sufficiently.
- Behave like a real interviewer by drilling deeper into the candidate's answer.

Difficulty Rules:

- If latest score is above 80, ask a HARDER question.
- If latest score is between 50 and 80, keep the SAME difficulty.
- If latest score is below 50, ask an EASIER conceptual question.

Company Rules:

- Follow the interview style of ${interview.company || "General Company"}.
- If the company is Google or Amazon or Microsoft, ask questions matching their interview style.
- Prefer resume-based questions whenever possible.
- Never repeat previous questions.
- Ask ONLY ONE next interview question.

Also generate interview analysis.

Return ONLY valid JSON.

{
  "feedback":"",
  "idealAnswer":"",
  "question":"",
  "score":0,
  "technical":0,
  "communication":0,
  "confidence":0,
  "grammar":0,
  "fluency":0,
  "strengths":["",""],
  "weaknesses":["",""],
  "suggestions":["",""],
  "summary":""
}

`;

    const result =
  await generateAIResponse(prompt);

    interview.messages.push({

      role: "assistant",

      content: result.question,

    });
const lastMessage =
  interview.messages[
    interview.messages.length - 1
  ];

lastMessage.feedback =
  result.feedback ?? "";

lastMessage.scores = {

  technical:
    result.technical ?? 0,

  communication:
    result.communication ?? 0,

  confidence:
    result.confidence ?? 0,

  grammar:
    result.grammar ?? 0,

  fluency:
    result.fluency ?? 0,

};
lastMessage.idealAnswer =
  result.idealAnswer ?? "";
    interview.analysis = {

      overallScore:
        result.score ?? 0,

      technical:
        result.technical ?? 0,

      communication:
        result.communication ?? 0,

      confidence:
        result.confidence ?? 0,

      grammar:
        result.grammar ?? 0,

      fluency:
        result.fluency ?? 0,

      atsScore:
        result.score ?? 0,

      summary:
        result.summary ?? "",

      strengths:
        result.strengths ?? [],

      weaknesses:
        result.weaknesses ?? [],

      suggestions:
        result.suggestions ?? [],

      skills:
        interview.analysis?.skills || [],

    };

    await interview.save();

    res.json({

      success: true,

      feedback:
        result.feedback,

      question:
        result.question,

      score:
        result.score,

      technical:
        result.technical,

      communication:
        result.communication,

      confidence:
        result.confidence,

      grammar:
        result.grammar,

      fluency:
        result.fluency,

      strengths:
        result.strengths,

      weaknesses:
        result.weaknesses,

      suggestions:
        result.suggestions,

      summary:
        result.summary,

    });

  } catch (err) {

  return handleError(

    res,

    err,

    "Failed to continue interview"

  );

}

};
// =======================================
// END INTERVIEW
// =======================================


const endInterview = async (req, res) => {

  try {

    const { interviewId } = req.body;

    if (!interviewId) {

      return res.status(400).json({

        success: false,

        message: "Interview ID is required",

      });

    }

    const interview = await Interview.findOne({
  _id: interviewId,
  userId: req.user.id,
});

    if (!interview) {

      return res.status(404).json({

        success: false,

        message: "Interview not found",

      });

    }

    const history = interview.messages

      .map(
        (message) =>
          `${message.role}: ${message.content}`
      )

      .join("\n");

    const prompt = `

You are InterviewAce AI.

Analyze the COMPLETE interview.

Candidate Role:
${interview.role}

Experience:
${interview.experience}

Interview Type:
${interview.interviewType}

Interview History:

${history}

Evaluate the candidate's COMPLETE interview.

Give realistic scores.

Also estimate the candidate's hiring probability for each company based on the interview performance.

Return realistic percentages between 0 and 100.
Do not give all companies similar scores.
OverallMarketReadiness should represent the candidate's overall placement readiness.

Return ONLY valid JSON.

{
  "overallScore":0,

  "technical":0,

  "communication":0,

  "confidence":0,

  "grammar":0,

  "fluency":0,

  "strengths":["",""],

  "weaknesses":["",""],

  "suggestions":["",""],

  "recommendation":"",

  "recommendationDetails":{
    "recommendation":"",
    "confidence":0,
    "reason":"",
    "role":""
  },

  "skillGap":{
    "currentSkills":["",""],
    "missingSkills":["",""],
    "priority":["","",""],
    "estimatedDays":0
  },
"hiringProbability": {
  "google": 0,
  "amazon": 0,
  "microsoft": 0,
  "adobe": 0,
  "infosys": 0,
  "tcs": 0,
  "accenture": 0,
  "overallMarketReadiness": 0
},

  "summary":""
}

`;

    const result = await generateAIResponse(prompt);
    console.log("Gemini Final Report:");
    console.log(
  "Parsed JSON Result:"
);

console.log(
  JSON.stringify(result, null, 2)
);
    interview.analysis = {

      overallScore:
        result.overallScore ?? 0,

      technical:
        result.technical ?? 0,

      communication:
        result.communication ?? 0,

      confidence:
        result.confidence ?? 0,

      grammar:
        result.grammar ?? 0,

      fluency:
        result.fluency ?? 0,

      atsScore:
        result.overallScore ?? 0,

      summary:
        result.summary ?? "",

      strengths:
        result.strengths ?? [],

      weaknesses:
        result.weaknesses ?? [],

      suggestions:
        result.suggestions ?? [],

      

      recommendation:
        result.recommendation ?? "",
        
      recommendationDetails: {

  recommendation:
    result.recommendationDetails?.recommendation ?? "",

  confidence:
    result.recommendationDetails?.confidence ?? 0,

  reason:
    result.recommendationDetails?.reason ?? "",

  role:
    result.recommendationDetails?.role ?? "",

},
  skillGap: {

  currentSkills:
    result.skillGap?.currentSkills ?? [],

  missingSkills:
    result.skillGap?.missingSkills ?? [],

  priority:
    result.skillGap?.priority ?? [],

  estimatedDays:
    result.skillGap?.estimatedDays ?? 0,

},
  hiringProbability: {

  google:
    result.hiringProbability?.google ?? 0,

  amazon:
    result.hiringProbability?.amazon ?? 0,

  microsoft:
    result.hiringProbability?.microsoft ?? 0,

  adobe:
    result.hiringProbability?.adobe ?? 0,

  infosys:
    result.hiringProbability?.infosys ?? 0,

  tcs:
    result.hiringProbability?.tcs ?? 0,

  accenture:
    result.hiringProbability?.accenture ?? 0,

  overallMarketReadiness:
    result.hiringProbability?.overallMarketReadiness ?? 0,

},
      skills:
        interview.analysis?.skills ?? [],

    };

    interview.status = "completed";

    interview.completedAt = new Date();

    interview.duration = Math.max(
      1,
      Math.floor(
        (interview.completedAt - interview.createdAt) /
        (1000 * 60)
      )
    );

    await interview.save();

    return res.json({
  success: true,

  interviewId: interview._id,

  report: interview.analysis,

  messages: interview.messages,

  interview: {
    role: interview.role,
    company: interview.company,
    level: interview.level,
    experience: interview.experience,
    language: interview.language,
    interviewType: interview.interviewType,
    duration: interview.duration,
    integrity: interview.integrity,
    completedAt: interview.completedAt,
  },
});

  } catch (err) {

    return handleError(

      res,

      err,

      "Failed to end interview"

    );

  }

};
// =======================================
// GET INTERVIEW REPORT
// =======================================

const getReport = async (req, res) => {

  try {

    const { interviewId } = req.params;
    if (!interviewId) {

  return res.status(400).json({

    success: false,

    message: "Interview ID is required.",

  });

}

   const interview = await Interview.findOne({
  _id: interviewId,
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

  report: interview.analysis,

  messages: interview.messages,

  interview: {

    role: interview.role,

    company: interview.company,

    level: interview.level,

    experience: interview.experience,

    language: interview.language,

    interviewType: interview.interviewType,

    duration: interview.duration,

    integrity: interview.integrity,

    completedAt: interview.completedAt,

  },

});

  } catch (err) {

  return handleError(

    res,

    err,

    "Failed to fetch report"

  );

}

};
const reportViolation = async (req, res) => {
  try {
    const { interviewId, type } = req.body;

    const Interview = require("../models/Interview");

    const interview = await Interview.findById(interviewId);

    if (!interview) {
      return res.status(404).json({
        message: "Interview not found",
      });
    }

    switch (type) {

      case "camera":
        interview.integrity.cameraDisconnects++;
        interview.integrity.integrityScore -= 20;
        break;

      case "tab":
        interview.integrity.tabSwitches++;
        interview.integrity.integrityScore -= 10;
        break;

      case "fullscreen":
        interview.integrity.fullscreenExits++;
        interview.integrity.integrityScore -= 15;
        break;

      default:
        break;
    }

    if (interview.integrity.integrityScore < 0) {
      interview.integrity.integrityScore = 0;
    }

    const totalViolations =
      interview.integrity.cameraDisconnects +
      interview.integrity.tabSwitches +
      interview.integrity.fullscreenExits;

    if (totalViolations >= 3) {

      interview.status = "terminated";

      interview.integrity.terminationReason =
        "Integrity violations exceeded limit";

    }

    await interview.save();

    res.json({
      success: true,
      integrity: interview.integrity,
      status: interview.status,
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Internal Server Error",
    });

  }
};

// =======================================
// EXPORTS
// =======================================

module.exports = {
  generateQuestion,
  nextQuestion,
  endInterview,
  getReport,
  reportViolation,
};