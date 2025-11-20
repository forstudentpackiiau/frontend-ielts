import React from "react";

export default function MatchingFeatures({
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

  if (!data || !data.items || !data.features) {
    return <div className="text-red-500">Invalid Matching Features data</div>;
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
  const questionRange = `Questions ${minQuestion}-${maxQuestion}`;

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

      {/* Features List */}
      {data.features && data.features.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <p className="font-semibold text-gray-700 mb-3">Features:</p>
          {data.features.map((feature) => (
            <div key={feature.id} className="flex gap-3">
              <span className="font-bold text-gray-800 min-w-[30px]">
                {feature.id}
              </span>
              <span className="text-gray-700">{feature.text || feature.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Questions */}
      <div className="space-y-3">
        {data.items.map((item) => {
          const isActive = currentQuestion === item.number;

          return (
            <div
              key={item.number}
              id={`question-${item.number}`}
              className={`flex justify-between items-center gap-4 p-3 rounded-lg transition-all ${
                isActive
                  ? "bg-blue-50 border-2 border-blue-400"
                  : "bg-white border border-gray-200"
              }`}
            >
              {/* Question Number and Text */}
              <div className="flex items-center gap-3 flex-1">
                <span className="font-bold text-lg text-gray-800">
                  {item.number}
                </span>
                <div
                  className="text-gray-700"
                  dangerouslySetInnerHTML={{ __html: item.question }}
                />
              </div>

              {/* Dropdown */}
              <select
                data-question-id={item.number}
                value={answers[item.number] || ""}
                onChange={(e) => handleChange(item.number, e.target.value)}
                onFocus={() => setCurrentQuestion(item.number)}
                className="w-24 px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">{item.number}</option>
                {data.features.map((feature) => (
                  <option key={feature.id} value={feature.id}>
                    {feature.id}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}
