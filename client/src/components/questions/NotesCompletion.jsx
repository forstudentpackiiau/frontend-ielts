export default function NotesCompletion({ data, answers, onAnswerChange }) {
  // Calculate dynamic width based on answer length
  const getInputWidth = (itemId) => {
    const answer = answers[itemId] || "";
    const minWidth = 96; // w-24 (96px)
    const maxWidth = 384; // w-96 (384px)
    const charWidth = 8; // approximate pixels per character
    const calculatedWidth = Math.max(
      minWidth,
      Math.min(answer.length * charWidth + 40, maxWidth)
    );
    return `${calculatedWidth}px`;
  };

  // Handle case where data is undefined
  if (!data) {
    return <div className="text-red-500">Invalid notes completion data</div>;
  }

  // Render items helper function
  const renderItems = (items) => {
    if (!items) return null;

    return items.map((item, idx) => {
      // Handle string items
      if (typeof item === "string") {
        return (
          <div key={idx} className="pl-4 text-gray-700">
            • {item}
          </div>
        );
      }

      // Handle object items with only id
      if (item.id && !item.label && !item.text) {
        return (
          <div key={idx} className="pl-4 flex items-center gap-2">
            <span>•</span>
            {item.prefix && <span>{item.prefix}</span>}
            <input
              type="text"
              value={answers[item.id] || ""}
              onChange={(e) => onAnswerChange(item.id, e.target.value)}
              placeholder={`${item.id}`}
              style={{ width: getInputWidth(item.id) }}
              className="input-field inline-block"
              data-question-id={item.id}
            />
            {item.suffix && <span>{item.suffix}</span>}
          </div>
        );
      }

      // Handle complex items with text/label
      return (
        <div key={idx}>
          <div className="flex items-center gap-2 pl-4">
            {item.label && (
              <span className="font-medium text-gray-700">{item.label}:</span>
            )}
            <div className="flex items-center gap-2 flex-1">
              {item.text && !item.static && <span>{item.text}</span>}
              {item.text && item.static && (
                <span className="text-gray-600">{item.text}</span>
              )}
              {item.prefix && <span>{item.prefix}</span>}
              {item.id && (
                <input
                  type="text"
                  value={answers[item.id] || ""}
                  onChange={(e) => onAnswerChange(item.id, e.target.value)}
                  placeholder={`${item.id}`}
                  style={{ width: getInputWidth(item.id) }}
                  className="input-field inline-block"
                  data-question-id={item.id}
                />
              )}
              {item.suffix && <span>{item.suffix}</span>}
              {item.note && (
                <span className="text-gray-500 text-sm ml-2">{item.note}</span>
              )}
            </div>
          </div>
          {/* Handle subitems (cambridge8 test1 Part 4 questions 38-40) */}
          {item.subitems && Array.isArray(item.subitems) && (
            <div className="pl-8 mt-2 space-y-2">
              {renderItems(item.subitems)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="space-y-6">
      {data.title && (
        <div className="bg-gray-50 border-l-4 border-blue-500 p-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-800">{data.title}</h3>
        </div>
      )}
      {data.example && (
        <div className="pl-4 italic text-gray-600">
          Example: {data.example.text} <strong>{data.example.answer}</strong>
        </div>
      )}

      {/* Format 1: data.items (test2 - simple list) */}
      {data.items && !data.sections && (
        <div className="space-y-2">{renderItems(data.items)}</div>
      )}

      {/* Format 2: data.sections (test3, test4 - organized sections) */}
      {data.sections &&
        data.sections.map((section, sectionIdx) => (
          <div key={sectionIdx} className="space-y-2 pl-4">
            {section.title && (
              <h4 className="font-semibold text-gray-800 mb-2">
                {section.title}
              </h4>
            )}
            <div className="space-y-2">
              {renderItems(section.items)}

              {/* Handle subsections (test4) */}
              {section.subsections &&
                section.subsections.map((subsection, subIdx) => (
                  <div key={subIdx} className="pl-4 space-y-2 mt-2">
                    {subsection.title && (
                      <h5 className="font-medium text-gray-700 text-sm">
                        {subsection.title}
                      </h5>
                    )}
                    <div className="space-y-2">
                      {renderItems(subsection.items)}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
    </div>
  );
}
