const fs = require("fs");
const path = require("path");

// Script to convert reading test JSON from nested structure to flat passages array

const inputFile = process.argv[2];
const outputFile = process.argv[3];

if (!inputFile) {
  console.error(
    "Usage: node convert-reading-test.js <input-file> [output-file]"
  );
  process.exit(1);
}

try {
  const data = JSON.parse(fs.readFileSync(inputFile, "utf8"));

  const testData = data.ielts_academic_reading_test;

  if (!testData) {
    console.error("Invalid format: missing ielts_academic_reading_test");
    process.exit(1);
  }

  // Generate ID from filename
  const filename = path.basename(inputFile, ".json");
  const dirParts = path.dirname(inputFile).split(path.sep);
  const cambridge = dirParts[dirParts.length - 1]; // e.g., "cambridge6"
  const testId = `reading-${cambridge}-${filename}`;

  // Convert to new format
  const converted = {
    id: testId,
    title: `${cambridge.charAt(0).toUpperCase() + cambridge.slice(1)} Reading ${
      filename.charAt(0).toUpperCase() + filename.slice(1)
    }`,
    module: "reading",
    section: "Academic Reading",
    duration: 3600, // 60 minutes in seconds
    total_questions: testData.test_information?.total_questions || 40,
    passages: [],
  };

  // Convert each passage
  for (let i = 1; i <= 3; i++) {
    const passageKey = `passage_${i}`;
    const passage = testData[passageKey];

    if (passage) {
      converted.passages.push({
        title: passage.title || `Passage ${i}`,
        subtitle: passage.subtitle || undefined,
        content: passage.content,
        questions: passage.questions,
      });
    }
  }

  // Add answers separately
  if (testData.answer_key) {
    converted.answers = testData.answer_key;
  }

  // Write output
  const output = outputFile || inputFile;
  fs.writeFileSync(output, JSON.stringify(converted, null, 2), "utf8");

  console.log(`✅ Converted ${inputFile} -> ${output}`);
  console.log(`   ID: ${converted.id}`);
  console.log(`   Passages: ${converted.passages.length}`);
  console.log(`   Questions: ${converted.total_questions}`);
} catch (error) {
  console.error("Error converting file:", error.message);
  process.exit(1);
}
