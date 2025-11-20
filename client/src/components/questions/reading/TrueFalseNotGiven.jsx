export default function TrueFalseNotGiven({
  data,
  questionKey,
  answers,
  setAnswers,
  currentQuestion,
  setCurrentQuestion,
}) {
  const options = ["TRUE", "FALSE", "NOT GIVEN"];

  const handleChange = (questionNumber, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionNumber]: value,
    }));
  };

  // Remove question range from instructions
  const cleanInstructions = (instructions) => {
    if (!instructions) return "";
    return instructions.replace(/<p><i>Questions? \d+(-\d+)?<\/i><\/p>/g, "");
  };

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
            className="text-base text-gray-800"
            dangerouslySetInnerHTML={{
              __html: cleanInstructions(data.instructions),
            }}
          />
        </div>
      </div>

      <div className="space-y-6">
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
            <div className="flex items-start gap-3 mb-3">
              <span className="font-bold text-gray-800 text-lg shrink-0">
                {item.number}
              </span>
              <div
                className="text-gray-800 flex-1"
                dangerouslySetInnerHTML={{ __html: item.statement }}
              />
            </div>

            <div className="space-y-2 ml-8">
              {options.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                >
                  <input
                    type="radio"
                    name={`question-${item.number}`}
                    value={option}
                    checked={answers[item.number] === option}
                    onChange={(e) => handleChange(item.number, e.target.value)}
                    onFocus={() => setCurrentQuestion(item.number)}
                    data-question-id={item.number}
                    className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-800 font-medium">{option}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
