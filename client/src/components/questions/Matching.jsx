export default function Matching({ data, answers, onAnswerChange }) {
  return (
    <div>
      <div className="mb-6 bg-blue-50 p-4 rounded">
        <h4 className="font-medium mb-2">Options:</h4>
        <ul className="space-y-1">
          {data.options.map((option, idx) => (
            <li key={idx} className="text-sm">
              {option}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3">
        {data.items.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-4 border border-gray-200 rounded p-3"
          >
            <span className="font-medium text-gray-700 w-8">{item.id}.</span>
            <span className="flex-1">{item.text}</span>
            <input
              type="text"
              value={answers[item.id] || ""}
              onChange={(e) =>
                onAnswerChange(item.id, e.target.value.toUpperCase())
              }
              placeholder="Letter"
              maxLength="1"
              className="input-field w-16 text-center uppercase"
              data-question-id={item.id}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
