export default function SentenceCompletion({
  questions,
  answers,
  onAnswerChange,
}) {
  if (!questions || !Array.isArray(questions)) {
    return <div className="text-red-600">Error: Invalid questions data</div>;
  }

  // Calculate dynamic width based on answer length
  const getInputWidth = (questionId) => {
    const answer = answers[questionId] || "";
    const minWidth = 96; // w-24 (96px)
    const maxWidth = 384; // w-96 (384px)
    const charWidth = 8; // approximate pixels per character
    const calculatedWidth = Math.max(
      minWidth,
      Math.min(answer.length * charWidth + 40, maxWidth)
    );
    return `${calculatedWidth}px`;
  };

  return (
    <div className="space-y-4">
      {questions.map((question, idx) => (
        <div key={idx} className="border border-gray-200 rounded p-4">
          <div className="mb-2">
            <span className="font-medium text-gray-700">
              Question {question.id}:
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span>{question.text}</span>
            {question.id && (
              <input
                type="text"
                value={answers[question.id] || ""}
                onChange={(e) => onAnswerChange(question.id, e.target.value)}
                placeholder={`${question.id}`}
                style={{ width: getInputWidth(question.id) }}
                className="input-field inline-block"
                data-question-id={question.id}
              />
            )}
            {question.suffix && <span>{question.suffix}</span>}
            {question.note && (
              <span className="text-sm text-gray-500">{question.note}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
