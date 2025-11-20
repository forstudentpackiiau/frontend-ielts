export default function MapLabeling({ data, answers, onAnswerChange }) {
  // Calculate dynamic width based on answer length
  const getInputWidth = (itemId) => {
    const answer = answers[itemId] || "";
    const minWidth = 60; // Smaller width for letter inputs (A-J)
    const maxWidth = 120;
    const charWidth = 12;
    const calculatedWidth = Math.max(
      minWidth,
      Math.min(answer.length * charWidth + 40, maxWidth)
    );
    return `${calculatedWidth}px`;
  };

  if (!data || !data.items) {
    return <div className="text-red-500">Invalid map labeling data</div>;
  }

  return (
    <div className="space-y-6">
      {/* Map Image */}
      {data.image && (
        <div className="mb-6 flex justify-center">
          <img
            src={data.image}
            alt={data.title || "Map"}
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

              {/* Label Text */}
              <span className="text-gray-800 flex-1">{item.text}</span>

              {/* Input Field */}
              <input
                type="text"
                value={answers[item.id] || ""}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase();
                  // Only allow single letter A-J
                  if (value === "" || /^[A-J]$/.test(value)) {
                    onAnswerChange(item.id, value);
                  }
                }}
                placeholder="Letter"
                maxLength={1}
                style={{ width: getInputWidth(item.id) }}
                className="input-field text-center font-semibold uppercase"
                data-question-id={item.id}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Helper Text */}
      <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-400 text-sm text-blue-800">
        <p>
          💡 <strong>Tip:</strong> Enter a single letter (A-J) for each location
          on the map.
        </p>
      </div>
    </div>
  );
}
