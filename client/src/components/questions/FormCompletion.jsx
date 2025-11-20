export default function FormCompletion({
  data,
  answers,
  onAnswerChange,
  testData,
}) {
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

  // Handle fields array format (test1 Part 2 - Questions 17-20)
  // This should render as a proper table
  if (data.fields && Array.isArray(data.fields)) {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                PLAY...
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                DATES
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                STARTING TIME
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                TICKETS AVAILABLE
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                PRICE
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-4 py-2">{data.title}</td>
              {data.fields.map((field, idx) => {
                // Check if this field's answer should be an array by checking the testData answers
                const isArrayAnswer =
                  testData?.answers &&
                  Array.isArray(testData.answers[field.id]);

                return (
                  <td key={idx} className="border border-gray-300 px-4 py-2">
                    {isArrayAnswer ? (
                      // Render two inputs inline for array answers with "and" between them
                      <div className="flex items-center gap-1 flex-wrap">
                        <span>for</span>
                        <input
                          type="text"
                          value={
                            Array.isArray(answers[field.id])
                              ? answers[field.id][0] || ""
                              : ""
                          }
                          onChange={(e) => {
                            const currentArray = Array.isArray(
                              answers[field.id]
                            )
                              ? answers[field.id]
                              : ["", ""];
                            const newArray = [...currentArray];
                            newArray[0] = e.target.value;
                            onAnswerChange(field.id, newArray);
                          }}
                          placeholder={`${field.id}`}
                          style={{ width: getInputWidth(field.id) }}
                          className="input-field inline-block"
                          data-question-id={field.id}
                        />
                        <span>and</span>
                        <input
                          type="text"
                          value={
                            Array.isArray(answers[field.id])
                              ? answers[field.id][1] || ""
                              : ""
                          }
                          onChange={(e) => {
                            const currentArray = Array.isArray(
                              answers[field.id]
                            )
                              ? answers[field.id]
                              : ["", ""];
                            const newArray = [...currentArray];
                            newArray[1] = e.target.value;
                            onAnswerChange(field.id, newArray);
                          }}
                          placeholder={`${field.id}`}
                          style={{ width: getInputWidth(field.id) }}
                          className="input-field inline-block"
                          data-question-id={field.id}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 flex-wrap">
                        {field.prefix && <span>{field.prefix}</span>}
                        {field.id && (
                          <input
                            type="text"
                            value={answers[field.id] || ""}
                            onChange={(e) =>
                              onAnswerChange(field.id, e.target.value)
                            }
                            placeholder={`${field.id}`}
                            style={{ width: getInputWidth(field.id) }}
                            className="input-field inline-block"
                            data-question-id={field.id}
                          />
                        )}
                        {field.suffix && <span>{field.suffix}</span>}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  // Helper function to render composite items (inline with mixed text and inputs)
  const renderCompositeItems = (items) => {
    return items.map((item, idx) => {
      if (typeof item === "string") {
        if (item === "<br>") {
          return <br key={idx} />;
        }
        return <span key={idx}>{item}</span>;
      } else if (item.text) {
        return <span key={idx}>{item.text}</span>;
      } else if (item.id) {
        return (
          <span key={idx}>
            {" "}
            <input
              type="text"
              value={answers[item.id] || ""}
              onChange={(e) => onAnswerChange(item.id, e.target.value)}
              placeholder={`${item.id}`}
              style={{ width: getInputWidth(item.id) }}
              className="input-field inline-block mx-1"
              data-question-id={item.id}
            />{" "}
          </span>
        );
      }
      return null;
    });
  };

  // Handle items array format (test1 Part 3 - Questions 22-25, cambridge7 test4)
  // This should render as a two-column table
  if (data.items && Array.isArray(data.items)) {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          {/* Only show headers if explicitly provided in data */}
          {data.headers && (
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                  {data.headers[0] || ""}
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                  {data.headers[1] || ""}
                </th>
              </tr>
            </thead>
          )}
          <tbody>
            {data.items.map((item, idx) => (
              <tr key={idx}>
                <td className="border border-gray-300 px-4 py-2">
                  {item.label || (
                    <input
                      type="text"
                      value={answers[item.id] || ""}
                      onChange={(e) => onAnswerChange(item.id, e.target.value)}
                      placeholder={`${item.id}`}
                      style={{ width: getInputWidth(item.id) }}
                      className="input-field inline-block bg-gray-100"
                      data-question-id={item.id}
                    />
                  )}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {/* Handle composite items (questions 5-6 in cambridge7 test4) */}
                  {item.composite && item.items && Array.isArray(item.items) ? (
                    <div>{renderCompositeItems(item.items)}</div>
                  ) : (
                    <div>
                      {item.text && (
                        <span>
                          {Array.isArray(item.text)
                            ? item.text.map((part, partIdx) => {
                                if (typeof part === "string") {
                                  if (part === "<br>") {
                                    return <br key={partIdx} />;
                                  }
                                  return <span key={partIdx}>{part} </span>;
                                } else if (
                                  part &&
                                  typeof part === "object" &&
                                  part.id
                                ) {
                                  return (
                                    <input
                                      key={partIdx}
                                      type="text"
                                      value={answers[part.id] || ""}
                                      onChange={(e) =>
                                        onAnswerChange(part.id, e.target.value)
                                      }
                                      placeholder={`${part.id}`}
                                      style={{
                                        width: getInputWidth(part.id),
                                      }}
                                      className="input-field inline-block"
                                      data-question-id={part.id}
                                    />
                                  );
                                }
                                return null;
                              })
                            : item.text}
                        </span>
                      )}
                      {item.label && item.id && (
                        <input
                          type="text"
                          value={answers[item.id] || ""}
                          onChange={(e) =>
                            onAnswerChange(item.id, e.target.value)
                          }
                          placeholder={`${item.id}`}
                          style={{ width: getInputWidth(item.id) }}
                          className="input-field inline-block"
                          data-question-id={item.id}
                        />
                      )}
                      {item.suffix && (
                        <>
                          {Array.isArray(item.suffix) ? (
                            renderCompositeItems(item.suffix)
                          ) : (
                            <span>{item.suffix}</span>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Render additional table if present */}
        {data.table && data.table.rows && (
          <table className="min-w-full border-collapse border border-gray-300 mt-4">
            {data.table.headers && (
              <thead>
                <tr className="bg-gray-50">
                  {data.table.headers.map((header, idx) => (
                    <th
                      key={idx}
                      className="border border-gray-300 px-4 py-2 text-left font-semibold"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {data.table.rows.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  {row.date !== undefined && (
                    <td className="border border-gray-300 px-4 py-2">
                      {renderCompositeItems(
                        Array.isArray(row.date) ? row.date : [row.date]
                      )}
                    </td>
                  )}
                  {row.event !== undefined && (
                    <td className="border border-gray-300 px-4 py-2">
                      {renderCompositeItems(
                        Array.isArray(row.event) ? row.event : [row.event]
                      )}
                    </td>
                  )}
                  {row.price !== undefined && (
                    <td className="border border-gray-300 px-4 py-2">
                      {typeof row.price === "object" && row.price.id ? (
                        <span>
                          {row.price.prefix && <span>{row.price.prefix}</span>}
                          <input
                            type="text"
                            value={answers[row.price.id] || ""}
                            onChange={(e) =>
                              onAnswerChange(row.price.id, e.target.value)
                            }
                            placeholder={`${row.price.id}`}
                            style={{ width: getInputWidth(row.price.id) }}
                            className="input-field inline-block"
                            data-question-id={row.price.id}
                          />
                        </span>
                      ) : (
                        <span>{row.price}</span>
                      )}
                    </td>
                  )}
                  {row.tickets !== undefined && (
                    <td className="border border-gray-300 px-4 py-2">
                      {typeof row.tickets === "object" && row.tickets.id ? (
                        <input
                          type="text"
                          value={answers[row.tickets.id] || ""}
                          onChange={(e) =>
                            onAnswerChange(row.tickets.id, e.target.value)
                          }
                          placeholder={`${row.tickets.id}`}
                          style={{ width: getInputWidth(row.tickets.id) }}
                          className="input-field inline-block"
                          data-question-id={row.tickets.id}
                        />
                      ) : (
                        <span>{row.tickets}</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Render note if present */}
        {data.note && (
          <div className="mt-4 p-3 bg-gray-50 border border-gray-300 rounded">
            <span>{data.note.text}</span>{" "}
            {data.note.id && (
              <input
                type="text"
                value={answers[data.note.id] || ""}
                onChange={(e) => onAnswerChange(data.note.id, e.target.value)}
                placeholder={`${data.note.id}`}
                style={{ width: getInputWidth(data.note.id) }}
                className="input-field inline-block"
                data-question-id={data.note.id}
              />
            )}{" "}
            {data.note.suffix && <span>{data.note.suffix}</span>}
          </div>
        )}
      </div>
    );
  }

  // Handle rows array format (test2 format)
  if (!data || !data.rows || !Array.isArray(data.rows)) {
    return (
      <div className="border border-red-300 rounded-lg p-6 bg-red-50">
        <p className="text-red-700">
          Error: Invalid form completion data structure
        </p>
      </div>
    );
  }

  // Helper function to render a cell content (can be text, object with id, or array)
  const renderCell = (content) => {
    if (!content) return null;

    if (Array.isArray(content)) {
      return content.map((item, idx) => {
        if (typeof item === "string") {
          return <span key={idx}>{item} </span>;
        } else if (item.id) {
          return (
            <input
              key={idx}
              type="text"
              value={answers[item.id] || ""}
              onChange={(e) => onAnswerChange(item.id, e.target.value)}
              placeholder={`${item.id}`}
              style={{ width: getInputWidth(item.id) }}
              className="input-field inline-block mx-1"
              data-question-id={item.id}
            />
          );
        }
        return null;
      });
    } else if (typeof content === "object" && content.id) {
      return (
        <input
          type="text"
          value={answers[content.id] || ""}
          onChange={(e) => onAnswerChange(content.id, e.target.value)}
          placeholder={`${content.id}`}
          style={{ width: getInputWidth(content.id) }}
          className="input-field inline-block"
          data-question-id={content.id}
        />
      );
    } else if (typeof content === "string") {
      return <span>{content}</span>;
    }
    return null;
  };

  return (
    <div className="border border-gray-300 rounded-lg p-6">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          {data.headers && (
            <thead>
              <tr className="bg-gray-100">
                {data.headers.map((header, idx) => (
                  <th
                    key={idx}
                    className="border border-gray-300 p-3 text-left font-semibold"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {data.rows.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-gray-50">
                {/* Type column */}
                {row.type !== undefined && (
                  <td className="border border-gray-300 p-3">
                    {renderCell(row.type)}
                  </td>
                )}
                {/* Details column */}
                {row.details !== undefined && (
                  <td className="border border-gray-300 p-3">
                    {renderCell(row.details)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
