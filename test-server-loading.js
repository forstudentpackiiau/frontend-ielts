// Test script to verify tests are loading from the database
const { getTestsList } = require("./server/data/tests");

console.log("\n=== Testing Test Database Loading ===\n");

const tests = getTestsList();

console.log("Tests by section:");
console.log("- Listening:", tests.listening.length, "tests");
console.log("- Reading:", tests.reading.length, "tests");
console.log("- Writing:", tests.writing.length, "tests");

console.log("\n=== Listening Tests Details ===");
tests.listening.forEach((test, idx) => {
  console.log(`\n${idx + 1}. ${test.title}`);
  console.log(`   ID: ${test.id}`);
  console.log(`   Activated: ${test.activated}`);
  console.log(`   File: ${test._filePath}`);
});

console.log("\n=== Reading Tests Details ===");
if (tests.reading.length === 0) {
  console.log("No reading tests found");
}

console.log("\n=== Writing Tests Details ===");
if (tests.writing.length === 0) {
  console.log("No writing tests found");
}

console.log("\n=== Test Loading Complete ===\n");
