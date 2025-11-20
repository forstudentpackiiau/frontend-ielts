export default function ShortAnswer({
  data,
  questionKey,
  answers,
  setAnswers,
  currentQuestion,
  setCurrentQuestion,
  questions, // Legacy prop for listening
  onAnswerChange, // Legacy prop for listening
}) {
  // Support both reading format (data.items) and listening format (questions array)
  const items = data?.items || questions || [];

  // Remove question range from instructions
  const cleanInstructions = (instructions) => {
    if (!instructions) return "";
    return instructions.replace(/<p><i>Questions? \d+(-\d+)?<\/i><\/p>/g, "");
  };

  // Extract word limit from instructions
  const getWordLimit = () => {
    if (!data?.instructions) return null;
    const match = data.instructions.match(/NO MORE THAN (\w+) WORD[S]?/i);
    if (match) {
      const wordMap = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
      return wordMap[match[1].toUpperCase()] || parseInt(match[1]);
    }
    return null;
  };

  const wordLimit = getWordLimit();

  const handleChange = (questionNumber, value) => {
    // Validate word count if word limit exists
    if (wordLimit && value.trim()) {
      const wordCount = value.trim().split(/\s+/).length;
      if (wordCount > wordLimit) {
        return; // Don't update if exceeds word limit
      }
    }

    if (onAnswerChange) {
      // Legacy listening format
      onAnswerChange(questionNumber, value);
    } else {
      // Reading format
      setAnswers((prev) => ({
        ...prev,
        [questionNumber]: value,
      }));
    }
  };

  // Calculate dynamic width based on answer length
  const getInputWidth = (itemId) => {
    const answer = answers[itemId] || "";
    const minWidth = 150;
    const maxWidth = 400;
    const charWidth = 8;
    const calculatedWidth = Math.max(
      minWidth,
      Math.min(answer.length * charWidth + 40, maxWidth)
    );
    return `${calculatedWidth}px`;
  };

  if (!items || !Array.isArray(items) || items.length === 0) {
    return <div className="text-red-500">Invalid short answer data</div>;
  }

  // Reading format with data.items
  if (data?.items) {
    // Extract word limit from instructions if present
    const wordLimitMatch = data.instructions?.match(
      /NO MORE THAN (\w+)(?:\s+AND\/OR A NUMBER)?/i
    );
    const wordLimit = wordLimitMatch ? wordLimitMatch[1] : null;

    // Get question range from items
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
              className="text-gray-700 font-medium"
              dangerouslySetInnerHTML={{
                __html: cleanInstructions(data.instructions),
              }}
            />
          </div>
        </div>

        <div className="space-y-4">
          {data.items.map((item) => (
            <div
              key={item.number}
              id={`question-${item.number}`}
              className={`border rounded-lg p-4 transition-all ${
                currentQuestion === item.number
                  ? "border-blue-500 bg-blue-50 shadow-md"
                  : "border-gray-300 bg-white hover:border-gray-400"
              }`}
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <span className="font-bold text-gray-800 text-lg shrink-0">
                    {item.number}
                  </span>
                  <p className="text-gray-800 flex-1">{item.question}</p>
                </div>

                <input
                  type="text"
                  value={answers[item.number] || ""}
                  onChange={(e) => handleChange(item.number, e.target.value)}
                  onFocus={() => setCurrentQuestion(item.number)}
                  data-question-id={item.number}
                  className="px-3 py-2 border border-gray-300 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all w-full max-w-md"
                  placeholder={`${item.number}`}
                  title={
                    wordLimit
                      ? `Maximum ${wordLimit} word${wordLimit > 1 ? "s" : ""}`
                      : undefined
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Legacy listening format
  return (
    <div className="space-y-4">
      {questions.map((question, idx) => (
        <div key={idx} className="border border-gray-200 rounded p-4 bg-white">
          <div className="flex flex-col gap-3">
            <label className="font-medium text-gray-700">
              {question.id}. {question.text}
            </label>
            <input
              type="text"
              value={answers[question.id] || ""}
              onChange={(e) => onAnswerChange(question.id, e.target.value)}
              placeholder="Type your answer here"
              style={{ width: getInputWidth(question.id) }}
              className="input-field"
              data-question-id={question.id}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
