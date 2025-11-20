import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/config";
import { toast } from "react-toastify";
import { HiChevronLeft, HiChevronRight } from "../components/Icons";
import ConfirmModal from "../components/ConfirmModal";

export default function UserWriting() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [assignedTests, setAssignedTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [testData, setTestData] = useState(null);
  const [currentTask, setCurrentTask] = useState(0); // 0 = Task 1, 1 = Task 2
  const [answers, setAnswers] = useState({ task1: "", task2: "" });
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [testStarted, setTestStarted] = useState(false);

  useEffect(() => {
    fetchAssignedTests();
  }, []);

  // Handle auto-loading test from navigation state
  useEffect(() => {
    if (location.state?.testId && location.state?.autoStart) {
      setSelectedTest(location.state.testId);
      fetchTestData(location.state.testId);
    }
  }, [location.state]);

  const fetchAssignedTests = async () => {
    try {
      const response = await api.get("/tests/assigned", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const writingTest = response.data.writing;
      if (writingTest) {
        setSelectedTest(writingTest.id);
        fetchTestData(writingTest.id);
      }
      setAssignedTests(writingTest ? [writingTest] : []);
    } catch (error) {
      toast.error("Failed to fetch assigned tests");
    } finally {
      setLoading(false);
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
    }
  };

  useEffect(() => {
    if (testData && testStarted) {
      setTimeRemaining(testData.duration || 3600); // 60 minutes default
    }
  }, [testData, testStarted]);

  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || !testStarted) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, testStarted]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartTest = () => {
    setTestStarted(true);
    setShowStartModal(false);
    toast.success("Test started! Good luck!");
  };

  const handleSubmit = async () => {
    try {
      setShowSubmitModal(false);
      toast.info("Analyzing your writing with AI...");

      await api.post(
        "/submissions",
        {
          testId: testData.id,
          answers,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      toast.success("Test submitted successfully!");
      toast.success("🎉 All tests completed! Well done!");
      navigate("/exam");
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Failed to submit test");
    }
  };

  const getWordCount = (text) => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const handleAnswerChange = (taskKey, value) => {
    setAnswers((prev) => ({
      ...prev,
      [taskKey]: value,
    }));
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
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            No Writing Test Assigned
          </h2>
          <button
            onClick={() => navigate("/exam")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Exam Selection
          </button>
        </div>
      </div>
    );
  }

  const currentTaskData = testData.questions[currentTask];
  const taskKey = currentTask === 0 ? "task1" : "task2";
  const wordCount = getWordCount(answers[taskKey]);
  const minWords = currentTaskData?.minimum_words || 0;
  const isUnderMinimum = wordCount < minWords;

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
                {user.username} • {user.role}
              </p>
            </div>
            <div className="flex items-center gap-4">
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
                onClick={() => navigate("/exam")}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Back to Tests
              </button>
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
      <div className="flex-1 flex overflow-hidden pb-20">
        {/* Left Panel - Task Instructions */}
        <div className="w-1/2 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-6">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 font-semibold rounded">
                  {currentTaskData.type}
                </span>
                <span className="text-sm text-gray-600">
                  Recommended time: {currentTaskData.recommended_time_minutes}{" "}
                  minutes
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Task {currentTask + 1}
              </h2>
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                {currentTaskData.prompt}
              </p>
            </div>

            {/* Task Image if exists */}
            {currentTaskData.image && (
              <div className="my-6">
                <img
                  src={currentTaskData.image}
                  alt={`Task ${currentTask + 1}`}
                  className="max-w-full h-auto rounded-lg border border-gray-300"
                />
              </div>
            )}

            {/* Writing Guidelines */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">
                Writing Guidelines
              </h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>
                  • Write at least{" "}
                  <span className="font-semibold">{minWords} words</span>
                </li>
                <li>• Use clear, formal academic language</li>
                <li>• Structure your answer with clear paragraphs</li>
                <li>• Check your spelling and grammar</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Panel - Writing Area */}
        <div className="w-1/2 bg-gray-50 overflow-y-auto">
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Your Answer</h3>
              <div
                className={`text-sm font-semibold ${
                  isUnderMinimum ? "text-red-600" : "text-green-600"
                }`}
              >
                {wordCount} / {minWords} words
              </div>
            </div>
            <textarea
              value={answers[taskKey]}
              onChange={(e) => handleAnswerChange(taskKey, e.target.value)}
              disabled={!testStarted}
              className="w-full h-[calc(100vh-300px)] p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-sm"
              placeholder={
                testStarted
                  ? "Start writing your answer here..."
                  : "Click 'Start Test' to begin writing"
              }
            />
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 fixed bottom-0 left-0 right-0 z-40">
        <div className="flex items-center justify-between">
          {/* Task Navigation */}
          <div className="flex gap-2">
            {testData.questions.map((task, index) => (
              <button
                key={index}
                onClick={() => setCurrentTask(index)}
                disabled={!testStarted}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  currentTask === index
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Task {index + 1}
              </button>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => setCurrentTask((prev) => Math.max(0, prev - 1))}
              disabled={currentTask === 0 || !testStarted}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <HiChevronLeft className="w-5 h-5" />
              Previous
            </button>
            {currentTask < testData.questions.length - 1 ? (
              <button
                onClick={() =>
                  setCurrentTask((prev) =>
                    Math.min(testData.questions.length - 1, prev + 1)
                  )
                }
                disabled={!testStarted}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <HiChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => setShowSubmitModal(true)}
                disabled={!testStarted}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Test
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Start Modal */}
      {showStartModal && (
        <ConfirmModal
          isOpen={showStartModal}
          onClose={() => {
            setShowStartModal(false);
            navigate("/exam");
          }}
          onConfirm={handleStartTest}
          title="Start Writing Test"
          message={`You are about to start the writing test. The timer will begin immediately. You have ${
            testData.duration / 60
          } minutes to complete both tasks. Are you ready?`}
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
          title="Submit Writing Test"
          message="Are you sure you want to submit your writing test? You cannot change your answers after submission."
          confirmText="Submit"
          cancelText="Cancel"
        />
      )}
    </div>
  );
}
