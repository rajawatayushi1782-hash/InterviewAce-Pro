const fs = require("fs");
const pdfParse = require("pdf-parse");

const ai = require("../config/gemini");
const Resume = require("../models/Resume");

const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No Resume Uploaded",
      });
    }

    const pdfBuffer = fs.readFileSync(req.file.path);

    const pdf = await pdfParse(pdfBuffer);

    const prompt = `
You are an ATS Resume Analyzer.

Analyze this resume carefully.

Resume:

${pdf.text}

Return ONLY valid JSON.

{
  "atsScore":92,
  "summary":"...",
  "strengths":[
    "...",
    "...",
    "..."
  ],
  "weaknesses":[
    "...",
    "...",
    "..."
  ],
  "skills":[
    "...",
    "...",
    "..."
  ]
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    let text = response.text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const analysis = JSON.parse(text);

    // Save Resume in MongoDB
    const savedResume = await Resume.create({
      userId: req.body.userId,

      fileName: req.file.originalname,

      filePath: req.file.path,

      resumeText: pdf.text,

      atsScore: analysis.atsScore,

      summary: analysis.summary,

      strengths: analysis.strengths,

      weaknesses: analysis.weaknesses,

      skills: analysis.skills,
    });

    res.status(200).json({
      success: true,

      resumeId: savedResume._id,

      resumeText: pdf.text,

      analysis,
    });

  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Resume Analysis Failed",
    });
  }
};

module.exports = {
  uploadResume,
};