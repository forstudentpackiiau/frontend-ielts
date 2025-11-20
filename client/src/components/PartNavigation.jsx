import React from "react";
import { FaCheck } from "../components/Icons";

export default function PartNavigation({
  parts, // Array of part/passage names like ["Part 1", "Part 2"] or ["Passage 1", "Passage 2"]
  currentPart,
  setCurrentPart,
  questions, // Array of question numbers like [1, 2, 3, ..., 40]
  currentQuestion,
  setCurrentQuestion,
  answers = {},
  onSubmit,
  totalParts = 4, // Number of parts (for listening/reading)
  questionsPerPart = 10, // Questions per part (for listening/reading)
  passageQuestions, // Array of arrays: [[1,2,3,...], [14,15,...], [27,28,...]] for explicit question ranges per passage
}) {
  // Support both approaches: explicit arrays OR calculated from totalParts/questionsPerPart
  const partNames =
    parts || Array.from({ length: totalParts }, (_, i) => `Part ${i + 1}`);
  const questionsCount =
    questions && questions.length
      ? questions.length
      : totalParts * questionsPerPart;

  // If passageQuestions is provided, use explicit question ranges
  const partData = passageQuestions
    ? partNames.map((name, idx) => {
        const passageQs = passageQuestions[idx] || [];
        return {
          name,
          start: passageQs.length > 0 ? Math.min(...passageQs) : 0,
          end: passageQs.length > 0 ? Math.max(...passageQs) : 0,
          questions: passageQs,
        };
      })
    : partNames.map((name, idx) => {
        const questionsPerSection =
          questions && questions.length
            ? Math.ceil(questions.length / partNames.length)
            : questionsPerPart;
        return {
          name,
          start: idx * questionsPerSection + 1,
          end: Math.min((idx + 1) * questionsPerSection, questionsCount),
          questions: null,
        };
      });

  // Helper function to check if a question has a valid answer
  const hasAnswer = (questionId) => {
    const answer = answers[questionId];
    if (!answer) return false;

    // For arrays (multiple choice multiple), check if not empty
    if (Array.isArray(answer)) {
      return answer.length > 0;
    }

    // For strings, check if not empty after trimming
    if (typeof answer === "string") {
      return answer.trim() !== "";
    }

    return true;
  };

  return (
    <div className="bg-white p-3 rounded border border-gray-200 shadow-sm w-full overflow-x-auto">
      <div className="flex items-center justify-between gap-2 w-full">
        {partData.map((p, idx) => {
          // Use explicit questions array if provided, otherwise calculate range
          const partQuestionsList =
            p.questions && p.questions.length > 0
              ? p.questions
              : Array.from(
                  { length: p.end - p.start + 1 },
                  (_, i) => p.start + i
                );
          const partQuestionsCount = partQuestionsList.length;
          const partAnsweredCount = partQuestionsList.filter((q) =>
            hasAnswer(q)
          ).length;

          const allAnswered = partAnsweredCount === partQuestionsCount;
          const isCurrent = currentPart === idx;

          return (
            <div
              key={idx}
              className="flex items-center gap-2 flex-1 justify-center"
            >
              {/* Part/Passage Button */}
              <button
                onClick={() => setCurrentPart(idx)}
                className={`font-semibold text-sm px-4 py-2 rounded transition-all flex items-center gap-1 min-w-28 justify-center ${
                  isCurrent
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {p.name}
                {allAnswered && <FaCheck className="w-3 h-3" />}
              </button>

              {/* Content: Numbers or "X of Y" */}
              {isCurrent ? (
                <div className="flex gap-1">
                  {partQuestionsList.map((num) => {
                    const answered = hasAnswer(num);
                    const isActive = currentQuestion === num;

                    return (
                      <button
                        key={num}
                        onClick={() => setCurrentQuestion(num)}
                        className={`w-7 h-7 flex items-center justify-center text-xs rounded transition-all
                          ${
                            answered
                              ? "bg-green-700 text-white border border-green-800"
                              : "bg-gray-100 text-gray-600 border border-gray-300"
                          }
                          ${
                            isActive ? "ring-2 ring-blue-500 ring-offset-1" : ""
                          }
                        `}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <span className="text-xs text-gray-500 font-medium w-20 text-center">
                  {partAnsweredCount} of {partQuestionsCount}
                </span>
              )}
            </div>
          );
        })}

        {/* Submit Button */}
        {onSubmit && (
          <button
            onClick={onSubmit}
            className="px-6 py-1.5 bg-yellow-500 text-white rounded font-medium hover:bg-yellow-600 transition-all shrink-0"
          >
            Submit
          </button>
        )}
      </div>
    </div>
  );
}
