export default function MultipleChoiceMultiple({
  question,
  answers,
  onAnswerChange,
}) {
  // Extract the number of required answers from instruction
  const getRequiredCount = () => {
    const match = question.instruction?.match(/which\s+(\w+)\s+/i);
    const numberWords = {
      one: 1,
      two: 2,
      three: 3,
      four: 4,
      five: 5,
      six: 6,
      seven: 7,
      eight: 8,
      nine: 9,
      ten: 10,
    };
    if (match && numberWords[match[1].toLowerCase()]) {
      return numberWords[match[1].toLowerCase()];
    }
    return 1;
  };

  const requiredCount = getRequiredCount();

  // Get selected answers from all question IDs in the range
  const selectedAnswers = [];
  for (let i = 0; i < requiredCount; i++) {
    const answer = answers[question.id + i];
    if (answer && typeof answer === "string" && answer.trim() !== "") {
      selectedAnswers.push(answer);
    }
  }

  const handleToggle = (letter) => {
    let newAnswers;
    if (selectedAnswers.includes(letter)) {
      // Deselect: remove this letter
      newAnswers = selectedAnswers.filter((a) => a !== letter);
    } else {
      // Select: add this letter if under limit
      if (selectedAnswers.length >= requiredCount) {
        // Already at limit, don't add more
        return;
      }
      newAnswers = [...selectedAnswers, letter];
    }

    // Distribute to individual question IDs for grading
    // Each answer gets its own question ID: 29->A, 30->D for TWO answers
    for (let i = 0; i < requiredCount; i++) {
      if (i < newAnswers.length) {
        onAnswerChange(question.id + i, newAnswers[i]);
      } else {
        // Clear unused question IDs
        if (answers[question.id + i]) {
          onAnswerChange(question.id + i, []);
        }
      }
    }
  };

  return (
    <div className="border border-gray-200 rounded p-4">
      <p className="font-medium text-gray-700 mb-4">{question.instruction}</p>

      <div className="space-y-2">
        {question.options.map((option, idx) => {
          const letter = String.fromCharCode(65 + idx);
          return (
            <label
              key={idx}
              className="flex items-center gap-3 p-3 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedAnswers.includes(letter)}
                onChange={() => handleToggle(letter)}
                className="w-4 h-4"
                data-question-id={question.id}
              />
              <span>{option}</span>
            </label>
          );
        })}
      </div>

      <div className="mt-3 text-sm text-gray-600">
        Selected: {selectedAnswers.join(", ") || "None"}
        {selectedAnswers.length < requiredCount && (
          <span className="ml-2 text-amber-600">
            (Please select {requiredCount - selectedAnswers.length} more)
          </span>
        )}
        {selectedAnswers.length === requiredCount && (
          <span className="ml-2 text-green-600">✓ Complete</span>
        )}
      </div>
    </div>
  );
}
