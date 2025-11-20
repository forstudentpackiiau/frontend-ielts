export default function MatchingInformation({
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

  const handleChange = (questionNumber, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionNumber]: value.toUpperCase(),
    }));
  };

  // Get question range from items
  const questionNumbers = data.items.map((item) => item.number);
  const minQuestion = Math.min(...questionNumbers);
  const maxQuestion = Math.max(...questionNumbers);
  const questionRange = `${minQuestion}-${maxQuestion}`;

  // Extract paragraph options from instructions (e.g., "A-F" or "A-J")
  // Try multiple patterns to handle different instruction formats
  let paragraphMatch = data.instructions?.match(
    /letter[s]?,?\s+<b>([A-Z])-([A-Z])<\/b>/i
  );

  if (!paragraphMatch) {
    paragraphMatch = data.instructions?.match(
      /letter[s]?,?\s+([A-Z])-([A-Z])/i
    );
  }

  if (!paragraphMatch) {
    paragraphMatch = data.instructions?.match(
      /paragraphs[,\s]+<b>([A-Z])-([A-Z])<\/b>/i
    );
  }

  if (!paragraphMatch) {
    paragraphMatch = data.instructions?.match(
      /paragraphs[,\s]+([A-Z])-([A-Z])/i
    );
  }

  const paragraphOptions = [];
  if (paragraphMatch) {
    const start = paragraphMatch[1].charCodeAt(0);
    const end = paragraphMatch[2].charCodeAt(0);
    for (let i = start; i <= end; i++) {
      paragraphOptions.push(String.fromCharCode(i));
    }
  }

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
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <span className="font-bold text-gray-800 text-lg shrink-0">
                  {item.number}
                </span>
                <div
                  className="text-gray-800 flex-1"
                  dangerouslySetInnerHTML={{ __html: item.question }}
                />
              </div>

              <select
                value={answers[item.number] || ""}
                onChange={(e) => handleChange(item.number, e.target.value)}
                onFocus={() => setCurrentQuestion(item.number)}
                data-question-id={item.number}
                className="w-24 px-2 py-1 border border-gray-300 rounded-lg font-medium text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shrink-0"
              >
                <option value="">{item.number}</option>
                {paragraphOptions.map((letter) => (
                  <option key={letter} value={letter}>
                    {letter}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
