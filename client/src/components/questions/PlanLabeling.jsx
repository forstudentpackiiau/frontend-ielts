export default function PlanLabeling({ data, answers, onAnswerChange }) {
  // Calculate dynamic width based on answer length
  const getInputWidth = (itemId) => {
    const answer = answers[itemId] || "";
    const minWidth = 150;
    const maxWidth = 300;
    const charWidth = 8;
    const calculatedWidth = Math.max(
      minWidth,
      Math.min(answer.length * charWidth + 40, maxWidth)
    );
    return `${calculatedWidth}px`;
  };

  if (!data || !data.items) {
    return <div className="text-red-500">Invalid plan labeling data</div>;
  }

  return (
    <div className="space-y-6">
      {/* Plan Image */}
      {data.image && (
        <div className="mb-6 flex justify-center">
          <img
            src={data.image}
            alt={data.title || "Plan"}
            className="max-w-full h-auto border border-gray-300 rounded-lg shadow-md"
            style={{ maxHeight: "600px" }}
          />
        </div>
      )}

      {/* Question Items */}
      <div className="space-y-3">
        {data.items.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-4 border border-gray-200 rounded p-4 bg-white hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1">
              {/* Question Number */}
              <span className="font-semibold text-gray-700 min-w-10">
                {item.id}.
              </span>

              {/* Label Text (if exists) */}
              {item.text && (
                <span className="text-gray-800 flex-1">{item.text}</span>
              )}

              {/* Input Field */}
              <input
                type="text"
                value={answers[item.id] || ""}
                onChange={(e) => onAnswerChange(item.id, e.target.value)}
                placeholder="Type your answer"
                style={{ width: getInputWidth(item.id) }}
                className="input-field"
                data-question-id={item.id}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Helper Text */}
      <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-400 text-sm text-blue-800">
        <p>
          💡 <strong>Tip:</strong> Look carefully at the plan and write the
          appropriate labels for each numbered location.
        </p>
      </div>
    </div>
  );
}
