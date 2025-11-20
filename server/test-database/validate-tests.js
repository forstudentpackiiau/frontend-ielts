const fs = require("fs");
const path = require("path");

// Component validation rules
const componentRules = {
  notes_completion: (data) => {
    if (!data.sections && !data.items) {
      return 'Missing "sections" or "items" property';
    }
    return null;
  },

  form_completion: (data) => {
    if (!data.items && !data.rows && !data.fields) {
      return 'Missing "items", "rows", or "fields" property';
    }
    // Check for nested items that should be flattened
    if (data.items) {
      for (let item of data.items) {
        if (item.items && !item.composite) {
          return `Nested items found without composite flag at label: ${item.label}`;
        }
      }
    }
    return null;
  },

  table_completion: (data) => {
    if (!data.rows || !Array.isArray(data.rows)) {
      return 'Missing or invalid "rows" property';
    }
    // Check if rows use consistent format
    for (let i = 0; i < data.rows.length; i++) {
      const row = data.rows[i];
      const hasCells = row.cells !== undefined;
      const hasCustomProps = Object.keys(row).some(
        (k) => k !== "cells" && k !== "headers"
      );

      if (!hasCells && !hasCustomProps) {
        return `Row ${i} has no valid format (needs cells array or custom properties)`;
      }
    }
    return null;
  },

  map_labeling: (data) => {
    if (!data.questions && !data.items) {
      return 'Missing "questions" or "items" property';
    }
    return null;
  },

  plan_labeling: (data) => {
    if (!data.questions && !data.items) {
      return 'Missing "questions" or "items" property';
    }
    if (!data.image) {
      return 'Missing "image" property';
    }
    return null;
  },

  short_answer: (questions) => {
    if (!Array.isArray(questions)) {
      return "Questions must be an array";
    }
    for (let q of questions) {
      if (!q.id || !q.text) {
        return `Question missing id or text: ${JSON.stringify(q)}`;
      }
    }
    return null;
  },

  multiple_choice: (question) => {
    // Handle both formats: questions array or data.questions
    const questions =
      question.questions || (question.data && question.data.questions);

    if (!questions || !Array.isArray(questions)) {
      return "Questions must be an array (either in questions property or data.questions)";
    }
    for (let q of questions) {
      if (!q.id || !q.options) {
        return `Question ${q.id} missing id or options`;
      }
    }
    return null;
  },

  multiple_choice_multiple: (question) => {
    if (!question.id || !question.options) {
      return "Missing id or options";
    }
    return null;
  },

  matching: (data) => {
    if (!data.options || !data.items) {
      return 'Missing "options" or "items" property';
    }
    return null;
  },

  sentence_completion: (questions) => {
    if (!Array.isArray(questions)) {
      return "Questions must be an array";
    }
    for (let q of questions) {
      if (!q.id || !q.text) {
        return `Question missing id or text: ${JSON.stringify(q)}`;
      }
    }
    return null;
  },

  summary_completion: (data) => {
    if (!data.sections && !data.items) {
      return 'Missing "sections" or "items" property';
    }
    return null;
  },
};

// Validate a single test file
function validateTest(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const test = JSON.parse(content);
    const errors = [];
    const warnings = [];

    // Check basic structure
    if (!test.id || !test.parts) {
      errors.push("Missing basic structure (id or parts)");
      return { errors, warnings };
    }

    // Check each part
    test.parts.forEach((part, partIdx) => {
      if (!part.questions) {
        errors.push(`Part ${partIdx + 1}: Missing questions array`);
        return;
      }

      // Check each question
      part.questions.forEach((question, qIdx) => {
        const qType = question.type;
        const validator = componentRules[qType];

        if (!validator) {
          warnings.push(
            `Part ${partIdx + 1}, Q${
              qIdx + 1
            }: Unknown question type "${qType}"`
          );
          return;
        }

        let error;
        if (qType === "short_answer" || qType === "sentence_completion") {
          error = validator(question.questions);
        } else if (qType === "multiple_choice_multiple") {
          error = validator(question);
        } else if (qType === "multiple_choice") {
          // Pass the whole question object to handle both formats
          error = validator(question);
        } else {
          error = validator(question.data);
        }

        if (error) {
          errors.push(`Part ${partIdx + 1}, Q${qIdx + 1} (${qType}): ${error}`);
        }
      });
    });

    return { errors, warnings };
  } catch (e) {
    return { errors: [`Failed to parse: ${e.message}`], warnings: [] };
  }
}

// Main validation
const testFiles = [
  "cambridge6/test1.json",
  "cambridge6/test2.json",
  "cambridge6/test3.json",
  "cambridge6/test4.json",
  "cambridge7/test1.json",
  "cambridge7/test2.json",
  "cambridge7/test4.json",
  "cambridge8/test1.json",
];

console.log("=".repeat(60));
console.log("IELTS Test JSON Validation Report");
console.log("=".repeat(60));
console.log("");

let totalErrors = 0;
let totalWarnings = 0;

testFiles.forEach((file) => {
  const filePath = path.join(__dirname, "listening", file);
  if (!fs.existsSync(filePath)) {
    console.log(`⊗ ${file}: FILE NOT FOUND`);
    console.log("");
    return;
  }

  const result = validateTest(filePath);

  if (result.errors.length === 0 && result.warnings.length === 0) {
    console.log(`✓ ${file}: ALL CHECKS PASSED`);
  } else {
    console.log(`⚠ ${file}:`);

    if (result.errors.length > 0) {
      console.log(`  ERRORS (${result.errors.length}):`);
      result.errors.forEach((err) => console.log(`    ✗ ${err}`));
      totalErrors += result.errors.length;
    }

    if (result.warnings.length > 0) {
      console.log(`  WARNINGS (${result.warnings.length}):`);
      result.warnings.forEach((warn) => console.log(`    ⚠ ${warn}`));
      totalWarnings += result.warnings.length;
    }
  }

  console.log("");
});

console.log("=".repeat(60));
console.log(`Total: ${totalErrors} errors, ${totalWarnings} warnings`);
console.log("=".repeat(60));

process.exit(totalErrors > 0 ? 1 : 0);
