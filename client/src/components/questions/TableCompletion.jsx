import React from "react";

export default function TableCompletion({ data, answers, onAnswerChange }) {
  // Guard against missing data
  if (!data) {
    return <div className="text-red-600">Error: No data provided</div>;
  }

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

  // Helper function to render a cell content (can be text, object with id, or array)
  const renderCellContent = (content) => {
    if (!content) return null;

    // Handle array of mixed content (strings and objects with id)
    if (Array.isArray(content)) {
      return (
        <>
          {content.map((item, idx) => {
            if (typeof item === "string") {
              if (item === "<br>") {
                return <br key={idx} />;
              }
              return <span key={idx}>{item}</span>;
            } else if (item && item.id) {
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
          })}
        </>
      );
    }

    // Handle string content
    if (typeof content === "string") {
      return <span>{content}</span>;
    }

    // Handle object with id
    if (content && content.id) {
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
    }

    return null;
  };

  const renderCell = (cell, rowIndex, cellIndex) => {
    if (!cell) return null;

    // Handle array values (use renderCellContent)
    if (Array.isArray(cell)) {
      return renderCellContent(cell);
    }

    // Handle string values
    if (typeof cell === "string") {
      return <span>{cell}</span>;
    }

    if (cell.id) {
      // Handle cell with prefix (e.g., "building" 6)
      return (
        <div className="flex items-center gap-2 flex-wrap">
          {cell.prefix && <span>{cell.prefix}</span>}
          <input
            type="text"
            value={answers[cell.id] || ""}
            onChange={(e) => onAnswerChange(cell.id, e.target.value)}
            placeholder={cell.placeholder || `${cell.id}`}
            style={{ width: getInputWidth(cell.id) }}
            className="input-field inline-block"
            data-question-id={cell.id}
          />
          {cell.suffix && <span>{cell.suffix}</span>}
        </div>
      );
    }

    if (cell.text) {
      return <span>{cell.text}</span>;
    }

    if (cell.composite) {
      return (
        <div className="flex items-center gap-2">
          {cell.items?.map((item, idx) => {
            if (item.id) {
              // For composite items with sub_id, we need to handle them as array values
              const currentValue = item.sub_id
                ? Array.isArray(answers[item.id])
                  ? item.sub_id === "start"
                    ? answers[item.id][0]
                    : answers[item.id][1]
                  : ""
                : answers[item.id] || "";

              const handleCompositeChange = (value) => {
                if (item.sub_id) {
                  // Handle array-based answer (e.g., question 7 with start and end)
                  const currentArray = Array.isArray(answers[item.id])
                    ? [...answers[item.id]]
                    : ["", ""];

                  if (item.sub_id === "start") {
                    currentArray[0] = value;
                  } else if (item.sub_id === "end") {
                    currentArray[1] = value;
                  }

                  onAnswerChange(item.id, currentArray);
                } else {
                  onAnswerChange(item.id, value);
                }
              };

              return (
                <input
                  key={idx}
                  type="text"
                  value={currentValue}
                  onChange={(e) => handleCompositeChange(e.target.value)}
                  placeholder={`${item.id}`}
                  style={{ width: getInputWidth(item.id) }}
                  className="input-field inline-block"
                  data-question-id={item.id}
                />
              );
            }
            return (
              <span key={idx} className="text-sm">
                {item.text}
              </span>
            );
          })}
        </div>
      );
    }

    return <span>{cell.text}</span>;
  };

  return (
    <div className="overflow-x-auto">
      {data.headers && data.rows && (
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              {data.headers.map((header, idx) => (
                <th
                  key={idx}
                  className="border border-gray-300 px-4 py-2 text-left font-medium"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, rowIdx) => {
              // Format 1: row has cells array (Part 1 format)
              if (row.cells) {
                return (
                  <tr key={rowIdx} className="hover:bg-gray-50">
                    {/* First column might be date or other static field */}
                    {row.date && (
                      <td className="border border-gray-300 px-4 py-2">
                        {row.date}
                      </td>
                    )}
                    {row.cells.map((cell, cellIdx) => {
                      // Skip null cells (used for rowspan continuation)
                      if (cell === null) return null;

                      return (
                        <td
                          key={cellIdx}
                          className="border border-gray-300 px-4 py-2"
                          rowSpan={cell.rowspan || 1}
                        >
                          {renderCell(cell, rowIdx, cellIdx)}
                        </td>
                      );
                    })}
                  </tr>
                );
              }

              // Format 2: row has target/work_completed/action (Part 3 format)
              if (
                row.target ||
                row.work_completed ||
                row.action ||
                row.timing
              ) {
                return (
                  <tr key={rowIdx} className="hover:bg-gray-50">
                    {row.target !== undefined && (
                      <td className="border border-gray-300 px-4 py-2">
                        {renderCellContent(row.target)}
                      </td>
                    )}
                    {row.work_completed !== undefined && (
                      <td className="border border-gray-300 px-4 py-2">
                        {renderCellContent(row.work_completed)}
                      </td>
                    )}
                    {row.action !== undefined && (
                      <td className="border border-gray-300 px-4 py-2">
                        {renderCellContent(row.action)}
                      </td>
                    )}
                    {row.timing !== undefined && (
                      <td className="border border-gray-300 px-4 py-2">
                        {renderCellContent(row.timing)}
                      </td>
                    )}
                  </tr>
                );
              }

              // Format 3: row has time/event/details (test4 format)
              if (row.time || row.event || row.details !== undefined) {
                return (
                  <tr key={rowIdx} className="hover:bg-gray-50">
                    {row.time !== undefined && (
                      <td className="border border-gray-300 px-4 py-2">
                        {row.time}
                      </td>
                    )}
                    {row.event !== undefined && (
                      <td className="border border-gray-300 px-4 py-2">
                        {renderCellContent(row.event)}
                      </td>
                    )}
                    {row.details !== undefined && (
                      <td className="border border-gray-300 px-4 py-2">
                        {renderCellContent(row.details)}
                      </td>
                    )}
                  </tr>
                );
              }

              // Format 4: row has area/facility/activity (cambridge7 test4 format)
              // Must NOT have 'day' property (to avoid conflict with Format 10)
              if (
                (row.area ||
                  row.facility !== undefined ||
                  row.activity !== undefined) &&
                row.day === undefined
              ) {
                return (
                  <tr key={rowIdx} className="hover:bg-gray-50">
                    {row.area !== undefined && (
                      <td className="border border-gray-300 px-4 py-2">
                        {renderCellContent(row.area)}
                      </td>
                    )}
                    {row.facility !== undefined && (
                      <td className="border border-gray-300 px-4 py-2">
                        {renderCellContent(row.facility)}
                      </td>
                    )}
                    {row.activity !== undefined && (
                      <td className="border border-gray-300 px-4 py-2">
                        {renderCellContent(row.activity)}
                      </td>
                    )}
                  </tr>
                );
              }

              // Format 5: row has info/source (cambridge7 test4 Part 3 format)
              if (row.info !== undefined || row.source !== undefined) {
                return (
                  <tr key={rowIdx} className="hover:bg-gray-50">
                    {row.info !== undefined && (
                      <td className="border border-gray-300 px-4 py-2">
                        {renderCellContent(row.info)}
                      </td>
                    )}
                    {row.source !== undefined && (
                      <td className="border border-gray-300 px-4 py-2">
                        {renderCellContent(row.source)}
                      </td>
                    )}
                  </tr>
                );
              }

              // Format 6: row has location/attraction/info (cambridge7 test2 Part 2 format)
              if (
                row.location ||
                row.attraction !== undefined ||
                row.info !== undefined
              ) {
                return (
                  <tr key={rowIdx} className="hover:bg-gray-50">
                    {row.location !== undefined && (
                      <td className="border border-gray-300 px-4 py-2">
                        {renderCellContent(row.location)}
                      </td>
                    )}
                    {row.attraction !== undefined && (
                      <td className="border border-gray-300 px-4 py-2">
                        {renderCellContent(row.attraction)}
                      </td>
                    )}
                    {row.info !== undefined && (
                      <td className="border border-gray-300 px-4 py-2">
                        {renderCellContent(row.info)}
                      </td>
                    )}
                  </tr>
                );
              }

              // Format 7: row has date/event (cambridge7 test2 Part 3 format)
              if (row.date !== undefined || row.event !== undefined) {
                return (
                  <tr key={rowIdx} className="hover:bg-gray-50">
                    {row.date !== undefined && (
                      <td className="border border-gray-300 px-4 py-2">
                        {renderCellContent(row.date)}
                      </td>
                    )}
                    {row.event !== undefined && (
                      <td className="border border-gray-300 px-4 py-2">
                        {renderCellContent(row.event)}
                      </td>
                    )}
                  </tr>
                );
              }

              // Format 8: row has sport/laterality/comments (cambridge7 test2 Part 4 format)
              if (
                row.sport ||
                row.laterality !== undefined ||
                row.comments !== undefined
              ) {
                return (
                  <tr key={rowIdx} className="hover:bg-gray-50">
                    {row.sport !== undefined && (
                      <td className="border border-gray-300 px-4 py-2">
                        {renderCellContent(row.sport)}
                      </td>
                    )}
                    {row.laterality !== undefined && (
                      <td className="border border-gray-300 px-4 py-2">
                        {renderCellContent(row.laterality)}
                      </td>
                    )}
                    {row.comments !== undefined && (
                      <td className="border border-gray-300 px-4 py-2">
                        {renderCellContent(row.comments)}
                      </td>
                    )}
                  </tr>
                );
              }

              // Format 9: row has position/where/problem (cambridge7 test3 Part 1 format)
              if (
                row.position !== undefined ||
                row.where !== undefined ||
                row.problem !== undefined
              ) {
                return (
                  <tr key={rowIdx} className="hover:bg-gray-50">
                    {row.position !== undefined && (
                      <td className="border border-gray-300 px-4 py-2">
                        {renderCellContent(row.position)}
                      </td>
                    )}
                    {row.where !== undefined && (
                      <td className="border border-gray-300 px-4 py-2">
                        {renderCellContent(row.where)}
                      </td>
                    )}
                    {row.problem !== undefined && (
                      <td className="border border-gray-300 px-4 py-2">
                        {renderCellContent(row.problem)}
                      </td>
                    )}
                  </tr>
                );
              }

              // Format 10: row has day/activity (cambridge7 test3 Part 2 format)
              if (row.day !== undefined && row.activity !== undefined) {
                return (
                  <tr key={rowIdx} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">
                      {renderCellContent(row.day)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {renderCellContent(row.activity)}
                    </td>
                  </tr>
                );
              }

              // Format 11: row has date/event/price/tickets (cambridge8 test1 Part 1 format)
              if (
                row.date !== undefined ||
                row.event !== undefined ||
                row.price !== undefined ||
                row.tickets !== undefined
              ) {
                return (
                  <tr key={rowIdx} className="hover:bg-gray-50">
                    {row.date !== undefined && (
                      <td className="border border-gray-300 px-4 py-2">
                        {renderCellContent(row.date)}
                      </td>
                    )}
                    {row.event !== undefined && (
                      <td className="border border-gray-300 px-4 py-2">
                        {renderCellContent(row.event)}
                      </td>
                    )}
                    {row.price !== undefined && (
                      <td className="border border-gray-300 px-4 py-2">
                        {renderCellContent(row.price)}
                      </td>
                    )}
                    {row.tickets !== undefined && (
                      <td className="border border-gray-300 px-4 py-2">
                        {renderCellContent(row.tickets)}
                      </td>
                    )}
                  </tr>
                );
              }

              // Format 12: row has item/damage/cost (cambridge8 test2 Part 1 format)
              if (
                row.item !== undefined ||
                row.damage !== undefined ||
                row.cost !== undefined
              ) {
                return (
                  <tr key={rowIdx} className="hover:bg-gray-50">
                    {row.item !== undefined && (
                      <td className="border border-gray-300 px-4 py-2">
                        {renderCellContent(row.item)}
                      </td>
                    )}
                    {row.damage !== undefined && (
                      <td className="border border-gray-300 px-4 py-2">
                        {renderCellContent(row.damage)}
                      </td>
                    )}
                    {row.cost !== undefined && (
                      <td className="border border-gray-300 px-4 py-2">
                        {renderCellContent(row.cost)}
                      </td>
                    )}
                  </tr>
                );
              }

              // Alternative format: row has direct properties (period, situation, id, suffix)
              // This is used in Part 4
              return (
                <tr key={rowIdx} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">
                    {row.period}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {row.situation && <span>{row.situation}</span>}
                      {row.id && (
                        <input
                          type="text"
                          value={answers[row.id] || ""}
                          onChange={(e) =>
                            onAnswerChange(row.id, e.target.value)
                          }
                          placeholder={`${row.id}`}
                          style={{ width: getInputWidth(row.id) }}
                          className="input-field inline-block"
                          data-question-id={row.id}
                        />
                      )}
                      {row.suffix && <span>{row.suffix}</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {data.rows && !data.headers && (
        <div className="space-y-4">
          {data.rows.map((row, idx) => (
            <div key={idx} className="border border-gray-200 rounded p-4">
              <div className="flex items-center gap-2">
                {row.label && (
                  <span className="font-medium text-gray-700">{row.label}</span>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  {row.items?.map((item, itemIdx) => (
                    <React.Fragment key={itemIdx}>
                      {item.text && item.static && (
                        <span className="text-gray-600">{item.text}</span>
                      )}
                      {item.text && !item.static && !item.id && (
                        <span>{item.text}</span>
                      )}
                      {item.id && (
                        <input
                          type="text"
                          value={answers[item.id] || ""}
                          onChange={(e) =>
                            onAnswerChange(item.id, e.target.value)
                          }
                          placeholder={item.placeholder || `${item.id}`}
                          style={{ width: getInputWidth(item.id) }}
                          className="input-field inline-block"
                          data-question-id={item.id}
                        />
                      )}
                      {item.note && (
                        <span className="text-sm text-gray-500">
                          {item.note}
                        </span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
