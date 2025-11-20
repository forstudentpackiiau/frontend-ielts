import React, { useState } from "react";

export default function DiagramLabeling({
  data,
  questionKey,
  answers,
  setAnswers,
  currentQuestion,
  setCurrentQuestion,
}) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Remove question range from instructions
  const cleanInstructions = (instructions) => {
    if (!instructions) return "";
    return instructions.replace(/<p><i>Questions? \d+(-\d+)?<\/i><\/p>/g, "");
  };

  if (!data || !data.labels) {
    return <div className="text-red-500">Invalid Diagram Labeling data</div>;
  }

  // Parse word limit from instructions
  const parseWordLimit = (instructions) => {
    const match = instructions?.match(
      /NO MORE THAN (\w+)(?:\s+AND\/OR A NUMBER)?(?:\s+WORDS?)?/i
    );
    if (!match) return null;
    const words = {
      ONE: 1,
      TWO: 2,
      THREE: 3,
      FOUR: 4,
    };
    return words[match[1].toUpperCase()] || null;
  };

  const wordLimit = parseWordLimit(data.instructions);

  const validateWordCount = (value, limit) => {
    if (!limit) return true;
    const wordCount = value.trim().split(/\s+/).filter(Boolean).length;
    return wordCount <= limit;
  };

  const handleChange = (questionNumber, value) => {
    if (wordLimit && !validateWordCount(value, wordLimit)) {
      return; // Prevent typing more words than the limit
    }
    setAnswers((prev) => ({
      ...prev,
      [questionNumber]: value,
    }));
  };

  // Dynamic input width calculation
  const getInputWidth = (questionNumber) => {
    const value = answers[questionNumber] || "";
    const minWidth = 80;
    const maxWidth = 250;
    const charWidth = 8;
    const calculatedWidth = Math.max(minWidth, (value.length || 8) * charWidth);
    return Math.min(calculatedWidth, maxWidth);
  };

  // Calculate question range
  const questionNumbers = data.labels.map((item) => item.number);
  const minQuestion = Math.min(...questionNumbers);
  const maxQuestion = Math.max(...questionNumbers);
  const questionRange =
    minQuestion === maxQuestion
      ? `Question ${minQuestion}`
      : `Questions ${minQuestion}-${maxQuestion}`;

  return (
    <div className="space-y-6">
      {/* Question Range Title */}
      <div className=" pl-4">
        <h3 className="text-lg font-bold text-gray-900">{questionRange}</h3>
      </div>

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

      {/* Diagram Image */}
      {data.image_url && (
        <div className="bg-white border border-gray-300 rounded-lg p-4">
          {!imageLoaded && !imageError && (
            <div className="w-full h-64 flex items-center justify-center bg-gray-100 rounded">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600 text-sm">Loading diagram...</p>
              </div>
            </div>
          )}
          {imageError && (
            <div className="w-full p-8 bg-red-50 border border-red-200 rounded text-center">
              <svg
                className="w-16 h-16 text-red-400 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className="text-red-700 font-semibold mb-2">
                Failed to load diagram image
              </p>
              <p className="text-sm text-red-600 mb-3">
                The image could not be loaded. Please check your internet
                connection.
              </p>
              <a
                href={data.image_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline text-sm"
              >
                Open image in new tab
              </a>
            </div>
          )}
          <img
            src={data.image_url}
            alt="Diagram"
            className={`w-full h-auto max-w-4xl mx-auto ${
              imageLoaded ? "block" : "hidden"
            }`}
            onLoad={() => {
              setImageLoaded(true);
              setImageError(false);
            }}
            onError={() => {
              setImageError(true);
              setImageLoaded(false);
            }}
          />
        </div>
      )}

      {/* Labels/Questions */}
      <div className="space-y-4">
        {data.labels.map((item) => {
          const isActive = currentQuestion === item.number;

          return (
            <div
              key={item.number}
              id={`question-${item.number}`}
              className={`p-4 rounded-lg transition-all ${
                isActive
                  ? "bg-blue-50 border-2 border-blue-400"
                  : "bg-white border border-gray-200"
              }`}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-lg text-gray-800">
                  {item.number}.
                </span>
                {item.label && (
                  <span
                    className="text-gray-800"
                    dangerouslySetInnerHTML={{ __html: item.label }}
                  />
                )}
                <input
                  type="text"
                  value={answers[item.number] || ""}
                  onChange={(e) => handleChange(item.number, e.target.value)}
                  onFocus={() => setCurrentQuestion(item.number)}
                  data-question-id={item.number}
                  style={{ width: `${getInputWidth(item.number)}px` }}
                  className="px-2 py-1 border border-gray-300 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all"
                  placeholder={item.number.toString()}
                  title={wordLimit ? `Maximum ${wordLimit} words` : ""}
                />
                {item.suffix && (
                  <span className="text-gray-800">{item.suffix}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
