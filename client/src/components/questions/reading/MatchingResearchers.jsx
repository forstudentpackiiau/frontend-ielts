import React from "react";

export default function MatchingResearchers({
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

  if (!data || !data.items || !data.researchers) {
    return (
      <div className="text-red-500">Invalid Matching Researchers data</div>
    );
  }

  const handleChange = (questionNumber, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionNumber]: value,
    }));
  };

  // Calculate question range
  const questionNumbers = data.items.map((item) => item.number);
  const minQuestion = Math.min(...questionNumbers);
  const maxQuestion = Math.max(...questionNumbers);
  const questionRange =
    minQuestion === maxQuestion
      ? `Question ${minQuestion}`
      : `Questions ${minQuestion}-${maxQuestion}`;

  return (
    <div className="space-y-6">
      {/* Question Range Title */}
      <div className=" pl-4">
        <h3 className="text-lg font-bold text-gray-900">{questionRange}</h3>
      </div>

      {/* Instructions */}
      {data.instructions && (
        <div className="bg-blue-50  p-4">
          <div
            className="text-base text-gray-800"
            dangerouslySetInnerHTML={{
              __html: cleanInstructions(data.instructions),
            }}
          />
        </div>
      )}

      {/* Researchers List */}
      <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-3">
          List of Researchers
        </h4>
        <div className="space-y-2">
          {data.researchers.map((researcher) => (
            <div key={researcher.id} className="flex gap-3">
              <span className="font-bold text-gray-700 min-w-8">
                {researcher.id}
              </span>
              <span className="text-gray-800">{researcher.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {data.items.map((item) => {
          const isActive = currentQuestion === item.number;

          return (
            <div
              key={item.number}
              id={`question-${item.number}`}
              className={`p-4 rounded-lg transition-all ${
                isActive
                  ? "bg-blue-50 border-2 border-blue-400"
                  : "bg-white border border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <span className="font-bold text-lg text-gray-800 shrink-0">
                    {item.number}
                  </span>
                  <div
                    className="text-gray-800 flex-1"
                    dangerouslySetInnerHTML={{ __html: item.statement }}
                  />
                </div>

                <select
                  value={answers[item.number] || ""}
                  onChange={(e) => handleChange(item.number, e.target.value)}
                  onFocus={() => setCurrentQuestion(item.number)}
                  data-question-id={item.number}
                  className="px-2 py-1 border border-gray-300 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shrink-0 min-w-32"
                >
                  <option value="">Select...</option>
                  {data.researchers.map((researcher) => (
                    <option key={researcher.id} value={researcher.id}>
                      {researcher.id} - {researcher.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
