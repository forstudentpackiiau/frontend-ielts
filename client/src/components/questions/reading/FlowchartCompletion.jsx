import React from "react";

export default function FlowchartCompletion({
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

  if (!data || !data.items || !data.flowchart) {
    return (
      <div className="text-red-500">Invalid Flowchart Completion data</div>
    );
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

      {/* Flowchart */}
      {data.flowchart && (
        <div className="bg-white border-2 border-gray-300 rounded-lg p-6">
          {data.flowchart.title && (
            <h4 className="text-center font-bold text-gray-800 mb-6 text-lg">
              {data.flowchart.title}
            </h4>
          )}

          <div className="flex flex-col items-center space-y-4">
            {data.flowchart.steps.map((step, index) => {
              // If it's an arrow
              if (
                step === "↓" ||
                step === "→" ||
                step === "⬇" ||
                step === "⬇️"
              ) {
                return (
                  <div key={index} className="text-3xl text-gray-400">
                    ↓
                  </div>
                );
              }

              // Check if this step contains any question numbers
              const questionsInStep = [];

              // Find all question numbers in this step with brackets [num]
              for (const num of questionNumbers) {
                const regex = new RegExp(`\\[${num}\\]`);
                if (regex.test(step)) {
                  questionsInStep.push(num);
                }
              }

              // If it's a question step (contains at least one question)
              if (questionsInStep.length > 0) {
                // Check if current question is in this step
                const isActive = questionsInStep.includes(currentQuestion);

                // Use the first question number for the ID
                const firstQuestionNum = Math.min(...questionsInStep);

                // Split the step by all question numbers
                let remainingText = step;
                const elements = [];
                let lastIndex = 0;

                // Find all [num] placeholders and their positions
                const placeholderMatches = [];
                for (const num of questionsInStep) {
                  const regex = new RegExp(`\\[${num}\\]`, "g");
                  let match;
                  while ((match = regex.exec(step)) !== null) {
                    placeholderMatches.push({
                      index: match.index,
                      length: match[0].length,
                      questionNum: num,
                      placeholder: match[0],
                    });
                  }
                }

                // Sort by position
                placeholderMatches.sort((a, b) => a.index - b.index);

                // Build elements array
                placeholderMatches.forEach((match, idx) => {
                  // Add text before this placeholder
                  if (match.index > lastIndex) {
                    const textBefore = step.substring(lastIndex, match.index);
                    elements.push(
                      <span key={`text-${idx}`}>{textBefore}</span>
                    );
                  }

                  // Add input for this question
                  elements.push(
                    <input
                      key={`input-${match.questionNum}`}
                      type="text"
                      value={answers[match.questionNum] || ""}
                      onChange={(e) =>
                        handleChange(match.questionNum, e.target.value)
                      }
                      onFocus={() => setCurrentQuestion(match.questionNum)}
                      data-question-id={match.questionNum}
                      placeholder={match.questionNum.toString()}
                      className="inline-block px-2 py-1 border-b-2 border-blue-600 bg-white text-center font-medium focus:outline-none focus:bg-blue-50 focus:border-blue-700 min-w-[120px]"
                    />
                  );

                  lastIndex = match.index + match.length;
                });

                // Add remaining text after last placeholder
                if (lastIndex < step.length) {
                  const textAfter = step.substring(lastIndex);
                  elements.push(<span key="text-end">{textAfter}</span>);
                }

                return (
                  <div
                    key={index}
                    id={`question-${firstQuestionNum}`}
                    className={`w-full max-w-2xl border-2 rounded-lg p-4 transition-all ${
                      isActive
                        ? "border-blue-500 bg-blue-50 shadow-lg"
                        : "border-gray-400 bg-blue-50"
                    }`}
                  >
                    <div className="text-gray-800 whitespace-pre-line text-left">
                      {elements}
                    </div>
                  </div>
                );
              }

              // Regular text step
              return (
                <div
                  key={index}
                  className="w-full max-w-2xl border-2 border-gray-400 bg-gray-50 rounded-lg p-4"
                >
                  <div className="text-gray-800 font-medium whitespace-pre-line text-left">
                    {step}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
