import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import {
  HiChevronLeft,
  HiChevronRight,
  MdDragIndicator,
} from "../components/Icons";
import ConfirmModal from "../components/ConfirmModal";
import PartNavigation from "../components/PartNavigation";
import MatchingInformation from "../components/questions/reading/MatchingInformation";
import Classification from "../components/questions/reading/Classification";
import ShortAnswer from "../components/questions/ShortAnswer";
import TrueFalseNotGiven from "../components/questions/reading/TrueFalseNotGiven";
import SummaryCompletion from "../components/questions/SummaryCompletion";
import MatchingHeadings from "../components/questions/reading/MatchingHeadings";
import MatchingFeatures from "../components/questions/reading/MatchingFeatures";
import SentenceCompletion from "../components/questions/reading/SentenceCompletion";
import YesNoNotGiven from "../components/questions/reading/YesNoNotGiven";
import MultipleChoice from "../components/questions/reading/MultipleChoice";
import FlowchartCompletion from "../components/questions/reading/FlowchartCompletion";
import MultipleAnswer from "../components/questions/reading/MultipleAnswer";
import MultipleSelection from "../components/questions/reading/MultipleSelection";
import MapCompletion from "../components/questions/reading/MapCompletion";
import MatchingResearchers from "../components/questions/reading/MatchingResearchers";
import DiagramLabeling from "../components/questions/reading/DiagramLabeling";
import TableCompletion from "../components/questions/reading/TableCompletion";

