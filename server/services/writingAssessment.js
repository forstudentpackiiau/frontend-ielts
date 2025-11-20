/**
 * Free AI writing assessment service using intelligent rule-based analysis
 * Evaluates writing based on IELTS writing criteria
 *
 * @param {string} text - The writing text to assess
 * @param {string} task - 'task1' or 'task2'
 * @param {number} wordCount - Word count of the text
 * @returns {Promise<object>} Assessment results
 */
async function assessWriting(text, task = "task1", wordCount = 0) {
  try {
    // Basic checks
    const minWords = task === "task1" ? 150 : 250;
    const wordCountScore = calculateWordCountScore(wordCount, minWords);

    // Simple rule-based assessment (no API key needed)
    const assessment = {
      taskAchievement: assessTaskAchievement(text, wordCount, minWords, task),
      coherenceCohesion: assessCoherenceCohesion(text),
      lexicalResource: assessLexicalResource(text, wordCount),
      grammaticalRange: assessGrammaticalRange(text),
      overallBand: 0,
      feedback: [],
      wordCount: wordCount,
      minWords: minWords,
    };

    // Calculate overall band score (average of all criteria)
    assessment.overallBand =
      (assessment.taskAchievement.band +
        assessment.coherenceCohesion.band +
        assessment.lexicalResource.band +
        assessment.grammaticalRange.band) /
      4;

    // Round to nearest 0.5
    assessment.overallBand = Math.round(assessment.overallBand * 2) / 2;

    // Generate overall feedback
    assessment.feedback = generateOverallFeedback(assessment, task);

    return assessment;
  } catch (error) {
    console.error("Error in writing assessment:", error);

    // Return a basic assessment if AI fails
    return {
      taskAchievement: {
        band: 5.0,
        feedback: "Could not fully assess task achievement.",
      },
      coherenceCohesion: {
        band: 5.0,
        feedback: "Could not fully assess coherence and cohesion.",
      },
      lexicalResource: {
        band: 5.0,
        feedback: "Could not fully assess lexical resource.",
      },
      grammaticalRange: {
        band: 5.0,
        feedback: "Could not fully assess grammatical range.",
      },
      overallBand: 5.0,
      feedback: [
        "Assessment completed with basic rules. For detailed feedback, please try again.",
      ],
      wordCount: wordCount,
      minWords: task === "task1" ? 150 : 250,
    };
  }
}

/**
 * Calculate word count score
 */
function calculateWordCountScore(wordCount, minWords) {
  if (wordCount < minWords * 0.8) return 4.0; // Significantly under
  if (wordCount < minWords) return 5.0; // Slightly under
  if (wordCount >= minWords && wordCount <= minWords * 1.5) return 7.0; // Good range
  if (wordCount > minWords * 2) return 6.0; // Too long
  return 7.0;
}

/**
 * Assess Task Achievement (Band 1-9)
 */
function assessTaskAchievement(text, wordCount, minWords, task) {
  let band = 5.0;
  const feedback = [];

  // Word count check
  if (wordCount < minWords) {
    band -= 1.0;
    feedback.push(
      `⚠️ Under word count: ${wordCount}/${minWords} words. This significantly affects your score.`
    );
  } else if (wordCount < minWords * 0.9) {
    band -= 0.5;
    feedback.push(
      `⚠️ Slightly under word count: ${wordCount}/${minWords} words.`
    );
  } else {
    feedback.push(`✓ Good word count: ${wordCount}/${minWords} words.`);
  }

  // Content organization
  const paragraphs = text.split("\n\n").filter((p) => p.trim().length > 0);

  if (task === "task1") {
    // Task 1 should have introduction, overview, and details
    if (paragraphs.length >= 3) {
      band += 0.5;
      feedback.push("✓ Good paragraph structure for Task 1.");
    } else {
      feedback.push(
        "⚠️ Task 1 should include: introduction, overview, and body paragraphs with details."
      );
    }
  } else {
    // Task 2 should have introduction, 2-3 body paragraphs, conclusion
    if (paragraphs.length >= 4) {
      band += 0.5;
      feedback.push(
        "✓ Good essay structure with introduction, body paragraphs, and conclusion."
      );
    } else if (paragraphs.length >= 3) {
      feedback.push(
        "⚠️ Consider adding more body paragraphs to fully develop your ideas."
      );
    } else {
      band -= 0.5;
      feedback.push(
        "⚠️ Essay should have introduction, body paragraphs, and conclusion."
      );
    }
  }

  // Ensure band is between 1 and 9
  band = Math.max(1, Math.min(9, band));

  return {
    band: Math.round(band * 2) / 2, // Round to nearest 0.5
    feedback: feedback.join(" "),
  };
}

/**
 * Assess Coherence and Cohesion (Band 1-9)
 */
function assessCoherenceCohesion(text) {
  let band = 5.0;
  const feedback = [];

  // Check for linking words
  const linkingWords = [
    "however",
    "moreover",
    "furthermore",
    "therefore",
    "thus",
    "consequently",
    "additionally",
    "in addition",
    "for example",
    "for instance",
    "such as",
    "in contrast",
    "on the other hand",
    "similarly",
    "likewise",
    "meanwhile",
    "firstly",
    "secondly",
    "finally",
    "in conclusion",
    "to sum up",
  ];

  const textLower = text.toLowerCase();
  const foundLinkingWords = linkingWords.filter((word) =>
    textLower.includes(word)
  );

  if (foundLinkingWords.length >= 5) {
    band += 1.0;
    feedback.push("✓ Excellent use of cohesive devices.");
  } else if (foundLinkingWords.length >= 3) {
    band += 0.5;
    feedback.push("✓ Good use of linking words.");
  } else {
    band -= 0.5;
    feedback.push(
      "⚠️ Use more linking words to connect your ideas (e.g., however, moreover, therefore)."
    );
  }

  // Check paragraph organization
  const paragraphs = text.split("\n\n").filter((p) => p.trim().length > 0);
  if (paragraphs.length >= 3) {
    band += 0.5;
    feedback.push("✓ Text is well-organized into paragraphs.");
  } else {
    feedback.push("⚠️ Organize your writing into clear paragraphs.");
  }

  // Check for topic sentences (sentences starting paragraphs)
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10);
  if (sentences.length >= 5) {
    band += 0.5;
    feedback.push("✓ Good sentence variety and structure.");
  }

  band = Math.max(1, Math.min(9, band));

  return {
    band: Math.round(band * 2) / 2,
    feedback: feedback.join(" "),
  };
}

