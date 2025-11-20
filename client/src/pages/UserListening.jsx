import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/config";
import { toast } from "react-toastify";
import { HiVolumeUp, HiChevronLeft, HiChevronRight } from "../components/Icons";
import ConfirmModal from "../components/ConfirmModal";
import PartNavigation from "../components/PartNavigation";
import TableCompletion from "../components/questions/TableCompletion";
import SentenceCompletion from "../components/questions/SentenceCompletion";
import Matching from "../components/questions/Matching";
import FormCompletion from "../components/questions/FormCompletion";
import MultipleChoice from "../components/questions/MultipleChoice";
import NotesCompletion from "../components/questions/NotesCompletion";
import SummaryCompletion from "../components/questions/SummaryCompletion";
import MultipleChoiceMultiple from "../components/questions/MultipleChoiceMultiple";
import MapLabeling from "../components/questions/MapLabeling";
import ShortAnswer from "../components/questions/ShortAnswer";
import PlanLabeling from "../components/questions/PlanLabeling";

export default function UserListening() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [testData, setTestData] = useState(null);
  const [currentPart, setCurrentPart] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [audioRef, setAudioRef] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const isProgrammaticNavigation = useRef(false);

  useEffect(() => {
    if (location.state?.testId && location.state?.autoStart) {
      fetchTestData(location.state.testId);
    } else {
      // Try to fetch assigned listening test
      fetchAssignedTest();
    }
  }, []);

  const fetchAssignedTest = async () => {
    try {
      const response = await api.get("/tests/assigned", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (response.data.listening) {
        fetchTestData(response.data.listening.id);
      } else {
        toast.error("No listening test assigned");
        navigate("/exam");
      }
    } catch (error) {
      toast.error("Failed to fetch assigned test");
      navigate("/exam");
    }
  };

  const fetchTestData = async (testId) => {
    try {
      const response = await api.get(`/tests/${testId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setTestData(response.data);
      setShowStartModal(true);
    } catch (error) {
      toast.error("Failed to fetch test data");
      navigate("/exam");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (testData && !submitted && testStarted) {
      setTimeRemaining(testData.duration);
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

  // Sync navigation with focused input
  useEffect(() => {
    const handleInputFocus = (e) => {
      if (isProgrammaticNavigation.current) return;

      const target = e.target;
      const questionId = target.getAttribute("data-question-id");

      if (questionId) {
        const qId = parseInt(questionId);
        setCurrentQuestion(qId);

        const partIndex = Math.floor((qId - 1) / 10);
        if (partIndex !== currentPart) {
          setCurrentPart(partIndex);
        }
      }
    };

    document.addEventListener("focus", handleInputFocus, true);
    return () => document.removeEventListener("focus", handleInputFocus, true);
  }, [currentPart]);

  // Scroll to question
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentQuestion) {
        isProgrammaticNavigation.current = true;
        const input = document.querySelector(
          `[data-question-id="${currentQuestion}"]`
        );
        if (input) {
          input.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => {
            input.focus();
            setTimeout(() => {
              isProgrammaticNavigation.current = false;
            }, 50);
          }, 300);
        } else {
          isProgrammaticNavigation.current = false;
        }
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [currentQuestion]);

  const handleAnswerChange = (questionId, value) => {
    const newAnswers = { ...answers };

    // If value is empty or invalid, remove the answer
    if (
      !value ||
      (typeof value === "string" && value.trim() === "") ||
      (Array.isArray(value) && value.length === 0)
    ) {
      delete newAnswers[questionId];
    } else {
      newAnswers[questionId] = value;
    }

    setAnswers(newAnswers);
  };

  const handleStartTest = () => {
    setTestStarted(true);
    setShowStartModal(false);
    setStartTime(Date.now());
    toast.success("Test started! Good luck!");
  };

  const playAudio = () => {
    if (audioRef) {
      audioRef.play().catch((error) => {
        toast.error("Failed to play audio");
      });
    }
  };

  const handleSubmit = async () => {
    try {
      await api.post(
        "/submissions",
        {
          testId: testData.id,
          answers,
          timeSpent: Math.floor((Date.now() - startTime) / 1000),
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setSubmitted(true);
      toast.success("Listening test completed! Redirecting to Reading...");
      setTimeout(() => {
        navigate("/reading", { state: { autoStart: true } });
      }, 2000);
    } catch (error) {
      toast.error("Error submitting test");
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const renderQuestion = (question) => {
    switch (question.type) {
      case "Table Completion":
      case "table_completion":
        return (
          <TableCompletion
            data={question.data}
            answers={answers}
            onAnswerChange={handleAnswerChange}
          />
        );
      case "Sentence Completion":
      case "sentence_completion":
        return (
          <SentenceCompletion
            questions={question.questions}
            answers={answers}
            onAnswerChange={handleAnswerChange}
          />
        );
      case "Matching":
      case "matching":
        return (
          <Matching
            data={question.data}
            answers={answers}
            onAnswerChange={handleAnswerChange}
          />
        );
      case "Map Labeling":
      case "map_labeling":
        return (
          <MapLabeling
            data={question.data}
            answers={answers}
            onAnswerChange={handleAnswerChange}
          />
        );
      case "Plan Labeling":
      case "plan_labeling":
        return (
          <PlanLabeling
            data={question.data}
            answers={answers}
            onAnswerChange={handleAnswerChange}
          />
        );
      case "Form Completion":
      case "form_completion":
        return (
          <FormCompletion
            data={question.data}
            answers={answers}
            onAnswerChange={handleAnswerChange}
            testData={testData}
          />
        );
      case "Multiple Choice":
      case "multiple_choice":
        return (
          <MultipleChoice
            question={question}
            answers={answers}
            onAnswerChange={handleAnswerChange}
          />
        );
      case "Notes Completion":
      case "notes_completion":
        return (
          <NotesCompletion
            data={question.data}
            answers={answers}
            onAnswerChange={handleAnswerChange}
          />
        );
      case "Summary Completion":
      case "summary_completion":
        return (
          <SummaryCompletion
            data={question.data}
            answers={answers}
            onAnswerChange={handleAnswerChange}
          />
        );
      case "Multiple Choice Multiple":
      case "multiple_choice_multiple":
        return (
          <MultipleChoiceMultiple
            question={question}
            answers={answers}
            onAnswerChange={handleAnswerChange}
          />
        );
      case "Short Answer":
      case "short_answer":
        return (
          <ShortAnswer
            questions={question.questions}
            answers={answers}
            onAnswerChange={handleAnswerChange}
          />
        );
      default:
        return <div>Unknown question type: {question.type}</div>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-700">Loading...</div>
      </div>
    );
  }

  if (!testData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-700">Loading test data...</div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-green-600 mb-2">
            Listening Test Completed!
          </h1>
          <p className="text-gray-600 mb-6">
            Redirecting to the next section...
          </p>
        </div>
      </div>
    );
  }

  const currentPartData = testData.parts[currentPart];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {testData.title}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Part {currentPart + 1} of {testData.parts.length} •{" "}
                {user.username}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {testData.audio && testStarted && (
                <button
                  onClick={playAudio}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <HiVolumeUp className="w-5 h-5" />
                  Play Audio
                </button>
              )}
              {testStarted && (
                <div className="text-right">
                  <div
                    className={`text-2xl font-bold ${
                      timeRemaining < 300
                        ? "text-red-600"
                        : timeRemaining < 600
                        ? "text-yellow-600"
                        : "text-gray-900"
                    }`}
                  >
                    {formatTime(timeRemaining)}
                  </div>
                  <div className="text-xs text-gray-600">Time Remaining</div>
                </div>
              )}
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 pb-32">
        <div className="max-w-4xl mx-auto">
          {/* Part Title */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              PART {currentPartData.part}
            </h2>
            {currentPartData.title && (
              <h3 className="text-lg text-gray-700">{currentPartData.title}</h3>
            )}
          </div>

          {/* Questions */}
          <div className="space-y-8">
            {currentPartData.questions.map((question, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg shadow-md p-6 border-t border-gray-200"
              >
                {question.instruction && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                    <p className="text-sm font-medium text-yellow-800">
                      {question.instruction}
                    </p>
                  </div>
                )}
                {(question.data?.title || question.title) && (
                  <div className="mb-4">
                    <h4 className="text-base font-semibold text-gray-800 text-center">
                      {question.data?.title || question.title}
                    </h4>
                  </div>
                )}
                {renderQuestion(question)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Next/Prev Navigation - Fixed above part navigation */}
      <div className="fixed bottom-28 right-6 flex gap-2 z-20">
        <button
          onClick={() => {
            if (currentQuestion > 1) {
              setCurrentQuestion(currentQuestion - 1);
              const newPart = Math.floor((currentQuestion - 2) / 10);
              if (newPart !== currentPart) {
                setCurrentPart(newPart);
              }
            }
          }}
          disabled={currentQuestion === 1 || !testStarted}
          className={`flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-all ${
            currentQuestion === 1 || !testStarted
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-xl"
          }`}
          title="Previous Question"
        >
          <HiChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={() => {
            if (currentQuestion < testData.total_questions) {
              setCurrentQuestion(currentQuestion + 1);
              const newPart = Math.floor(currentQuestion / 10);
              if (newPart !== currentPart) {
                setCurrentPart(newPart);
              }
            }
          }}
          disabled={
            currentQuestion === testData.total_questions || !testStarted
          }
          className={`flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-all ${
            currentQuestion === testData.total_questions || !testStarted
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-xl"
          }`}
          title="Next Question"
        >
          <HiChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Part Navigation - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-20">
        <div className="w-full px-4 py-3">
          <PartNavigation
            currentPart={currentPart}
            setCurrentPart={setCurrentPart}
            currentQuestion={currentQuestion}
            setCurrentQuestion={setCurrentQuestion}
            answers={answers}
            onSubmit={() => setShowSubmitModal(true)}
            totalParts={testData.parts.length}
            questionsPerPart={10}
          />
        </div>
      </div>

      {/* Hidden Audio Element */}
      {testData.audio && (
        <audio
          ref={(audio) => setAudioRef(audio)}
          src={testData.audio}
          onEnded={() => toast.info("Audio playback completed")}
        />
      )}

      {/* Start Modal */}
      {showStartModal && (
        <ConfirmModal
          isOpen={showStartModal}
          onClose={() => {
            setShowStartModal(false);
            navigate("/exam");
          }}
          onConfirm={handleStartTest}
          title="Start Listening Test"
          message="Once you start the test, the audio will begin playing and the timer will start. Make sure you're ready!"
          confirmText="Start Test"
          cancelText="Cancel"
        />
      )}

      {/* Submit Modal */}
      {showSubmitModal && (
        <ConfirmModal
          isOpen={showSubmitModal}
          onClose={() => setShowSubmitModal(false)}
          onConfirm={() => {
            setShowSubmitModal(false);
            handleSubmit();
          }}
          title="Submit Listening Test"
          message="Are you sure you want to submit your test? You won't be able to change your answers after submission."
          confirmText="Submit"
          cancelText="Cancel"
        />
      )}
    </div>
  );
}