export default function UserReading() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [assignedTests, setAssignedTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [testData, setTestData] = useState(null);
  const [currentPassage, setCurrentPassage] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(45); // percentage
  const [isResizing, setIsResizing] = useState(false);
  const [highlights, setHighlights] = useState({});
  const isProgrammaticNavigation = useRef(false);

  useEffect(() => {
    fetchAssignedTests();
  }, []);

  // Handle auto-loading test from navigation state (when redirected from /exam)
  useEffect(() => {
    if (location.state?.testId && location.state?.autoStart) {
      setSelectedTest(location.state.testId);
      fetchTestData(location.state.testId);
    }
  }, [location.state]);

  const fetchAssignedTests = async () => {
    try {
      const response = await axios.get("/api/tests/assigned", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      // Response is an object: {listening: {...}, reading: {...}, writing: {...}}
      // Extract reading test if it exists
      const readingTest = response.data.reading;
      if (readingTest) {
        // Automatically load the reading test
        setSelectedTest(readingTest.id);
        fetchTestData(readingTest.id);
      }
      setAssignedTests(readingTest ? [readingTest] : []);
    } catch (error) {
      toast.error("Failed to fetch assigned tests");
    } finally {
      setLoading(false);
    }
  };

  const fetchTestData = async (testId) => {
    try {
      const response = await axios.get(`/api/tests/${testId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setTestData(response.data);
      setShowStartModal(true);
    } catch (error) {
      toast.error("Failed to fetch test data");
    }
  };

  useEffect(() => {
    if (testData && !submitted && testStarted) {
      setTimeRemaining(testData.duration || 3600); // 60 minutes default
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [testData, submitted, testStarted]);

  const handleStartTest = () => {
    setTestStarted(true);
    setShowStartModal(false);
  };

  const handleCancelStart = () => {
    // Redirect to main exam page when canceling
    navigate("/exam");
  };

  const handleSubmit = async () => {
    try {
      await axios.post(
        "/api/submissions",
        {
          testId: selectedTest,
          answers,
          timeSpent: testData.duration - timeRemaining,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setSubmitted(true);
      toast.success("Reading test completed! Redirecting to Writing...");
      setTimeout(() => {
        navigate("/writing", { state: { autoStart: true } });
      }, 2000);
    } catch (error) {
      toast.error("Failed to submit test");
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Resizer handlers
  const handleMouseDown = (e) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizing) {
        const container = document.getElementById("reading-container");
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const newWidth =
            ((e.clientX - containerRect.left) / containerRect.width) * 100;
          // Limit between 20% and 80%
          setLeftPanelWidth(Math.min(Math.max(newWidth, 20), 80));
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  // Scroll to question when currentQuestion changes
  useEffect(() => {
    if (currentQuestion && testStarted) {
      const questionElement = document.getElementById(
        `question-${currentQuestion}`
      );
      if (questionElement) {
        questionElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [currentQuestion, testStarted]);

  // Text highlighting
  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection.toString().trim();

    if (text.length > 0) {
      const range = selection.getRangeAt(0);
      const passageKey = `passage_${currentPassage + 1}`;

      const highlightId = `highlight-${Date.now()}`;
      const span = document.createElement("span");
      span.className = "bg-yellow-200";
      span.setAttribute("data-highlight-id", highlightId);

      try {
        range.surroundContents(span);

        setHighlights((prev) => ({
          ...prev,
          [passageKey]: [
            ...(prev[passageKey] || []),
            { id: highlightId, text },
          ],
        }));

        selection.removeAllRanges();
      } catch (e) {
        // If surroundContents fails (e.g., partial element selection), extract and wrap
        console.warn("Could not highlight selection:", e);
      }
    }
  };

  const clearHighlights = () => {
    const passageKey = `passage_${currentPassage + 1}`;
    const highlightElements = document.querySelectorAll("[data-highlight-id]");
    highlightElements.forEach((el) => {
      const parent = el.parentNode;
      while (el.firstChild) {
        parent.insertBefore(el.firstChild, el);
      }
      parent.removeChild(el);
    });

    setHighlights((prev) => ({
      ...prev,
      [passageKey]: [],
    }));
  };

  const renderPassageContent = (passage) => {
    if (!passage) {
      return <p className="text-gray-500">No content available</p>;
    }

    // Handle new format with HTML text
    if (passage.text) {
      return (
        <div
          className="space-y-4 select-text prose prose-sm max-w-none"
          onMouseUp={handleTextSelection}
          dangerouslySetInnerHTML={{ __html: passage.text }}
        />
      );
    }

    // Handle old format with content.paragraphs
    if (!passage.content || !passage.content.paragraphs) {
      return <p className="text-gray-500">No content available</p>;
    }

    const paragraphs = passage.content.paragraphs;

    return (
      <div className="space-y-6">
        {passage.title && (
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {passage.title}
          </h2>
        )}
        {passage.subtitle && (
          <p className="text-lg text-gray-600 italic mb-6">
            {passage.subtitle}
          </p>
        )}

        <div className="space-y-4 select-text" onMouseUp={handleTextSelection}>
          {Object.entries(paragraphs).map(([key, text]) => (
            <div key={key} className="flex gap-4">
              <div className="font-bold text-gray-700 min-w-8">{key}</div>
              <p className="text-gray-800 leading-relaxed flex-1">{text}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderQuestion = (questionData, questionKey) => {
    if (!questionData) return null;

    const type = questionData.type;

    switch (type) {
      case "Matching Information":
        return (
          <MatchingInformation
            data={questionData}
            questionKey={questionKey}
            answers={answers}
            setAnswers={setAnswers}
            currentQuestion={currentQuestion}
            setCurrentQuestion={setCurrentQuestion}
          />
        );

      case "Classification":
        return (
          <Classification
            data={questionData}
            questionKey={questionKey}
            answers={answers}
            setAnswers={setAnswers}
            currentQuestion={currentQuestion}
            setCurrentQuestion={setCurrentQuestion}
          />
        );

      case "Short Answer":
        return (
          <ShortAnswer
            data={questionData}
            questionKey={questionKey}
            answers={answers}
            setAnswers={setAnswers}
            currentQuestion={currentQuestion}
            setCurrentQuestion={setCurrentQuestion}
          />
        );

      case "True/False/Not Given":
        return (
          <TrueFalseNotGiven
            data={questionData}
            questionKey={questionKey}
            answers={answers}
            setAnswers={setAnswers}
            currentQuestion={currentQuestion}
            setCurrentQuestion={setCurrentQuestion}
          />
        );

      case "Summary Completion":
        return (
          <SummaryCompletion
            data={questionData}
            questionKey={questionKey}
            answers={answers}
            setAnswers={setAnswers}
            currentQuestion={currentQuestion}
            setCurrentQuestion={setCurrentQuestion}
          />
        );

      case "Matching Headings":
        return (
          <MatchingHeadings
            data={questionData}
            questionKey={questionKey}
            answers={answers}
            setAnswers={setAnswers}
            currentQuestion={currentQuestion}
            setCurrentQuestion={setCurrentQuestion}
          />
        );

      case "Matching Features":
        return (
          <MatchingFeatures
            data={questionData}
            questionKey={questionKey}
            answers={answers}
            setAnswers={setAnswers}
            currentQuestion={currentQuestion}
            setCurrentQuestion={setCurrentQuestion}
          />
        );

      case "Sentence Completion":
        return (
          <SentenceCompletion
            data={questionData}
            questionKey={questionKey}
            answers={answers}
            setAnswers={setAnswers}
            currentQuestion={currentQuestion}
            setCurrentQuestion={setCurrentQuestion}
          />
        );

      case "Yes/No/Not Given":
        return (
          <YesNoNotGiven
            data={questionData}
            questionKey={questionKey}
            answers={answers}
            setAnswers={setAnswers}
            currentQuestion={currentQuestion}
            setCurrentQuestion={setCurrentQuestion}
          />
        );

      case "Multiple Choice":
        return (
          <MultipleChoice
            data={questionData}
            questionKey={questionKey}
            answers={answers}
            setAnswers={setAnswers}
            currentQuestion={currentQuestion}
            setCurrentQuestion={setCurrentQuestion}
          />
        );

      case "Flowchart Completion":
        return (
          <FlowchartCompletion
            data={questionData}
            questionKey={questionKey}
            answers={answers}
            setAnswers={setAnswers}
            currentQuestion={currentQuestion}
            setCurrentQuestion={setCurrentQuestion}
          />
        );

      case "Multiple Answer":
        return (
          <MultipleAnswer
            data={questionData}
            questionKey={questionKey}
            answers={answers}
            setAnswers={setAnswers}
            currentQuestion={currentQuestion}
            setCurrentQuestion={setCurrentQuestion}
          />
        );

      case "Multiple Selection":
        return (
          <MultipleSelection
            data={questionData}
            questionKey={questionKey}
            answers={answers}
            setAnswers={setAnswers}
            currentQuestion={currentQuestion}
            setCurrentQuestion={setCurrentQuestion}
          />
        );

      case "Map Completion":
        return (
          <MapCompletion
            data={questionData}
            questionKey={questionKey}
            answers={answers}
            setAnswers={setAnswers}
            currentQuestion={currentQuestion}
            setCurrentQuestion={setCurrentQuestion}
          />
        );

      case "Matching Researchers":
        return (
          <MatchingResearchers
            data={questionData}
            questionKey={questionKey}
            answers={answers}
            setAnswers={setAnswers}
            currentQuestion={currentQuestion}
            setCurrentQuestion={setCurrentQuestion}
          />
        );

      case "Diagram Labeling":
        return (
          <DiagramLabeling
            data={questionData}
            questionKey={questionKey}
            answers={answers}
            setAnswers={setAnswers}
            currentQuestion={currentQuestion}
            setCurrentQuestion={setCurrentQuestion}
          />
        );

      case "Table Completion":
        return (
          <TableCompletion
            data={questionData}
            questionKey={questionKey}
            answers={answers}
            setAnswers={setAnswers}
            currentQuestion={currentQuestion}
            setCurrentQuestion={setCurrentQuestion}
          />
        );

      default:
        return <p className="text-red-500">Unknown question type: {type}</p>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!testStarted || !testData) {
    return (
      <ConfirmModal
        isOpen={showStartModal}
        title="Reading Test Instructions"
        message={
          <div className="text-left space-y-4">
            <p className="text-gray-700">
              You will be reading passages and answering questions during this
              test.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>
                Read the passages carefully before answering the questions.
              </li>
              <li>You can highlight text by selecting it with your mouse.</li>
              <li>Use the navigation panel to move between questions.</li>
              <li>
                The timer will start when you click the "Begin" button below.
              </li>
            </ul>
            <p className="text-gray-600 text-sm">
              Duration: {Math.floor((testData?.duration || 3600) / 60)} minutes
            </p>
          </div>
        }
        onConfirm={handleStartTest}
        onClose={handleCancelStart}
        confirmText="Begin"
        cancelText="Cancel"
      />
    );
  }

  const passages = testData?.passages || [];
  const currentPassageData = passages[currentPassage];

  // Build parts with explicit question ranges for each passage
  const parts = [];
  const passageQuestions = [];

  passages.forEach((passage, index) => {
    parts.push(`Passage ${index + 1}`);
    const passageQs = [];

    if (passage.questions) {
      Object.keys(passage.questions).forEach((questionKey) => {
        const questionData = passage.questions[questionKey];

        // Handle items-based questions
        if (questionData.items) {
          questionData.items.forEach((item) => {
            // Skip example items that don't have question numbers
            if (item.isExample || !item.number) {
              return;
            }

            // Handle range format like "25-26"
            if (typeof item.number === "string" && item.number.includes("-")) {
              const [start, end] = item.number.split("-").map(Number);
              for (let i = start; i <= end; i++) {
                if (!passageQs.includes(i)) {
                  passageQs.push(i);
                }
              }
            } else if (!passageQs.includes(item.number)) {
              // Only add if not already in array (to avoid duplicates from multi-placeholder sentences)
              passageQs.push(item.number);
            }

            // For Sentence Completion, also extract question numbers from sentence placeholders
            if (item.sentence && typeof item.sentence === "string") {
              const matches = item.sentence.matchAll(/\[(\d+)\]/g);
              for (const match of matches) {
                const questionNum = parseInt(match[1]);
                // Only add if it's different from item.number (to handle [33] and [34] in same sentence)
                if (
                  questionNum !== item.number &&
                  !passageQs.includes(questionNum)
                ) {
                  passageQs.push(questionNum);
                }
              }
            }
          });
        }

        // Handle Diagram Labeling with labels array
        if (questionData.type === "Diagram Labeling" && questionData.labels) {
          questionData.labels.forEach((label) => {
            passageQs.push(label.number);
          });
        }

        // Handle Table Completion with embedded question numbers
        if (questionData.type === "Table Completion" && questionData.table) {
          questionData.table.rows.forEach((row) => {
            Object.values(row).forEach((cell) => {
              if (typeof cell === "string") {
                const matches = cell.matchAll(/\[(\d+)\]/g);
                for (const match of matches) {
                  passageQs.push(parseInt(match[1]));
                }
              }
            });
          });
        }
      });
    }

    passageQuestions.push(passageQs.sort((a, b) => a - b));
  });

  // Flatten all questions for the questions prop
  const questions = passageQuestions.flat();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          IELTS Reading Test - Passage {currentPassage + 1}
        </h1>
        <div className="flex items-center gap-6">
          <div className="text-lg font-semibold text-gray-700">
            Time Remaining:{" "}
            <span
              className={timeRemaining < 300 ? "text-red-600" : "text-blue-600"}
            >
              {formatTime(timeRemaining)}
            </span>
          </div>
          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
          >
            Submit Test
          </button>
        </div>
      </div>

      {/* Main Content - Resizable Panels */}
      <div
        id="reading-container"
        className="flex-1 flex relative"
        style={{ userSelect: isResizing ? "none" : "auto" }}
      >
        {/* Left Panel - Reading Passage */}
        <div
          className="absolute top-0 bottom-0 left-0 bg-white overflow-y-scroll overflow-x-hidden p-8 border-r border-gray-300"
          style={{ width: `${leftPanelWidth}%` }}
        >
          {/* Highlight Controls - Floating */}
          <div className="sticky top-0 z-10 flex justify-end mb-4 -mt-2">
            <button
              onClick={clearHighlights}
              className="px-3 py-1.5 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 text-sm shadow-md flex items-center gap-2"
              title="Clear all highlights"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Clear Highlights
            </button>
          </div>

          {currentPassageData && renderPassageContent(currentPassageData)}
        </div>

        {/* Resizer */}
        <div
          className="absolute top-0 bottom-0 w-1.5 bg-gray-300 cursor-col-resize hover:bg-blue-400 transition-all z-10 group"
          style={{ left: `${leftPanelWidth}%` }}
          onMouseDown={handleMouseDown}
        >
          {/* Wider hover area for easier grabbing */}
          <div className="absolute inset-y-0 -left-3 -right-3 cursor-col-resize" />

          {/* Visual grip indicator with arrows */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none bg-white rounded shadow-md px-1 py-2 opacity-70 group-hover:opacity-100 transition-opacity border border-gray-300">
            <MdDragIndicator className="h-6 w-6 text-gray-600 rotate-90" />
          </div>
        </div>

        {/* Right Panel - Questions */}
        <div
          className="absolute top-0 bottom-0 right-0 bg-gray-50 overflow-y-scroll overflow-x-hidden p-8"
          style={{ width: `${100 - leftPanelWidth}%` }}
        >
          {currentPassageData && currentPassageData.questions ? (
            <div className="space-y-8">
              {Object.entries(currentPassageData.questions).map(
                ([key, questionData]) => {
                  if (!questionData || typeof questionData !== "object") {
                    return (
                      <div
                        key={key}
                        className="bg-white rounded-lg shadow-md p-6"
                      >
                        <p className="text-red-500">
                          Invalid question data for {key}
                        </p>
                      </div>
                    );
                  }
                  return (
                    <div
                      key={key}
                      className="bg-white rounded-lg shadow-md p-6"
                    >
                      {renderQuestion(questionData, key)}
                    </div>
                  );
                }
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 mt-8">
              <p>No questions available for this passage.</p>
            </div>
          )}
        </div>
      </div>

      {/* Part Navigation - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-20">
        <div className="w-full px-4 py-3">
          <PartNavigation
            currentPart={currentPassage}
            setCurrentPart={setCurrentPassage}
            currentQuestion={currentQuestion}
            setCurrentQuestion={setCurrentQuestion}
            answers={answers}
            onSubmit={() => setShowSubmitModal(true)}
            parts={parts}
            questions={questions}
            passageQuestions={passageQuestions}
          />
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      <ConfirmModal
        isOpen={showSubmitModal}
        title="Submit Test"
        message="Are you sure you want to submit your test? You cannot change your answers after submission."
        onConfirm={() => {
          handleSubmit();
          setShowSubmitModal(false);
        }}
        onClose={() => setShowSubmitModal(false)}
        confirmText="Submit"
        cancelText="Cancel"
      />

      {/* Results Modal */}
      {submitted && (
        <div className="fixed inset-0 bg-gray-50 flex items-center justify-center z-50 py-12">
          <div className="max-w-3xl mx-auto px-4 w-full">
            <div className="card text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Test Submitted Successfully!
              </h1>

              <div className="bg-green-50 rounded-lg p-8 mb-6">
                <svg
                  className="w-20 h-20 text-green-500 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-lg text-gray-700">
                  Your answers have been submitted and are being reviewed.
                </p>
              </div>

              <p className="text-gray-600 mb-6">
                Redirecting to Writing test...
                <br />
                Please wait while we prepare your next section.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
