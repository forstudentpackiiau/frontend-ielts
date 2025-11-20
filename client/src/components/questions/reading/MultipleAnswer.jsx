import React from "react";

export default function MultipleAnswer({
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
    return <div className="text-red-500">Invalid Multiple Answer data</div>;
  }

  const handleChange = (questionNumbers, optionIndex) => {
    // questionNumbers is like "25-26"
    const [q1, q2] = questionNumbers.split("-").map(Number);
    const currentAnswers = [answers[q1], answers[q2]].filter(Boolean);
    const optionLetter = String.fromCharCode(65 + optionIndex); // A, B, C, D, E

    // Toggle selection
    if (currentAnswers.includes(optionLetter)) {
      // Remove the option
      const newAnswers = { ...answers };
      if (newAnswers[q1] === optionLetter) delete newAnswers[q1];
      if (newAnswers[q2] === optionLetter) delete newAnswers[q2];
      setAnswers(newAnswers);
    } else {
      // Add the option if less than 2 selected
      if (currentAnswers.length < 2) {
        const newAnswers = { ...answers };
        if (!newAnswers[q1]) {
          newAnswers[q1] = optionLetter;
        } else if (!newAnswers[q2]) {
          newAnswers[q2] = optionLetter;
        }
        setAnswers(newAnswers);
      }
    }
  };

  const questionNumbers = data.items.map((item) => item.number);
  const minQuestion = questionNumbers[0]?.split("-")[0] || "";
  const maxQuestion = questionNumbers[0]?.split("-")[1] || "";
  const questionRange = `${minQuestion}-${maxQuestion}`;

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-300 pb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          Questions {questionRange}
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
          const [q1, q2] = item.number.split("-").map(Number);
          const selectedAnswers = [answers[q1], answers[q2]].filter(Boolean);

          return (
            <div
              key={item.number}
              id={`question-${q1}`}
              className="border rounded-lg p-6 bg-white"
            >
              <div className="mb-4">
                <div
                  className="text-gray-800 font-medium"
                  dangerouslySetInnerHTML={{ __html: item.question }}
                />
              </div>

              <div className="space-y-3">
                {item.options.map((option, index) => {
                  const optionLetter = String.fromCharCode(65 + index);
                  const isSelected = selectedAnswers.includes(optionLetter);

                  return (
                    <label
                      key={index}
                      className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-300 bg-white hover:border-gray-400"
                      }`}
                      onClick={() => handleChange(item.number, index)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        onFocus={() => setCurrentQuestion(q1)}
                        data-question-id={q1}
                        className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500 mt-0.5"
                      />
                      <div className="flex-1">
                        <span className="font-bold text-gray-800 mr-2">
                          {optionLetter}
                        </span>
                        <span className="text-gray-700">{option}</span>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="mt-4 text-sm text-gray-600">
                Selected: {selectedAnswers.length} of 2
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
