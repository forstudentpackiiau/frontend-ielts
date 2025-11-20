export default function SummaryCompletion({
  data,
  questionKey,
  answers,
  setAnswers,
  currentQuestion,
  setCurrentQuestion,
  onAnswerChange, // Legacy prop for listening
}) {
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

  // Calculate dynamic width based on content
  const getDynamicWidth = (value) => {
    const minWidth = 80;
    const maxWidth = 200;
    const charWidth = 8;
    const calculatedWidth = Math.max(
      minWidth,
      (value?.length || 5) * charWidth
    );
    return Math.min(calculatedWidth, maxWidth);
  };

  // Reading format with data.items
  if (data?.items) {
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
          <div className="bg-blue-50 p-4 rounded">
            <div
              className="text-base text-gray-800"
              dangerouslySetInnerHTML={{
                __html: cleanInstructions(data.instructions),
              }}
            />
          </div>
        </div>

        {/* Word Bank if available */}
        {data.wordBank && (
          <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-3">
              Word/Phrase Bank
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(data.wordBank).map(([letter, word]) => (
                <div key={letter} className="flex gap-2 text-sm">
                  <span className="font-bold text-gray-700">{letter}.</span>
                  <span className="text-gray-800">{word}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary text with inline input blanks */}
        {data.summary && (
          <div className="bg-white border border-gray-300 rounded-lg p-6">
            {typeof data.summary === "object" && data.summary.title && (
              <h4 className="font-bold text-gray-800 mb-4 text-center">
                {data.summary.title}
              </h4>
            )}
            <div className="text-gray-800 leading-relaxed">
              {(typeof data.summary === "object"
                ? data.summary.content
                : data.summary
              )
                .split(/(\[\d+\]|\b\d{1,2}\b(?=[^>]*(?:<|$)))/)
                .map((part, idx) => {
                  // Match [35] or standalone numbers like 35, 36, etc.
                  const bracketMatch = part.match(/\[(\d+)\]/);
                  const numberMatch = part.match(/^\d{1,2}$/);

                  if (bracketMatch) {
                    const questionNumber = parseInt(bracketMatch[1]);
                    const currentValue = answers[questionNumber] || "";
                    return (
                      <input
                        key={idx}
                        type="text"
                        value={currentValue}
                        onChange={(e) =>
                          handleChange(
                            questionNumber,
                            data.wordBank
                              ? e.target.value.toUpperCase()
                              : e.target.value
                          )
                        }
                        onFocus={() => setCurrentQuestion(questionNumber)}
                        data-question-id={questionNumber}
                        className="inline-block px-2 py-1 mx-1 border-b-2 border-blue-500 bg-blue-50 text-center font-medium focus:outline-none focus:bg-blue-100 focus:border-blue-600 transition-all"
                        style={{
                          width: data.wordBank
                            ? "40px"
                            : `${getDynamicWidth(currentValue)}px`,
                          minWidth: data.wordBank ? "40px" : "80px",
                        }}
                        placeholder={questionNumber.toString()}
                        maxLength={data.wordBank ? 1 : undefined}
                        title={
                          wordLimit
                            ? `Maximum ${wordLimit} word${
                                wordLimit > 1 ? "s" : ""
                              }`
                            : undefined
                        }
                      />
                    );
                  } else if (numberMatch && data.items) {
                    const questionNumber = parseInt(part);
                    // Check if this number is in our items array
                    const isQuestionNumber = data.items.some(
                      (item) => item.number === questionNumber
                    );
                    if (isQuestionNumber) {
                      const currentValue = answers[questionNumber] || "";
                      return (
                        <input
                          key={idx}
                          type="text"
                          value={currentValue}
                          onChange={(e) =>
                            handleChange(
                              questionNumber,
                              data.wordBank
                                ? e.target.value.toUpperCase()
                                : e.target.value
                            )
                          }
                          onFocus={() => setCurrentQuestion(questionNumber)}
                          data-question-id={questionNumber}
                          className="inline-block px-2 py-1 mx-1 border-b-2 border-blue-500 bg-blue-50 text-center font-medium focus:outline-none focus:bg-blue-100 focus:border-blue-600 transition-all"
                          style={{
                            width: data.wordBank
                              ? "40px"
                              : `${getDynamicWidth(currentValue)}px`,
                            minWidth: data.wordBank ? "40px" : "80px",
                          }}
                          placeholder={questionNumber.toString()}
                          maxLength={data.wordBank ? 1 : undefined}
                          title={
                            wordLimit
                              ? `Maximum ${wordLimit} word${
                                  wordLimit > 1 ? "s" : ""
                                }`
                              : undefined
                          }
                        />
                      );
                    }
                  }
                  return (
                    <span
                      key={idx}
                      dangerouslySetInnerHTML={{ __html: part }}
                    />
                  );
                })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Legacy listening format with inline text
  return (
    <div className="border border-gray-200 rounded p-6">
      {data.title && (
        <div className="mb-4">
          <h4 className="text-base font-semibold text-gray-800 text-center">
            {data.title}
          </h4>
        </div>
      )}
      <div className="space-y-4">
        <p className="text-gray-700 leading-relaxed">
          {data.text.split(/(\[\d+\])/).map((part, idx) => {
            const match = part.match(/\[(\d+)\]/);
            if (match) {
              const questionId = parseInt(match[1]);
              return (
                <input
                  key={idx}
                  type="text"
                  value={answers[questionId] || ""}
                  onChange={(e) => handleChange(questionId, e.target.value)}
                  placeholder={`${questionId}`}
                  className="inline-block w-32 px-2 py-1 mx-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  data-question-id={questionId}
                />
              );
            }
            return <span key={idx}>{part}</span>;
          })}
        </p>
      </div>
    </div>
  );
}
