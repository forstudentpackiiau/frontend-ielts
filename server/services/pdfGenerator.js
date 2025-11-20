const PDFDocument = require("pdfkit");

/**
 * Generate a PDF report for a complete IELTS exam submission
 * @param {Object} submission - The submission data with all three sections
 * @param {Object} user - User information
 * @returns {PDFDocument} - The PDF document stream
 */
function generateExamPDF(submission, user) {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
  });

  // Header
  doc
    .fontSize(24)
    .font("Helvetica-Bold")
    .text("IELTS Exam Report", { align: "center" })
    .moveDown();

  // Student Information
  doc
    .fontSize(12)
    .font("Helvetica")
    .text(`Student: ${user.name}`, { continued: true })
    .text(`    Username: ${user.username}`)
    .text(
      `Submission Date: ${new Date(submission.submittedAt).toLocaleString()}`
    )
    .moveDown();

  // Overall Band Score
  doc
    .fontSize(18)
    .font("Helvetica-Bold")
    .fillColor("#2563eb")
    .text(`Overall Band Score: ${submission.overallBandScore || "N/A"}`)
    .fillColor("#000000")
    .moveDown();

  // Section Scores
  doc.fontSize(14).font("Helvetica-Bold").text("Section Scores").moveDown(0.5);

  // Listening Section
  if (submission.listening) {
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("🎧 Listening Test")
      .font("Helvetica")
      .text(`Test: ${submission.listening.testId}`)
      .text(
        `Score: ${submission.listening.correctCount} / ${submission.listening.totalQuestions}`
      )
      .text(`Band Score: ${submission.listening.bandScore}`)
      .text(`Time Spent: ${formatTime(submission.listening.timeSpent)}`)
      .moveDown();
  }

  // Reading Section
  if (submission.reading) {
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("📖 Reading Test")
      .font("Helvetica")
      .text(`Test: ${submission.reading.testId}`)
      .text(
        `Score: ${submission.reading.correctCount} / ${submission.reading.totalQuestions}`
      )
      .text(`Band Score: ${submission.reading.bandScore}`)
      .text(`Time Spent: ${formatTime(submission.reading.timeSpent)}`)
      .moveDown();
  }

  // Writing Section
  if (submission.writing) {
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("✍️ Writing Test")
      .font("Helvetica")
      .text(`Test: ${submission.writing.testId}`)
      .text(`Overall Band Score: ${submission.writing.bandScore}`)
      .text(`Time Spent: ${formatTime(submission.writing.timeSpent)}`)
      .moveDown();

    // Task 1
    if (submission.writing.assessment?.task1) {
      const task1 = submission.writing.assessment.task1;
      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("Task 1 Assessment")
        .font("Helvetica")
        .text(`Band Score: ${task1.overallBand}`)
        .text(`Word Count: ${task1.wordCount}`)
        .moveDown(0.3);

      // Criteria
      doc
        .fontSize(10)
        .text(`Task Achievement: ${task1.taskAchievement?.band || "N/A"}`)
        .text(`Coherence & Cohesion: ${task1.coherenceCohesion?.band || "N/A"}`)
        .text(`Lexical Resource: ${task1.lexicalResource?.band || "N/A"}`)
        .text(`Grammatical Range: ${task1.grammaticalRange?.band || "N/A"}`)
        .moveDown();
    }

    // Task 2
    if (submission.writing.assessment?.task2) {
      const task2 = submission.writing.assessment.task2;
      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("Task 2 Assessment")
        .font("Helvetica")
        .text(`Band Score: ${task2.overallBand}`)
        .text(`Word Count: ${task2.wordCount}`)
        .moveDown(0.3);

      // Criteria
      doc
        .fontSize(10)
        .text(`Task Achievement: ${task2.taskAchievement?.band || "N/A"}`)
        .text(`Coherence & Cohesion: ${task2.coherenceCohesion?.band || "N/A"}`)
        .text(`Lexical Resource: ${task2.lexicalResource?.band || "N/A"}`)
        .text(`Grammatical Range: ${task2.grammaticalRange?.band || "N/A"}`)
        .moveDown();
    }
  }

  // Add page break if needed for detailed answers
  if (doc.y > 650) {
    doc.addPage();
  }

  // Listening Detailed Answers (if available)
  if (submission.listening?.detailedResults) {
    doc
      .addPage()
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Listening - Detailed Answers")
      .moveDown(0.5);

    const results = submission.listening.detailedResults;
    const questions = Object.keys(results).sort((a, b) => {
      const numA = parseInt(a.split("-")[0]);
      const numB = parseInt(b.split("-")[0]);
      return numA - numB;
    });

    questions.forEach((qId, index) => {
      const result = results[qId];
      const isCorrect = result.isCorrect;

      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor(isCorrect ? "#16a34a" : "#dc2626")
        .text(`Q${qId}: ${isCorrect ? "✓" : "✗"}`, { continued: true })
        .fillColor("#000000")
        .text(` Your answer: ${result.userAnswer || "Not answered"}`)
        .text(`   Correct answer: ${result.correctAnswer}`);

      if ((index + 1) % 15 === 0 && index < questions.length - 1) {
        doc
          .addPage()
          .fontSize(14)
          .font("Helvetica-Bold")
          .text("Listening - Detailed Answers (continued)")
          .moveDown(0.5);
      }
    });
  }

  // Reading Detailed Answers (if available)
  if (submission.reading?.detailedResults) {
    doc
      .addPage()
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Reading - Detailed Answers")
      .moveDown(0.5);

    const results = submission.reading.detailedResults;
    const questions = Object.keys(results).sort((a, b) => {
      const numA = parseInt(a.split("-")[0]);
      const numB = parseInt(b.split("-")[0]);
      return numA - numB;
    });

    questions.forEach((qId, index) => {
      const result = results[qId];
      const isCorrect = result.isCorrect;

      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor(isCorrect ? "#16a34a" : "#dc2626")
        .text(`Q${qId}: ${isCorrect ? "✓" : "✗"}`, { continued: true })
        .fillColor("#000000")
        .text(` Your answer: ${result.userAnswer || "Not answered"}`)
        .text(`   Correct answer: ${result.correctAnswer}`);

      if ((index + 1) % 15 === 0 && index < questions.length - 1) {
        doc
          .addPage()
          .fontSize(14)
          .font("Helvetica-Bold")
          .text("Reading - Detailed Answers (continued)")
          .moveDown(0.5);
      }
    });
  }

  // Writing Essays
  if (submission.writing?.answers) {
    doc
      .addPage()
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Writing - Student Essays")
      .moveDown();

    if (submission.writing.answers.task1) {
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Task 1")
        .moveDown(0.3)
        .fontSize(10)
        .font("Helvetica")
        .text(submission.writing.answers.task1, { align: "justify" })
        .moveDown();
    }

    if (submission.writing.answers.task2) {
      if (doc.y > 600) {
        doc.addPage();
      }
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Task 2")
        .moveDown(0.3)
        .fontSize(10)
        .font("Helvetica")
        .text(submission.writing.answers.task2, { align: "justify" })
        .moveDown();
    }
  }

  // Footer
  doc
    .fontSize(8)
    .font("Helvetica")
    .fillColor("#666666")
    .text(
      `Generated on ${new Date().toLocaleString()} | IELTS Exam Platform`,
      50,
      doc.page.height - 50,
      { align: "center" }
    );

  return doc;
}

/**
 * Format time in seconds to readable format
 */
function formatTime(seconds) {
  if (!seconds) return "N/A";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

module.exports = { generateExamPDF };
