const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    role: {
      type: String,
      required: true,
    },

    level: {
      type: String,
      required: true,
    },

    experience: {
      type: String,
      default: "",
    },

    interviewType: {
      type: String,
      default: "",
    },

    company: {
      type: String,
      default: "",
    },

    language: {
      type: String,
      default: "English",
    },

    resumeText: {
      type: String,
      default: "",
    },

    analysis: {
      overallScore: {
        type: Number,
        default: 0,
      },

      technical: {
        type: Number,
        default: 0,
      },

      communication: {
        type: Number,
        default: 0,
      },

      confidence: {
        type: Number,
        default: 0,
      },

      grammar: {
        type: Number,
        default: 0,
      },

      fluency: {
        type: Number,
        default: 0,
      },

      atsScore: {
        type: Number,
        default: 0,
      },

      summary: {
        type: String,
        default: "",
      },

      strengths: {
        type: [String],
        default: [],
      },

      weaknesses: {
        type: [String],
        default: [],
      },

      suggestions: {
        type: [String],
        default: [],
      },
      recommendation: {
        type: String,
        default: "",
      },



      recommendationDetails: {
  recommendation: {
    type: String,
    default: "",
  },

  confidence: {
    type: Number,
    default: 0,
  },

  reason: {
    type: String,
    default: "",
  },

  role: {
    type: String,
    default: "",
  },
},

skillGap: {
  currentSkills: {
    type: [String],
    default: [],
  },

  missingSkills: {
    type: [String],
    default: [],
  },

  priority: {
    type: [String],
    default: [],
  },

  estimatedDays: {
    type: Number,
    default: 0,
  },
},
hiringProbability: {

  google: {
    type: Number,
    default: 0,
  },

  amazon: {
    type: Number,
    default: 0,
  },

  microsoft: {
    type: Number,
    default: 0,
  },

  adobe: {
    type: Number,
    default: 0,
  },

  infosys: {
    type: Number,
    default: 0,
  },

  tcs: {
    type: Number,
    default: 0,
  },

  accenture: {
    type: Number,
    default: 0,
  },

  overallMarketReadiness: {
    type: Number,
    default: 0,
  },

},
       skills: {
      type: [String],
     default: [],
       },
    },

    messages: [
  {
    role: {
      type: String,
      default: "",
    },

    content: {
      type: String,
      default: "",
    },

    feedback: {
      type: String,
      default: "",
    },

    idealAnswer: {
      type: String,
      default: "",
    },

    scores: {
      technical: {
        type: Number,
        default: 0,
      },

      communication: {
        type: Number,
        default: 0,
      },

      confidence: {
        type: Number,
        default: 0,
      },

      grammar: {
        type: Number,
        default: 0,
      },

      fluency: {
        type: Number,
        default: 0,
      },
    },
  },
],

   status: {
  type: String,
  enum: [
    "ongoing",
    "completed",
    "cancelled",
    "terminated",
  ],
  default: "ongoing",
},

    completedAt: {
      type: Date,
      default: null,
    },

    duration: {
      type: Number,
      default: 0,
    },
    integrity: {
  cameraDisconnects: {
    type: Number,
    default: 0,
  },

  tabSwitches: {
    type: Number,
    default: 0,
  },

  fullscreenExits: {
    type: Number,
    default: 0,
  },

  faceViolations: {
    type: Number,
    default: 0,
  },

  integrityScore: {
    type: Number,
    default: 100,
  },

  terminationReason: {
    type: String,
    default: "",
  },
},
  },
  {
    timestamps: true,
  }
  
);

module.exports = mongoose.model(
  "Interview",
  interviewSchema
);