/**
 * Assess Lexical Resource (Band 1-9)
 */
function assessLexicalResource(text, wordCount) {
  let band = 5.0;
  const feedback = [];

  // Calculate unique words
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const uniqueWords = new Set(words);
  const vocabularyRatio = uniqueWords.size / words.length;

  if (vocabularyRatio > 0.6) {
    band += 1.0;
    feedback.push("✓ Excellent vocabulary range with minimal repetition.");
  } else if (vocabularyRatio > 0.5) {
    band += 0.5;
    feedback.push("✓ Good vocabulary variety.");
  } else {
    band -= 0.5;
    feedback.push("⚠️ Try to use more varied vocabulary and avoid repetition.");
  }

  // Check for advanced vocabulary indicators
  const advancedWords = [
    "significant",
    "demonstrate",
    "illustrate",
    "evident",
    "substantial",
    "comprehensive",
    "crucial",
    "facilitate",
    "emphasize",
    "component",
    "implement",
    "perspective",
    "consequence",
    "attribute",
    "phenomenon",
  ];

  const textLower = text.toLowerCase();
  const foundAdvancedWords = advancedWords.filter((word) =>
    textLower.includes(word)
  );

  if (foundAdvancedWords.length >= 3) {
    band += 0.5;
    feedback.push("✓ Good use of academic/advanced vocabulary.");
  }

  // Check average word length (longer words often indicate better vocabulary)
  const avgWordLength =
    words.reduce((sum, word) => sum + word.length, 0) / words.length;
  if (avgWordLength > 5.5) {
    band += 0.5;
  }

  band = Math.max(1, Math.min(9, band));

  return {
    band: Math.round(band * 2) / 2,
    feedback: feedback.join(" "),
  };
}

/**
 * Assess Grammatical Range and Accuracy (Band 1-9)
 */
function assessGrammaticalRange(text) {
  let band = 5.0;
  const feedback = [];

  // Check for complex sentences (with subordinate clauses)
  const complexIndicators = [
    "which",
    "that",
    "who",
    "where",
    "when",
    "although",
    "because",
    "while",
    "since",
  ];
  const textLower = text.toLowerCase();
  const foundComplexIndicators = complexIndicators.filter((word) =>
    textLower.includes(` ${word} `)
  );

  if (foundComplexIndicators.length >= 5) {
    band += 1.0;
    feedback.push("✓ Excellent use of complex sentence structures.");
  } else if (foundComplexIndicators.length >= 3) {
    band += 0.5;
    feedback.push("✓ Good variety of sentence structures.");
  } else {
    band -= 0.5;
    feedback.push(
      "⚠️ Use more complex sentences to demonstrate grammatical range."
    );
  }

  // Check for passive voice (academic writing indicator)
  const passiveIndicators = [
    " is ",
    " are ",
    " was ",
    " were ",
    " been ",
    " being ",
  ];
  const passiveCount = passiveIndicators.filter((phrase) =>
    textLower.includes(phrase)
  ).length;

  if (passiveCount >= 2) {
    band += 0.5;
    feedback.push("✓ Good use of passive voice.");
  }

  // Check sentence length variety
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 5);
  const sentenceLengths = sentences.map((s) => s.trim().split(/\s+/).length);
  const avgLength =
    sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;

  if (avgLength > 15 && avgLength < 25) {
    band += 0.5;
    feedback.push("✓ Good sentence length variety.");
  } else if (avgLength < 10) {
    feedback.push("⚠️ Try using longer, more complex sentences.");
  }

  band = Math.max(1, Math.min(9, band));

  return {
    band: Math.round(band * 2) / 2,
    feedback: feedback.join(" "),
  };
}

/**
 * Generate overall feedback
 */
function generateOverallFeedback(assessment, task) {
  const feedback = [];

  feedback.push(`📊 Overall Band Score: ${assessment.overallBand}`);
  feedback.push("");
  feedback.push("📝 Breakdown:");
  feedback.push(`• Task Achievement: ${assessment.taskAchievement.band}`);
  feedback.push(`• Coherence & Cohesion: ${assessment.coherenceCohesion.band}`);
  feedback.push(`• Lexical Resource: ${assessment.lexicalResource.band}`);
  feedback.push(`• Grammatical Range: ${assessment.grammaticalRange.band}`);
  feedback.push("");

  if (assessment.overallBand >= 7.0) {
    feedback.push(
      "✅ Excellent work! Your writing demonstrates strong IELTS writing skills."
    );
  } else if (assessment.overallBand >= 6.0) {
    feedback.push(
      "✓ Good effort! With some improvements, you can achieve a higher band score."
    );
  } else {
    feedback.push(
      "⚠️ Your writing needs more development. Focus on the feedback below to improve."
    );
  }

  return feedback;
}

/**
 * Count words in text
 */
function countWords(text) {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

module.exports = {
  assessWriting,
  countWords,
};
