import React from "react";

export default function MultipleSelection({
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
    return <div className="text-red-500">Invalid Multiple Selection data</div>;
  }

  const item = data.items[0]; // Multiple selection typically has one item with multiple options
  const questionNumbers = item.number.split("-").map(Number); // e.g., "14-18" -> [14, 18]
  const [startQ, endQ] = questionNumbers;
  const totalSelections = endQ - startQ + 1; // e.g., 14-18 = 5 selections

  // Get all currently selected answers for this question range
  const getSelectedAnswers = () => {
    const selected = [];
    for (let i = startQ; i <= endQ; i++) {
      if (answers[i]) {
        selected.push(answers[i]);
      }
    }
    return selected;
  };

  const handleChange = (optionId) => {
    const selectedAnswers = getSelectedAnswers();

    // Check if this option is already selected
    const isSelected = selectedAnswers.includes(optionId);

    if (isSelected) {
      // Remove the option - find which question number has this answer and delete it
      const newAnswers = { ...answers };
      for (let i = startQ; i <= endQ; i++) {
        if (newAnswers[i] === optionId) {
          delete newAnswers[i];
          break;
        }
      }
      setAnswers(newAnswers);
    } else {
      // Add the option if we haven't reached the limit
      if (selectedAnswers.length < totalSelections) {
        // Find the first empty slot
        const newAnswers = { ...answers };
        for (let i = startQ; i <= endQ; i++) {
          if (!newAnswers[i]) {
            newAnswers[i] = optionId;
            break;
          }
        }
        setAnswers(newAnswers);
      }
    }
  };

  const selectedAnswers = getSelectedAnswers();

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-300 pb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          Questions {item.number}
        </h3>
        <div className="bg-blue-50 p-4 rounded">
          <div
            className="text-base text-gray-800"
            dangerouslySetInnerHTML={{
              __html: cleanInstructions(data.instructions),
            }}
          />
        </div>
      </div>

      <div id={`question-${startQ}`} className="border rounded-lg p-6 bg-white">
        <div className="mb-4">
          <div
            className="text-gray-800 font-medium"
            dangerouslySetInnerHTML={{ __html: item.question }}
          />
        </div>

        <div className="space-y-3">
          {item.options.map((option) => {
            const isSelected = selectedAnswers.includes(option.id);

            return (
              <label
                key={option.id}
                className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 bg-white hover:border-gray-400"
                }`}
                onClick={() => handleChange(option.id)}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}}
                  onFocus={() => setCurrentQuestion(startQ)}
                  data-question-id={startQ}
                  className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500 mt-0.5"
                />
                <div className="flex-1">
                  <span className="font-bold text-gray-800 mr-2">
                    {option.id}
                  </span>
                  <span className="text-gray-700">{option.text}</span>
                </div>
              </label>
            );
          })}
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Selected: {selectedAnswers.length} of {totalSelections}
        </div>
      </div>
    </div>
  );
}
