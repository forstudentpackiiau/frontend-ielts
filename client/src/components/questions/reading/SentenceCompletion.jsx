import React from "react";

export default function SentenceCompletion({
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

  // Check if this is dropdown format (with endings) or input format (with blanks in sentences)
  const hasEndings =
    data?.endings && Array.isArray(data.endings) && data.endings.length > 0;

  if (!data || !data.items) {
    return <div className="text-red-500">Invalid Sentence Completion data</div>;
  }

  // For input format, check if sentences have placeholders
  const hasPlaceholders = data.items.some(
    (item) => item.sentence && item.sentence.includes(`[${item.number}]`)
  );

  if (!hasEndings && !hasPlaceholders) {
    return <div className="text-red-500">Invalid Sentence Completion data</div>;
  }

  // Extract word limit from instructions
  const getWordLimit = () => {
    if (!data?.instructions) return null;
    const match = data.instructions.match(/NO MORE THAN (\w+) WORD[S]?/i);
    if (match) {
      const wordMap = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
      return wordMap[match[1].toUpperCase()] || parseInt(match[1]);
    }
    return null;
  };

  const wordLimit = getWordLimit();

  const handleChange = (
    questionNumber,
    value,
    inputIndex = 0,
    isMultiInput = false
  ) => {
    // Validate word count if word limit exists
    if (wordLimit && value.trim()) {
      const wordCount = value.trim().split(/\s+/).length;
      if (wordCount > wordLimit) {
        return; // Don't update if exceeds word limit
      }
    }

    setAnswers((prev) => {
      // Check if this question should have multiple inputs (array answer)
      const currentValue = prev[questionNumber];

      // If it's a multi-input question OR already an array, use array storage
      if (isMultiInput || Array.isArray(currentValue)) {
        const newArray = Array.isArray(currentValue) ? [...currentValue] : [];

        // Ensure array is large enough
        while (newArray.length <= inputIndex) {
          newArray.push("");
        }
        newArray[inputIndex] = value;

        return {
          ...prev,
          [questionNumber]: newArray,
        };
      }

      // Single input - store as string
      return {
        ...prev,
        [questionNumber]: value,
      };
    });
  };

  // Calculate dynamic width based on content
  const getDynamicWidth = (value) => {
    const minWidth = 100;
    const maxWidth = 250;
    const charWidth = 8;
    const calculatedWidth = Math.max(
      minWidth,
      (value?.length || 5) * charWidth
    );
    return Math.min(calculatedWidth, maxWidth);
  };

  // Calculate question range
  const questionNumbers = data.items.map((item) => item.number);
  const minQuestion = Math.min(...questionNumbers);
  const maxQuestion = Math.max(...questionNumbers);
  const questionRange = `Questions ${minQuestion}-${maxQuestion}`;

  return (
    <div className="space-y-6">
      {/* Question Range Title */}

      <h3 className="text-lg font-bold text-gray-800">{questionRange}</h3>

      {/* Instructions */}
      {data.instructions && (
        <div className="bg-blue-50  p-4">
          <div
            className="text-base text-gray-800"
            dangerouslySetInnerHTML={{
              __html: cleanInstructions(data.instructions),
            }}
          />
        </div>
      )}

      {/* Endings List */}
      {data.endings && data.endings.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <p className="font-semibold text-gray-700 mb-3">Endings:</p>
          {data.endings.map((ending) => (
            <div key={ending.id} className="flex gap-3">
              <span className="font-bold text-gray-800 min-w-[30px]">
                {ending.id}
              </span>
              <span className="text-gray-700">{ending.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Questions */}
      <div className="space-y-4">
        {data.items.map((item, index) => {
          const isActive = currentQuestion === item.number;

          // If sentence has placeholder [number], render with input
          if (hasPlaceholders && item.sentence.includes(`[${item.number}]`)) {
            // Find all placeholders in the sentence
            const placeholderRegex = /\[(\d+)\]/g;
            const matches = [...item.sentence.matchAll(placeholderRegex)];
            const placeholders = matches.map((m) => parseInt(m[1]));

            // Check if this sentence has multiple placeholders and if this is NOT the first occurrence
            if (placeholders.length > 1) {
              const firstPlaceholder = Math.min(...placeholders);
              // Skip rendering if this is not the first placeholder (to avoid duplicate sentences)
              if (item.number !== firstPlaceholder) {
                return null;
              }
            }

            // Split sentence by all placeholders
            const parts = item.sentence.split(placeholderRegex);
            const elements = [];

            // Track occurrence count for each question number
            const occurrenceCount = {};

            for (let i = 0; i < parts.length; i++) {
              // Add text part
              if (parts[i] && !parts[i].match(/^\d+$/)) {
                elements.push(<span key={`text-${i}`}>{parts[i]}</span>);
              }
              // Add input for placeholder
              else if (parts[i] && parts[i].match(/^\d+$/)) {
                const questionNum = parseInt(parts[i]);

                // Track which occurrence this is (0-indexed)
                if (occurrenceCount[questionNum] === undefined) {
                  occurrenceCount[questionNum] = 0;
                } else {
                  occurrenceCount[questionNum]++;
                }
                const inputIndex = occurrenceCount[questionNum];

                // Determine if this question has multiple inputs
                const matchesForThisNum = matches.filter(
                  (m) => parseInt(m[1]) === questionNum
                );
                const isMultiInput = matchesForThisNum.length > 1;

                // Get the value for this specific input
                let inputValue = "";
                if (isMultiInput && Array.isArray(answers[questionNum])) {
                  inputValue = answers[questionNum][inputIndex] || "";
                } else if (!isMultiInput) {
                  inputValue = answers[questionNum] || "";
                } else {
                  // Multi-input but answer not yet array - get from string or empty
                  inputValue = "";
                }

                elements.push(
                  <input
                    key={`input-${questionNum}-${inputIndex}`}
                    type="text"
                    value={inputValue}
                    onChange={(e) =>
                      handleChange(
                        questionNum,
                        e.target.value,
                        inputIndex,
                        isMultiInput
                      )
                    }
                    onFocus={() => setCurrentQuestion(questionNum)}
                    data-question-id={questionNum}
                    className="inline-block px-2 py-1 mx-1 border-b-2 border-blue-500 bg-blue-50 text-center font-medium focus:outline-none focus:bg-blue-100 focus:border-blue-600 transition-all"
                    style={{
                      width: `${getDynamicWidth(inputValue)}px`,
                      minWidth: "100px",
                    }}
                    placeholder={questionNum.toString()}
                    title={
                      wordLimit
                        ? `Maximum ${wordLimit} word${wordLimit > 1 ? "s" : ""}`
                        : undefined
                    }
                  />
                );
              }
            }

            // Use the first placeholder number for the ID
            const firstPlaceholder = Math.min(...placeholders);

            return (
              <div
                key={item.number}
                id={`question-${firstPlaceholder}`}
                className={`p-4 rounded-lg transition-all ${
                  placeholders.includes(currentQuestion)
                    ? "bg-blue-50 border-2 border-blue-400"
                    : "bg-white border border-gray-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="font-bold text-lg text-gray-800 shrink-0">
                    {firstPlaceholder}
                  </span>
                  <div className="text-gray-700 leading-relaxed flex-1">
                    {elements}
                  </div>
                </div>
              </div>
            );
          }

          // Otherwise render dropdown format
          return (
            <div
              key={item.number}
              id={`question-${item.number}`}
              className={`flex justify-between items-center gap-4 p-3 rounded-lg transition-all ${
                isActive
                  ? "bg-blue-50 border-2 border-blue-400"
                  : "bg-white border border-gray-200"
              }`}
            >
              {/* Question Number and Sentence */}
              <div className="flex items-center gap-3 flex-1">
                <span className="font-bold text-lg text-gray-800">
                  {item.number}
                </span>
                <span className="text-gray-700">{item.sentence}</span>
              </div>

              {/* Dropdown */}
              <select
                data-question-id={item.number}
                value={answers[item.number] || ""}
                onChange={(e) => handleChange(item.number, e.target.value)}
                onFocus={() => setCurrentQuestion(item.number)}
                className="w-24 px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">{item.number}</option>
                {data.endings &&
                  data.endings.map((ending) => (
                    <option key={ending.id} value={ending.id}>
                      {ending.id}
                    </option>
                  ))}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}
