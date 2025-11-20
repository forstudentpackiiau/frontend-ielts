const fs = require("fs");
const path = require("path");
const ActiveTestService = require("../database/activeTestService");

const TEST_DATABASE_PATH = path.join(__dirname, "../test-database");

// Recursively scan a folder for all JSON test files
const scanFolderForTests = (folderPath) => {
  const tests = [];

  try {
    if (!fs.existsSync(folderPath)) {
      return tests;
    }

    const items = fs.readdirSync(folderPath);

    items.forEach((item) => {
      const itemPath = path.join(folderPath, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        // Recursively scan subdirectories
        tests.push(...scanFolderForTests(itemPath));
      } else if (item.endsWith(".json")) {
        // Read JSON file
        try {
          const data = fs.readFileSync(itemPath, "utf8");
          const test = JSON.parse(data);
          // Add file path info to test object
          test._filePath = itemPath;
          tests.push(test);
        } catch (error) {
          console.error(`Error reading test file ${itemPath}:`, error);
        }
      }
    });
  } catch (error) {
    console.error(`Error scanning folder ${folderPath}:`, error);
  }

  return tests;
};

// Get all test files from a specific section folder
const getTestsFromSection = (section) => {
  const sectionPath = path.join(TEST_DATABASE_PATH, section);
  return scanFolderForTests(sectionPath);
};

const getTestData = (testId) => {
  try {
    const sections = ["listening", "reading", "writing"];

    for (const section of sections) {
      const tests = getTestsFromSection(section);
      const test = tests.find((t) => t.id === testId);
      if (test) {
        // Check if this test is activated in the database
        const isActive = ActiveTestService.isTestActive(testId);
        test.activated = isActive;
        test.section = section; // Add section field
        return test;
      }
    }

    return null;
  } catch (error) {
    console.error("Error reading test data:", error);
    return null;
  }
};

// Get list of all available tests organized by section
const getTestsList = () => {
  const listeningTests = getTestsFromSection("listening");
  const readingTests = getTestsFromSection("reading");
  const writingTests = getTestsFromSection("writing");

  // Check activation status from database for each test
  const activeTests = ActiveTestService.getAllActiveTests();

  const markActivation = (tests, section) => {
    return tests.map((test) => {
      const activeTest = activeTests[section];
      test.activated = activeTest && activeTest.testId === test.id;
      return test;
    });
  };

  return {
    listening: markActivation(listeningTests, "listening"),
    reading: markActivation(readingTests, "reading"),
    writing: markActivation(writingTests, "writing"),
  };
};

// Get all tests as a flat array (for backward compatibility)
const getAllTests = () => {
  const testsBySection = getTestsList();
  return [
    ...testsBySection.listening,
    ...testsBySection.reading,
    ...testsBySection.writing,
  ];
};

// Update test activation status
const updateTestActivation = (testId, activated) => {
  try {
    const test = getTestData(testId);
    if (!test || !test._filePath) {
      return { success: false, message: "Test not found" };
    }

    // Determine section from file path (listening, reading, or writing)
    const filePath = test._filePath;
    let section = test.section;

    // If section is not one of the expected values, extract from file path
    if (!["listening", "reading", "writing"].includes(section)) {
      if (filePath.includes("listening")) {
        section = "listening";
      } else if (filePath.includes("reading")) {
        section = "reading";
      } else if (filePath.includes("writing")) {
        section = "writing";
      } else {
        return { success: false, message: "Unable to determine test section" };
      }
    }

    if (activated) {
      // Activate this test - only one test per section can be active
      ActiveTestService.setActiveTest(section, testId, test._filePath);
    } else {
      // Deactivate this test
      const activeTest = ActiveTestService.getActiveTest(section);
      if (activeTest && activeTest.test_id === testId) {
        ActiveTestService.deactivateTest(section);
      }
    }

    return { success: true, message: "Test activation updated" };
  } catch (error) {
    console.error("Error updating test activation:", error);
    return { success: false, message: error.message };
  }
};

module.exports = {
  getTestData,
  getTestsList,
  getAllTests,
  updateTestActivation,
};
