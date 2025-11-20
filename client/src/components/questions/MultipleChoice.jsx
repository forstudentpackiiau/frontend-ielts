export default function MultipleChoice({ question, answers, onAnswerChange }) {
  // Extract questions array from either question.questions or question.data.questions
  const questionsArray = question?.questions || question?.data?.questions;
  const questionTitle = question?.data?.title;
  const questionImage = question?.data?.image;

  // Handle case where question has a questions array (multiple questions)
  if (questionsArray && Array.isArray(questionsArray)) {
    return (
      <div className="space-y-6">
        

        {/* Display image if available */}
        {questionImage && (
          <div className="mb-6 flex justify-center">
            <img
              src={questionImage}
              alt={questionTitle || "Diagram"}
              className="max-w-full h-auto border border-gray-300 rounded-lg shadow-md"
              style={{ maxHeight: "500px" }}
            />
          </div>
        )}

        {questionsArray.map((q, idx) => (
          <div key={idx} className="border border-gray-200 rounded p-4">
            <p className="font-medium text-gray-700 mb-4">
              Question {q.id}: {q.text}
            </p>

            <div className="space-y-2">
              {q.options.map((option, optIdx) => {
                const letter = String.fromCharCode(65 + optIdx); // A, B, C...
                return (
                  <label
                    key={optIdx}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={`question-${q.id}`}
                      value={letter}
                      checked={answers[q.id] === letter}
                      onChange={(e) => onAnswerChange(q.id, e.target.value)}
                      className="w-4 h-4"
                      data-question-id={q.id}
                    />
                    <span>{option}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Handle single question format
  if (!question || !question.options) {
    return <div className="text-red-600">Error: Invalid question data</div>;
  }

  return (
    <div className="border border-gray-200 rounded p-4">
      <p className="font-medium text-gray-700 mb-4">
        Question {question.id}: {question.text}
      </p>

      <div className="space-y-2">
        {question.options.map((option, idx) => {
          const letter = String.fromCharCode(65 + idx); // A, B, C...
          return (
            <label
              key={idx}
              className="flex items-center gap-3 p-3 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                value={letter}
                checked={answers[question.id] === letter}
                onChange={(e) => onAnswerChange(question.id, e.target.value)}
                className="w-4 h-4"
                data-question-id={question.id}
              />
              <span>{option}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
