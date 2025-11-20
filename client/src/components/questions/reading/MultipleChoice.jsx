import React from "react";

export default function MultipleChoice({
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

  if (!data || !data.items) {
    return <div className="text-red-500">Invalid Multiple Choice data</div>;
  }

  const handleChange = (questionNumber, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionNumber]: value,
    }));
  };

  const questionNumbers = data.items.map((item) => item.number);
  const minQuestion = Math.min(...questionNumbers);
  const maxQuestion = Math.max(...questionNumbers);
  const questionRange =
    minQuestion === maxQuestion
      ? `${minQuestion}`
      : `${minQuestion}-${maxQuestion}`;
  const questionLabel = minQuestion === maxQuestion ? "Question" : "Questions";

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-300 pb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          {questionLabel} {questionRange}
        </h3>
        <div className="bg-blue-50  p-4 rounded">
          <div
            className="text-base text-gray-800"
            dangerouslySetInnerHTML={{
              __html: cleanInstructions(data.instructions),
            }}
          />
        </div>
      </div>

      <div className="space-y-6">
        {data.items.map((item) => {
          const isActive = currentQuestion === item.number;

          return (
            <div
              key={item.number}
              id={`question-${item.number}`}
              className={`border rounded-lg p-5 transition-all ${
                isActive
                  ? "border-blue-500 bg-blue-50 shadow-md"
                  : "border-gray-300 bg-white hover:border-gray-400"
              }`}
            >
              {/* Question */}
              <div className="mb-4">
                <div className="flex items-start gap-3">
                  <span className="font-bold text-lg text-gray-800">
                    {item.number}
                  </span>
                  <div
                    className="text-gray-800 font-medium flex-1"
                    dangerouslySetInnerHTML={{ __html: item.question }}
                  />
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2 ml-8">
                {item.options.map((option, index) => {
                  const optionLetter = String.fromCharCode(65 + index); // A, B, C, D...
                  const isSelected = answers[item.number] === optionLetter;

                  return (
                    <label
                      key={index}
                      className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? "bg-blue-100 border-2 border-blue-500"
                          : "bg-gray-50 border border-gray-300 hover:bg-gray-100"
                      }`}
                      onClick={() => setCurrentQuestion(item.number)}
                    >
                      <input
                        type="radio"
                        name={`question-${item.number}`}
                        value={optionLetter}
                        checked={isSelected}
                        onChange={(e) =>
                          handleChange(item.number, e.target.value)
                        }
                        data-question-id={item.number}
                        className="mt-1 w-4 h-4 text-blue-600"
                      />
                      <span className="font-bold text-gray-700 min-w-5">
                        {optionLetter}
                      </span>
                      <span className="text-gray-800 flex-1">{option}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
