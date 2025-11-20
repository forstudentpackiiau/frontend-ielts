import React from "react";

export default function TableCompletion({
  data,
  questionKey,
  answers,
  setAnswers,
  currentQuestion,
  setCurrentQuestion,
}) {
  // Remove question range from instructions
  const cleanInstructions = (instructions) => {
    if (!instructions) return "";
    return instructions.replace(/<p><i>Questions? \d+(-\d+)?<\/i><\/p>/g, "");
  };

  if (!data || !data.table) {
    return <div className="text-red-500">Invalid Table Completion data</div>;
  }

  // Parse word limit from instructions
  const parseWordLimit = (instructions) => {
    const match = instructions?.match(
      /NO MORE THAN (\w+)(?:\s+AND\/OR A NUMBER)?(?:\s+WORDS?)?/i
    );
    if (!match) return null;
    const words = {
      ONE: 1,
      TWO: 2,
      THREE: 3,
      FOUR: 4,
    };
    return words[match[1].toUpperCase()] || null;
  };

  const wordLimit = parseWordLimit(data.instructions);

  const validateWordCount = (value, limit) => {
    if (!limit) return true;
    const wordCount = value.trim().split(/\s+/).filter(Boolean).length;
    return wordCount <= limit;
  };

  const handleChange = (questionNumber, value) => {
    if (wordLimit && !validateWordCount(value, wordLimit)) {
      return;
    }
    setAnswers((prev) => ({
      ...prev,
      [questionNumber]: value,
    }));
  };

  // Dynamic input width calculation
  const getInputWidth = (questionNumber) => {
    const value = answers[questionNumber] || "";
    const minWidth = 100;
    const maxWidth = 250;
    const charWidth = 8;
    const calculatedWidth = Math.max(
      minWidth,
      (value.length || 10) * charWidth
    );
    return Math.min(calculatedWidth, maxWidth);
  };

  // Extract question numbers from table cells
  const extractQuestionNumbers = (text) => {
    if (!text) return [];
    const matches = text.matchAll(/\[(\d+)\]/g);
    return Array.from(matches, (m) => parseInt(m[1]));
  };

  // Get all question numbers from table
  const allQuestionNumbers = [];
  data.table.rows.forEach((row) => {
    Object.values(row).forEach((cell) => {
      const numbers = extractQuestionNumbers(cell);
      allQuestionNumbers.push(...numbers);
    });
  });

  const minQuestion = Math.min(...allQuestionNumbers);
  const maxQuestion = Math.max(...allQuestionNumbers);
  const questionRange =
    minQuestion === maxQuestion
      ? `Question ${minQuestion}`
      : `Questions ${minQuestion}-${maxQuestion}`;

  // Render cell content with inputs
  const renderCellContent = (text) => {
    if (!text) return null;

    const parts = text.split(/(\[\d+\])/);

    return parts.map((part, idx) => {
      const match = part.match(/\[(\d+)\]/);
      if (match) {
        const questionNumber = parseInt(match[1]);
        const isActive = currentQuestion === questionNumber;

        return (
          <input
            key={idx}
            type="text"
            value={answers[questionNumber] || ""}
            onChange={(e) => handleChange(questionNumber, e.target.value)}
            onFocus={() => setCurrentQuestion(questionNumber)}
            data-question-id={questionNumber}
            style={{ width: `${getInputWidth(questionNumber)}px` }}
            className={`inline-block mx-1 px-2 py-1 border rounded font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
              isActive
                ? "border-blue-400 bg-blue-50"
                : "border-gray-300 bg-white"
            }`}
            placeholder={questionNumber.toString()}
            title={wordLimit ? `Maximum ${wordLimit} words` : ""}
          />
        );
      }
      return <span key={idx} dangerouslySetInnerHTML={{ __html: part }} />;
    });
  };

  return (
    <div className="space-y-6">
      {/* Question Range Title */}
      <div className="pl-4">
        <h3 className="text-lg font-bold text-gray-900">{questionRange}</h3>
      </div>

      {/* Instructions */}
      {data.instructions && (
        <div className="bg-blue-50 p-4">
          <div
            className="text-base text-gray-800"
            dangerouslySetInnerHTML={{
              __html: cleanInstructions(data.instructions),
            }}
          />
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          {/* Headers */}
          {data.table.headers && (
            <thead>
              <tr className="bg-gray-100">
                {data.table.headers.map((header, idx) => (
                  <th
                    key={idx}
                    className="border border-gray-300 px-4 py-3 text-left font-bold text-gray-800"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
          )}

          {/* Rows */}
          <tbody>
            {data.table.rows.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-gray-50">
                {Object.keys(row).map((key, cellIdx) => (
                  <td
                    key={cellIdx}
                    className="border border-gray-300 px-4 py-3 text-gray-800 align-top"
                  >
                    <div className="flex flex-wrap items-center gap-1">
                      {renderCellContent(row[key])}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
