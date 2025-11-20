import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../api/config";
import { toast } from "react-toastify";
import {
  HiVolumeUp,
  IoBookOutline,
  BiPencil,
  FaCheckCircle,
} from "../components/Icons";

const TEST_TYPES = {
  LISTENING: "listening",
  READING: "reading",
  WRITING: "writing",
};

const TEST_STEPS = {
  LISTENING: "listening",
  READING: "reading",
  WRITING: "writing",
  COMPLETED: "completed",
};

export default function UserExam() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [assignedTests, setAssignedTests] = useState(null);
  const [completedTests, setCompletedTests] = useState({
    [TEST_TYPES.LISTENING]: false,
    [TEST_TYPES.READING]: false,
    [TEST_TYPES.WRITING]: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoized auth header to prevent recreating on every render
  const authHeader = useMemo(() => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : null;
  }, []);

  // Sanitize and validate testId to prevent XSS
  const sanitizeTestId = useCallback((testId) => {
    if (!testId || typeof testId !== "string") return null;
    // Only allow alphanumeric, hyphens, and underscores
    return testId.replace(/[^a-zA-Z0-9-_]/g, "");
  }, []);

  // Determine test type from testId
  const getTestTypeFromId = useCallback((testId) => {
    if (!testId) return null;
    const sanitized = testId.toLowerCase();
    if (sanitized.includes(TEST_TYPES.LISTENING)) return TEST_TYPES.LISTENING;
    if (sanitized.includes(TEST_TYPES.READING)) return TEST_TYPES.READING;
    if (sanitized.includes(TEST_TYPES.WRITING)) return TEST_TYPES.WRITING;
    return null;
  }, []);

  const fetchAssignedTests = useCallback(async () => {
    if (!authHeader) {
      setError("Authentication required");
      setLoading(false);
      return;
    }

    try {
      const response = await api.get("/tests/assigned", {
        headers: authHeader,
      });

      // Validate response data structure
      if (response.data && typeof response.data === "object") {
        setAssignedTests(response.data);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Failed to fetch assigned tests";
      toast.error(errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [authHeader]);

  const fetchCombinedSubmission = useCallback(async () => {
    if (!authHeader) return;

    try {
      const response = await api.get("/submissions/combined/my-submission", {
        headers: authHeader,
      });

      if (response.data && typeof response.data === "object") {
        const submissionData = response.data.submissionData;

        // Validate submissionData is an object before accessing properties
        if (submissionData && typeof submissionData === "object") {
          setCompletedTests({
            [TEST_TYPES.LISTENING]: Boolean(submissionData.listening),
            [TEST_TYPES.READING]: Boolean(submissionData.reading),
            [TEST_TYPES.WRITING]: Boolean(submissionData.writing),
          });
        }
      }
    } catch (err) {
      // Silent fail - no combined submission is acceptable for new users
      console.error("Error fetching combined submission:", err.message);
    }
  }, [authHeader]);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (isMounted) {
        await Promise.all([fetchAssignedTests(), fetchCombinedSubmission()]);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [fetchAssignedTests, fetchCombinedSubmission]);

  const startTest = useCallback(
    (testType, route) => {
      const testData = assignedTests?.[testType];
      if (!testData?.id) {
        toast.error(`No ${testType} test assigned`);
        return;
      }

      const sanitizedId = sanitizeTestId(testData.id);
      if (!sanitizedId) {
        toast.error("Invalid test ID");
        return;
      }

      navigate(route, {
        state: { testId: sanitizedId, autoStart: true },
      });
    },
    [assignedTests, navigate, sanitizeTestId]
  );

  const startListening = useCallback(() => {
    startTest(TEST_TYPES.LISTENING, "/exam/listening");
  }, [startTest]);

  const startReading = useCallback(() => {
    startTest(TEST_TYPES.READING, "/reading");
  }, [startTest]);

  const startWriting = useCallback(() => {
    startTest(TEST_TYPES.WRITING, "/writing");
  }, [startTest]);

  // Memoize current step calculation
  const currentStep = useMemo(() => {
    if (!completedTests[TEST_TYPES.LISTENING]) return TEST_STEPS.LISTENING;
    if (!completedTests[TEST_TYPES.READING]) return TEST_STEPS.READING;
    if (!completedTests[TEST_TYPES.WRITING]) return TEST_STEPS.WRITING;
    return TEST_STEPS.COMPLETED;
  }, [completedTests]);

  // Memoize progress bar width
  const progressWidth = useMemo(() => {
    switch (currentStep) {
      case TEST_STEPS.LISTENING:
        return "0%";
      case TEST_STEPS.READING:
        return "50%";
      case TEST_STEPS.WRITING:
      case TEST_STEPS.COMPLETED:
        return "100%";
      default:
        return "0%";
    }
  }, [currentStep]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-700">Loading...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-xl text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchAssignedTests}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">IELTS Exam</h1>
              <p className="text-sm text-gray-600 mt-1">
                {user?.username || "User"} • {user?.role || "Student"}
              </p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              aria-label="Logout"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
            Welcome to Your IELTS Exam
          </h2>
          <p className="text-gray-600 text-center mb-8">
            Complete each section in order: Listening → Reading → Writing
          </p>

          {/* Progress Steps */}
          <div className="flex justify-between items-center mb-12 relative">
            {/* Progress Bar Background */}
            <div
              className="absolute top-6 left-0 right-0 h-1 bg-gray-200 -z-10"
              aria-hidden="true"
            ></div>
            <div
              className="absolute top-6 left-0 h-1 bg-blue-600 -z-10 transition-all duration-500"
              style={{ width: progressWidth }}
              aria-hidden="true"
            ></div>

            {/* Step 1: Listening */}
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all ${
                  completedTests[TEST_TYPES.LISTENING]
                    ? "bg-green-700 text-white"
                    : currentStep === TEST_STEPS.LISTENING
                    ? "bg-blue-600 text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
                role="status"
                aria-label={`Listening test ${
                  completedTests[TEST_TYPES.LISTENING] ? "completed" : "pending"
                }`}
              >
                {completedTests[TEST_TYPES.LISTENING] ? "✓" : "1"}
              </div>
              <span className="text-sm font-semibold mt-2 text-gray-700">
                Listening
              </span>
            </div>

            {/* Step 2: Reading */}
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all ${
                  completedTests[TEST_TYPES.READING]
                    ? "bg-green-700 text-white"
                    : currentStep === TEST_STEPS.READING
                    ? "bg-blue-600 text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
                role="status"
                aria-label={`Reading test ${
                  completedTests[TEST_TYPES.READING] ? "completed" : "pending"
                }`}
              >
                {completedTests[TEST_TYPES.READING] ? "✓" : "2"}
              </div>
              <span className="text-sm font-semibold mt-2 text-gray-700">
                Reading
              </span>
            </div>

            {/* Step 3: Writing */}
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all ${
                  completedTests[TEST_TYPES.WRITING]
                    ? "bg-green-700 text-white"
                    : currentStep === TEST_STEPS.WRITING
                    ? "bg-blue-600 text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
                role="status"
                aria-label={`Writing test ${
                  completedTests[TEST_TYPES.WRITING] ? "completed" : "pending"
                }`}
              >
                {completedTests[TEST_TYPES.WRITING] ? "✓" : "3"}
              </div>
              <span className="text-sm font-semibold mt-2 text-gray-700">
                Writing
              </span>
            </div>
          </div>

          {/* Test Cards */}
          <div className="space-y-4">
            {/* Listening Test */}
            <div
              className={`p-6 rounded-lg border-2 transition-all ${
                currentStep === TEST_STEPS.LISTENING
                  ? "border-blue-500 bg-blue-50"
                  : completedTests[TEST_TYPES.LISTENING]
                  ? "border-green-500 bg-green-50"
                  : "border-gray-300 bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <HiVolumeUp
                      className="text-3xl text-blue-600"
                      aria-hidden="true"
                    />
                    <h3 className="text-xl font-bold text-gray-900">
                      Listening Test
                    </h3>
                    {completedTests[TEST_TYPES.LISTENING] && (
                      <span className="px-3 py-1 bg-green-700 text-white text-sm font-semibold rounded-full">
                        Completed
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm">
                    Duration: 40 minutes • 40 questions
                  </p>
                </div>
                <button
                  onClick={startListening}
                  disabled={
                    !assignedTests?.listening ||
                    completedTests[TEST_TYPES.LISTENING]
                  }
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    completedTests[TEST_TYPES.LISTENING]
                      ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                      : currentStep === TEST_STEPS.LISTENING
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-400 text-gray-200 cursor-not-allowed"
                  }`}
                  aria-label="Start listening test"
                >
                  {completedTests[TEST_TYPES.LISTENING]
                    ? "Completed"
                    : "Start Test"}
                </button>
              </div>
            </div>

            {/* Reading Test */}
            <div
              className={`p-6 rounded-lg border-2 transition-all ${
                currentStep === TEST_STEPS.READING
                  ? "border-blue-500 bg-blue-50"
                  : completedTests[TEST_TYPES.READING]
                  ? "border-green-500 bg-green-50"
                  : "border-gray-300 bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <IoBookOutline
                      className="text-3xl text-blue-600"
                      aria-hidden="true"
                    />
                    <h3 className="text-xl font-bold text-gray-900">
                      Reading Test
                    </h3>
                    {completedTests[TEST_TYPES.READING] && (
                      <span className="px-3 py-1 bg-green-700 text-white text-sm font-semibold rounded-full">
                        Completed
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm">
                    Duration: 60 minutes • 40 questions
                  </p>
                </div>
                <button
                  onClick={startReading}
                  disabled={
                    !completedTests[TEST_TYPES.LISTENING] ||
                    completedTests[TEST_TYPES.READING]
                  }
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    completedTests[TEST_TYPES.READING]
                      ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                      : currentStep === TEST_STEPS.READING
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-400 text-gray-200 cursor-not-allowed"
                  }`}
                  aria-label="Start reading test"
                >
                  {completedTests[TEST_TYPES.READING]
                    ? "Completed"
                    : "Start Test"}
                </button>
              </div>
            </div>

            {/* Writing Test */}
            <div
              className={`p-6 rounded-lg border-2 transition-all ${
                currentStep === TEST_STEPS.WRITING
                  ? "border-blue-500 bg-blue-50"
                  : completedTests[TEST_TYPES.WRITING]
                  ? "border-green-500 bg-green-50"
                  : "border-gray-300 bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <BiPencil
                      className="text-3xl text-blue-600"
                      aria-hidden="true"
                    />
                    <h3 className="text-xl font-bold text-gray-900">
                      Writing Test
                    </h3>
                    {completedTests[TEST_TYPES.WRITING] && (
                      <span className="px-3 py-1 bg-green-700 text-white text-sm font-semibold rounded-full">
                        Completed
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm">
                    Duration: 60 minutes • 2 tasks
                  </p>
                </div>
                <button
                  onClick={startWriting}
                  disabled={
                    !completedTests[TEST_TYPES.READING] ||
                    completedTests[TEST_TYPES.WRITING]
                  }
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    completedTests[TEST_TYPES.WRITING]
                      ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                      : currentStep === TEST_STEPS.WRITING
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-400 text-gray-200 cursor-not-allowed"
                  }`}
                  aria-label="Start writing test"
                >
                  {completedTests[TEST_TYPES.WRITING]
                    ? "Completed"
                    : "Start Test"}
                </button>
              </div>
            </div>
          </div>

          {/* Completion Message */}
          {currentStep === TEST_STEPS.COMPLETED && (
            <div className="mt-8 p-8 bg-linear-to-r from-green-50 to-emerald-50 border-2 border-green-500 rounded-2xl shadow-lg">
              <div className="text-center mb-6">
                <h3 className="text-3xl font-bold text-green-900 mb-3">
                  🎉 Congratulations! 🎉
                </h3>
                <p className="text-xl text-green-800 font-semibold mb-2">
                  You have successfully completed all sections of the IELTS
                  exam!
                </p>
                <p className="text-gray-700">
                  Your comprehensive exam results will be reviewed by your
                  administrator.
                </p>
              </div>

              {/* Completed Sections Summary */}
              <div className="bg-white rounded-xl p-6 shadow-md">
                <h4 className="text-lg font-bold text-gray-900 mb-4 text-center">
                  Completed Sections ✓
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Listening */}
                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                    <HiVolumeUp
                      className="text-3xl text-green-700"
                      aria-hidden="true"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">Listening</p>
                      <p className="text-sm text-green-700 flex items-center gap-1">
                        <FaCheckCircle className="text-xs" aria-hidden="true" />{" "}
                        Completed
                      </p>
                    </div>
                  </div>

                  {/* Reading */}
                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                    <IoBookOutline
                      className="text-3xl text-green-700"
                      aria-hidden="true"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">Reading</p>
                      <p className="text-sm text-green-700 flex items-center gap-1">
                        <FaCheckCircle className="text-xs" aria-hidden="true" />{" "}
                        Completed
                      </p>
                    </div>
                  </div>

                  {/* Writing */}
                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                    <BiPencil
                      className="text-3xl text-green-700"
                      aria-hidden="true"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">Writing</p>
                      <p className="text-sm text-green-700 flex items-center gap-1">
                        <FaCheckCircle className="text-xs" aria-hidden="true" />{" "}
                        Completed
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-gray-600 text-sm">
                  Thank you for your dedication and hard work. Good luck with
                  your results! 🍀
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
