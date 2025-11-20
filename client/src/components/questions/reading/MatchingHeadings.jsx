export default function MatchingHeadings({
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
      [questionNumber]: value,
    }));
  };

  // Get question range from items (excluding examples)
  const questionNumbers = data.items
    .filter((item) => item.number) // Only items with question numbers
    .map((item) => item.number);
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

      {/* List of Headings */}
      {(data.headings || data.headings_list) && (
        <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-3">List of Headings</h4>
          <div className="space-y-2">
            {(data.headings || data.headings_list).map((heading) => (
              <div key={heading.number || heading.id} className="flex gap-3">
                <span className="font-bold text-gray-700 min-w-8">
                  {heading.number || heading.id}
                </span>
                <span className="text-gray-800">
                  {heading.heading || heading.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {data.items.map((item, idx) => {
          // Check if this is an example item
          const isExample = item.isExample === true;

          return (
            <div
              key={item.number || `example-${idx}`}
              id={item.number ? `question-${item.number}` : undefined}
              className={`border rounded-lg p-4 transition-all ${
                isExample
                  ? "border-gray-200 bg-gray-50"
                  : currentQuestion === item.number
                  ? "border-blue-500 bg-blue-50 shadow-md"
                  : "border-gray-300 bg-white hover:border-gray-400"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  {isExample ? (
                    <span className="text-gray-600 italic">(Example)</span>
                  ) : (
                    <span className="font-bold text-gray-800 text-lg shrink-0">
                      {item.number}
                    </span>
                  )}
                  <p className="text-gray-800 flex-1">
                    Paragraph {item.paragraph}
                  </p>
                </div>

                {isExample ? (
                  <span className="w-24 px-2 py-1 border border-gray-300 rounded-lg font-bold text-center bg-gray-100 text-gray-700 shrink-0">
                    {item.answer}
                  </span>
                ) : (
                  <select
                    value={answers[item.number] || ""}
                    onChange={(e) => handleChange(item.number, e.target.value)}
                    onFocus={() => setCurrentQuestion(item.number)}
                    data-question-id={item.number}
                    className="w-24 px-2 py-1 border border-gray-300 rounded-lg font-medium text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shrink-0"
                  >
                    <option value="">{item.number}</option>
                    {(data.headings || data.headings_list).map((heading) => (
                      <option
                        key={heading.number || heading.id}
                        value={(heading.number || heading.id).toLowerCase()}
                      >
                        {heading.number || heading.id}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
