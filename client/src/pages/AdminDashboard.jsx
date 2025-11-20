import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/config";
import { toast } from "react-toastify";
import ConfirmModal from "../components/ConfirmModal";
// Use custom lightweight icons instead of react-icons (saves ~1.3MB)
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaUsers,
  FaFileAlt,
  FaChartBar,
  FaEye,
  FaDownload,
} from "../components/Icons";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [combinedSubmissions, setCombinedSubmissions] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAnswersModal, setShowAnswersModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [testDatabase, setTestDatabase] = useState({
    listening: [],
    reading: [],
    writing: [],
  });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Lazy load data only when needed
  const [dataLoaded, setDataLoaded] = useState({
    users: false,
    submissions: false,
    combinedSubmissions: false,
    testDatabase: false,
  });

  // Fetch users on mount and when switching to 'users' tab
  useEffect(() => {
    if (activeTab === "users") {
      setLoading(true);
      fetchUsers();
    }
  }, [activeTab]);

  // Fetch data based on active tab (lazy loading)
  useEffect(() => {
    if (activeTab === "submissions" && !dataLoaded.submissions) {
      fetchSubmissions();
      setDataLoaded((prev) => ({ ...prev, submissions: true }));
    } else if (
      activeTab === "completeExams" &&
      !dataLoaded.combinedSubmissions
    ) {
      fetchCombinedSubmissions();
      setDataLoaded((prev) => ({ ...prev, combinedSubmissions: true }));
    } else if (activeTab === "tests" && !dataLoaded.testDatabase) {
      fetchTestDatabase();
      setDataLoaded((prev) => ({ ...prev, testDatabase: true }));
    }
  }, [activeTab, dataLoaded]);

  const fetchTestDatabase = async () => {
    try {
      const response = await api.get("/tests/all");
      // Ensure testDatabase is always an object with arrays
      setTestDatabase({
        listening: Array.isArray(response.data.listening)
          ? response.data.listening
          : [],
        reading: Array.isArray(response.data.reading)
          ? response.data.reading
          : [],
        writing: Array.isArray(response.data.writing)
          ? response.data.writing
          : [],
      });
    } catch (error) {
      setTestDatabase({ listening: [], reading: [], writing: [] });
      console.error("Error fetching test database:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get("/users");
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setUsers([]);
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const response = await api.get("/submissions/all");
      setSubmissions(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setSubmissions([]);
      console.error("Error fetching submissions:", error);
    }
  };

  const fetchCombinedSubmissions = async () => {
    try {
      const response = await api.get("/submissions/combined/all", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setCombinedSubmissions(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setCombinedSubmissions([]);
      console.error("Error fetching combined submissions:", error);
    }
  };

  const handleDeleteUser = async (userId) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete User",
      message:
        "Are you sure you want to delete this user? This action cannot be undone.",
      onConfirm: async () => {
        try {
          await api.delete(`/users/${userId}`);
          toast.success("User deleted successfully!");
          fetchUsers();
        } catch (error) {
          toast.error(error.response?.data?.message || "Error deleting user");
        }
      },
    });
  };

  const handleSaveUser = async (userData) => {
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, userData);
        toast.success("User updated successfully!");
      } else {
        await api.post("/users", userData);
        toast.success("User created successfully!");
      }
      setShowUserModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error saving user");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">Welcome, {user?.username}</span>
              <button onClick={logout} className="btn-secondary">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("users")}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === "users"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <FaUsers /> Users Management
            </button>
            <button
              onClick={() => setActiveTab("tests")}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === "tests"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <FaFileAlt /> Tests Database
            </button>
            <button
              onClick={() => setActiveTab("statistics")}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === "statistics"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <FaChartBar /> Statistics
            </button>
            <button
              onClick={() => setActiveTab("complete-exams")}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === "complete-exams"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <FaFileAlt /> Complete Exams
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="mt-6 pb-12">
          {activeTab === "users" && (
            <UsersTab
              users={users}
              submissions={submissions}
              onAddUser={() => {
                setEditingUser(null);
                setShowUserModal(true);
              }}
              onEditUser={(user) => {
                setEditingUser(user);
                setShowUserModal(true);
              }}
              onDeleteUser={handleDeleteUser}
              loading={loading}
            />
          )}

          {activeTab === "tests" && (
            <TestsTab
              testDatabase={testDatabase}
              onRefreshTests={fetchTestDatabase}
            />
          )}

          {activeTab === "statistics" && (
            <StatisticsTab
              submissions={submissions}
              users={users}
              onViewDetails={(submission) => {
                setSelectedSubmission(submission);
                setShowAnswersModal(true);
              }}
            />
          )}

          {activeTab === "complete-exams" && (
            <CompleteExamsTab
              combinedSubmissions={combinedSubmissions}
              users={users}
            />
          )}
        </div>
      </div>

      {/* User Modal */}
      {showUserModal && (
        <UserModal
          user={editingUser}
          testDatabase={testDatabase}
          onClose={() => {
            setShowUserModal(false);
            setEditingUser(null);
          }}
          onSave={handleSaveUser}
        />
      )}

      {/* Answers Details Modal */}
      {showAnswersModal && selectedSubmission && (
        <AnswersDetailsModal
          submission={selectedSubmission}
          users={users}
          onClose={() => {
            setShowAnswersModal(false);
            setSelectedSubmission(null);
          }}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type="danger"
      />
    </div>
  );
}

function UsersTab({
  users,
  onAddUser,
  onEditUser,
  onDeleteUser,
  loading,
  submissions,
}) {
  const [selectedUserStats, setSelectedUserStats] = useState(null);

  const getUserSubmissions = (userId) => {
    return submissions.filter((sub) => sub.userId === userId);
  };

  if (loading) {
    return <div className="text-center py-12">Loading users...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Users</h2>
        <button
          onClick={onAddUser}
          className="btn-primary flex items-center gap-2"
        >
          <FaPlus /> Add User
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Username
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned Tests
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Submissions
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {(Array.isArray(users) ? users : []).map((user) => {
              const userSubmissions = getUserSubmissions(user.id);
              const avgBand =
                userSubmissions.length > 0
                  ? (
                      userSubmissions.reduce(
                        (sum, sub) => sum + (parseFloat(sub.bandScore) || 0),
                        0
                      ) / userSubmissions.length
                    ).toFixed(1)
                  : "N/A";

              return (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === "admin"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {user.assignedTests
                      ? Object.values(user.assignedTests).filter(Boolean).length
                      : 0}{" "}
                    / 3 sections
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="flex flex-col">
                      <span className="font-semibold">
                        {userSubmissions.length} tests
                      </span>
                      <span className="text-xs text-gray-400">
                        Avg: {avgBand}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedUserStats(user)}
                      className="text-green-600 hover:text-green-900 mr-4"
                      title="View Statistics"
                    >
                      <FaChartBar />
                    </button>
                    <button
                      onClick={() => onEditUser(user)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                      title="Edit User"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => onDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete User"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* User Statistics Modal */}
      {selectedUserStats && (
        <UserStatisticsModal
          user={selectedUserStats}
          submissions={getUserSubmissions(selectedUserStats.id)}
          onClose={() => setSelectedUserStats(null)}
        />
      )}
    </div>
  );
}

function TestsTab({ testDatabase, onRefreshTests }) {
  const [activeSection, setActiveSection] = useState("listening");

  const handleToggleActivation = async (testId, currentStatus) => {
    try {
      await api.patch(`/tests/${testId}/activate`, {
        activated: !currentStatus,
      });
      toast.success("Test activation status updated successfully!");
      onRefreshTests();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Error updating test activation"
      );
    }
  };

  const sections = [
    { key: "listening", label: "Listening", icon: "🎧" },
    { key: "reading", label: "Reading", icon: "📖" },
    { key: "writing", label: "Writing", icon: "✍️" },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Tests Database</h2>

      {/* Section Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {(Array.isArray(sections) ? sections : []).map((section) => (
            <button
              key={section.key}
              onClick={() => setActiveSection(section.key)}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeSection === section.key
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <span>{section.icon}</span>
              {section.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tests List */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">
            {sections.find((s) => s.key === activeSection)?.label} Tests
          </h3>
          <span className="text-sm text-gray-500">
            {testDatabase[activeSection]?.length || 0} test(s) available
          </span>
        </div>

        {testDatabase[activeSection]?.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No tests found in this section.</p>
            <p className="text-sm mt-2">
              Add test JSON files to{" "}
              <code className="bg-gray-100 px-2 py-1 rounded">
                test-database/{activeSection}/
              </code>
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {(Array.isArray(testDatabase[activeSection])
              ? testDatabase[activeSection]
              : []
            ).map((test) => (
              <div
                key={test.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{test.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {test.parts?.length || 0} Parts • {test.total_questions}{" "}
                      Questions • {Math.floor(test.duration / 60)} minutes
                    </p>
                    <p className="text-xs text-gray-500 mt-1">ID: {test.id}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        handleToggleActivation(test.id, test.activated)
                      }
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        test.activated
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {test.activated
                        ? "✓ Active for Exam"
                        : "Activate for Exam"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Only ONE test per section can be active for
            exams at a time. Users will be assigned the active test from each
            section.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatisticsTab({ submissions, users, onViewDetails }) {
  const [selectedUserId, setSelectedUserId] = useState("all");

  // Filter submissions based on selected user
  const filteredSubmissions =
    selectedUserId === "all"
      ? submissions
      : submissions.filter((s) => s.userId === parseInt(selectedUserId));

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Exam Statistics</h2>

        {/* User Filter Dropdown */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="userFilter"
            className="text-sm font-medium text-gray-700"
          >
            Filter by User:
          </label>
          <select
            id="userFilter"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Users</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.username})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="card">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            {selectedUserId === "all" ? "Total Users" : "Selected User"}
          </h3>
          <p className="text-3xl font-bold text-blue-600">
            {selectedUserId === "all"
              ? users.length
              : users.find((u) => u.id === parseInt(selectedUserId))?.name ||
                "N/A"}
          </p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Total Submissions
          </h3>
          <p className="text-3xl font-bold text-green-600">
            {filteredSubmissions.length}
          </p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Average Band Score
          </h3>
          <p className="text-3xl font-bold text-purple-600">
            {filteredSubmissions.length > 0
              ? (
                  filteredSubmissions.reduce((sum, s) => sum + s.bandScore, 0) /
                  filteredSubmissions.length
                ).toFixed(1)
              : "0.0"}
          </p>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Test
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Band
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {(Array.isArray(filteredSubmissions)
              ? filteredSubmissions
              : []
            ).map((submission) => {
              // Check if this is a writing test
              const isWriting =
                submission.testId && submission.testId.includes("writing");

              return (
                <tr key={submission.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {submission.username || "Unknown"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {submission.testId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {isWriting
                      ? "Writing (2 tasks)"
                      : `${submission.correctCount} / ${submission.totalQuestions}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                      {submission.bandScore || "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(submission.submittedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => onViewDetails(submission)}
                      className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                    >
                      <FaEye /> View Details
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredSubmissions.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  {selectedUserId === "all"
                    ? "No submissions yet"
                    : "This user has no submissions yet"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CompleteExamsTab({ combinedSubmissions, users }) {
  const handleDownloadPDF = async (submissionId, username) => {
    try {
      const response = await api.get(
        `/submissions/combined/${submissionId}/pdf`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          responseType: "blob",
        }
      );

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `exam-report-${username}-${submissionId}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Failed to download PDF");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Complete Exam Submissions</h2>
        <p className="text-sm text-gray-600">
          Total: {combinedSubmissions.length} complete exams
        </p>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Listening
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reading
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Writing
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Overall Band
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {(Array.isArray(combinedSubmissions)
              ? combinedSubmissions
              : []
            ).map((submission) => {
              const data = submission.submissionData;
              return (
                <tr key={submission.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {submission.name} ({submission.username})
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {data.listening ? (
                      <span className="text-green-600 font-semibold">
                        ✓ {data.listening.bandScore}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {data.reading ? (
                      <span className="text-green-600 font-semibold">
                        ✓ {data.reading.bandScore}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {data.writing ? (
                      <span className="text-green-600 font-semibold">
                        ✓ {data.writing.bandScore}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-bold rounded-full">
                      {submission.overallBandScore || "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {submission.completed ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                        Complete
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                        In Progress
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(submission.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() =>
                        handleDownloadPDF(submission.id, submission.username)
                      }
                      disabled={!submission.completed}
                      className={`flex items-center gap-1 ${
                        submission.completed
                          ? "text-green-600 hover:text-green-900"
                          : "text-gray-400 cursor-not-allowed"
                      }`}
                      title={
                        submission.completed
                          ? "Download PDF"
                          : "Complete all sections first"
                      }
                    >
                      <FaDownload /> Download PDF
                    </button>
                  </td>
                </tr>
              );
            })}
            {combinedSubmissions.length === 0 && (
              <tr>
                <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                  No complete exam submissions yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserModal({ user, testDatabase, onClose, onSave }) {
  const [formData, setFormData] = useState({
    username: user?.username || "",
    password: "",
    role: user?.role || "user",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {user ? "Edit User" : "Add User"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password {user && "(leave blank to keep current)"}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="input-field"
              required={!user}
              autoComplete="current-password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              className="input-field"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Tests are automatically shown to all users
              when activated in the Tests Database tab.
            </p>
          </div>

          <div className="flex gap-3 mt-6">
            <button type="submit" className="btn-primary flex-1">
              Save
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AnswersDetailsModal({ submission, users, onClose }) {
  const [detailedResults, setDetailedResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetailedResults = async () => {
      try {
        const response = await api.get(`/submissions/${submission.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        console.log("Detailed results received:", response.data);
        console.log(
          "Number of questions in results:",
          Object.keys(response.data.results || {}).length
        );
        setDetailedResults(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching detailed results:", error);
        setLoading(false);
      }
    };

    fetchDetailedResults();
  }, [submission.id]);

  const user = users.find((u) => u.id === submission.userId);

  // Check if this is a writing test
  const isWriting = submission.testId && submission.testId.includes("writing");

  const formatAnswer = (answer) => {
    if (Array.isArray(answer)) {
      return answer.join(", ");
    }
    return answer || "(No answer)";
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto my-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Detailed Answer Review</h2>
            <div className="text-sm text-gray-600">
              <p>
                <strong>Student:</strong> {user?.name}
              </p>
              <p>
                <strong>Test:</strong> {submission.testId}
              </p>
              {!isWriting && (
                <p>
                  <strong>Score:</strong> {submission.correctCount} /{" "}
                  {submission.totalQuestions}
                </p>
              )}
              <p>
                <strong>Band Score:</strong> {submission.bandScore}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(submission.submittedAt).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading detailed results...</div>
        ) : detailedResults ? (
          <div className="space-y-3">
            {isWriting ? (
              // Writing Test Assessment Display
              <div className="space-y-6">
                {/* Debug info - can remove later */}
                {!detailedResults.answers?.assessment && (
                  <div className="bg-yellow-50 border border-yellow-300 p-4 rounded">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Assessment data structure:{" "}
                      {JSON.stringify(Object.keys(detailedResults))}
                    </p>
                  </div>
                )}

                {/* Overall Band Score */}
                <div className="bg-blue-50 border-2 border-blue-500 rounded-xl p-6 text-center">
                  <div className="text-sm text-gray-600 mb-1">
                    Overall Band Score
                  </div>
                  <div className="text-5xl font-bold text-blue-600">
                    {detailedResults.answers?.assessment?.overallBand ||
                      detailedResults.bandScore ||
                      submission.bandScore ||
                      "N/A"}
                  </div>
                </div>

                {/* Task 1 Assessment */}
                {detailedResults.answers?.assessment?.task1 ? (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      📊 Task 1 Assessment
                    </h3>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-white rounded-lg p-4 shadow">
                        <div className="text-sm text-gray-600">Band Score</div>
                        <div className="text-3xl font-bold text-purple-600">
                          {detailedResults.answers.assessment.task1.overallBand}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow">
                        <div className="text-sm text-gray-600">Word Count</div>
                        <div className="text-3xl font-bold text-gray-900">
                          {detailedResults.answers.assessment.task1.wordCount}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="font-semibold text-gray-700 mb-2">
                          Task Achievement
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-xl font-bold text-purple-600">
                            {
                              detailedResults.answers.assessment.task1
                                .taskAchievement.band
                            }
                          </span>
                          <span className="text-sm text-gray-600">
                            {
                              detailedResults.answers.assessment.task1
                                .taskAchievement.feedback
                            }
                          </span>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="font-semibold text-gray-700 mb-2">
                          Coherence & Cohesion
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-xl font-bold text-purple-600">
                            {
                              detailedResults.answers.assessment.task1
                                .coherenceCohesion.band
                            }
                          </span>
                          <span className="text-sm text-gray-600">
                            {
                              detailedResults.answers.assessment.task1
                                .coherenceCohesion.feedback
                            }
                          </span>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="font-semibold text-gray-700 mb-2">
                          Lexical Resource
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-xl font-bold text-purple-600">
                            {
                              detailedResults.answers.assessment.task1
                                .lexicalResource.band
                            }
                          </span>
                          <span className="text-sm text-gray-600">
                            {
                              detailedResults.answers.assessment.task1
                                .lexicalResource.feedback
                            }
                          </span>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="font-semibold text-gray-700 mb-2">
                          Grammatical Range & Accuracy
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-xl font-bold text-purple-600">
                            {
                              detailedResults.answers.assessment.task1
                                .grammaticalRange.band
                            }
                          </span>
                          <span className="text-sm text-gray-600">
                            {
                              detailedResults.answers.assessment.task1
                                .grammaticalRange.feedback
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Task 1 Writing Text */}
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="font-semibold text-gray-700 mb-2">
                        Student's Task 1 Answer:
                      </div>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded border">
                        {detailedResults.answers?.answers?.task1 ||
                          "(No answer provided)"}
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Task 2 Assessment */}
                {detailedResults.answers?.assessment?.task2 ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      ✍️ Task 2 Assessment
                    </h3>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-white rounded-lg p-4 shadow">
                        <div className="text-sm text-gray-600">Band Score</div>
                        <div className="text-3xl font-bold text-blue-600">
                          {detailedResults.answers.assessment.task2.overallBand}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow">
                        <div className="text-sm text-gray-600">Word Count</div>
                        <div className="text-3xl font-bold text-gray-900">
                          {detailedResults.answers.assessment.task2.wordCount}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="font-semibold text-gray-700 mb-2">
                          Task Achievement
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-xl font-bold text-blue-600">
                            {
                              detailedResults.answers.assessment.task2
                                .taskAchievement.band
                            }
                          </span>
                          <span className="text-sm text-gray-600">
                            {
                              detailedResults.answers.assessment.task2
                                .taskAchievement.feedback
                            }
                          </span>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="font-semibold text-gray-700 mb-2">
                          Coherence & Cohesion
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-xl font-bold text-blue-600">
                            {
                              detailedResults.answers.assessment.task2
                                .coherenceCohesion.band
                            }
                          </span>
                          <span className="text-sm text-gray-600">
                            {
                              detailedResults.answers.assessment.task2
                                .coherenceCohesion.feedback
                            }
                          </span>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="font-semibold text-gray-700 mb-2">
                          Lexical Resource
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-xl font-bold text-blue-600">
                            {
                              detailedResults.answers.assessment.task2
                                .lexicalResource.band
                            }
                          </span>
                          <span className="text-sm text-gray-600">
                            {
                              detailedResults.answers.assessment.task2
                                .lexicalResource.feedback
                            }
                          </span>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="font-semibold text-gray-700 mb-2">
                          Grammatical Range & Accuracy
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-xl font-bold text-blue-600">
                            {
                              detailedResults.answers.assessment.task2
                                .grammaticalRange.band
                            }
                          </span>
                          <span className="text-sm text-gray-600">
                            {
                              detailedResults.answers.assessment.task2
                                .grammaticalRange.feedback
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Task 2 Writing Text */}
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="font-semibold text-gray-700 mb-2">
                        Student's Task 2 Answer:
                      </div>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded border">
                        {detailedResults.answers?.answers?.task2 ||
                          "(No answer provided)"}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              // Listening/Reading Test Display (existing code)
              <>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-green-50 border border-green-200 rounded p-3">
                    <div className="text-sm text-gray-600">Correct Answers</div>
                    <div className="text-2xl font-bold text-green-600">
                      {submission.correctCount}
                    </div>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <div className="text-sm text-gray-600">
                      Incorrect Answers
                    </div>
                    <div className="text-2xl font-bold text-red-600">
                      {submission.totalQuestions - submission.correctCount}
                    </div>
                  </div>
                </div>

                <h3 className="font-semibold text-lg mb-3">All Answers:</h3>
                <div className="space-y-2">
                  {detailedResults.results &&
                  typeof detailedResults.results === "object" &&
                  Object.keys(detailedResults.results).length > 0 ? (
                    (Array.isArray(Object.keys(detailedResults.results))
                      ? Object.keys(detailedResults.results)
                      : []
                    )
                      .sort((a, b) => parseInt(a) - parseInt(b))
                      .map((questionId) => {
                        const result = detailedResults.results[questionId];

                        // Skip if result is not valid
                        if (
                          !result ||
                          typeof result !== "object" ||
                          !result.hasOwnProperty("isCorrect")
                        ) {
                          return null;
                        }

                        const isCorrect = result.isCorrect;

                        return (
                          <div
                            key={questionId}
                            className={`p-3 rounded border-l-4 ${
                              isCorrect
                                ? "bg-green-50 border-green-500"
                                : "bg-red-50 border-red-500"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <span className="font-semibold">
                                  Q{questionId}:
                                </span>
                                <div className="mt-1">
                                  <div className="text-sm">
                                    <span className="text-gray-600">
                                      Student's answer:
                                    </span>{" "}
                                    <span
                                      className={
                                        isCorrect
                                          ? "text-green-700 font-medium"
                                          : "text-red-700 font-medium"
                                      }
                                    >
                                      {formatAnswer(result.userAnswer)}
                                    </span>
                                  </div>
                                  {!isCorrect && (
                                    <div className="text-sm mt-1">
                                      <span className="text-gray-600">
                                        Correct answer:
                                      </span>{" "}
                                      <span className="text-green-700 font-medium">
                                        {formatAnswer(result.correctAnswer)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div>
                                {isCorrect ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    ✓ Correct
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    ✗ Incorrect
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No detailed results available
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-red-600">
            Error loading detailed results
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function UserStatisticsModal({ user, submissions, onClose }) {
  const listeningTests = submissions.filter((s) =>
    s.testId.includes("listening")
  );
  const readingTests = submissions.filter((s) => s.testId.includes("reading"));
  const writingTests = submissions.filter((s) => s.testId.includes("writing"));

  const getAvgBand = (tests) => {
    if (tests.length === 0) return "N/A";
    const sum = tests.reduce(
      (acc, test) => acc + (parseFloat(test.bandScore) || 0),
      0
    );
    return (sum / tests.length).toFixed(1);
  };

  const getHighestBand = (tests) => {
    if (tests.length === 0) return "N/A";
    return Math.max(
      ...(Array.isArray(tests) ? tests : []).map(
        (t) => parseFloat(t.bandScore) || 0
      )
    ).toFixed(1);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto my-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Student Statistics</h2>
            <p className="text-gray-600">
              <strong>Student:</strong> {user.name} ({user.username})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Overall Statistics */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Total Tests</div>
            <div className="text-3xl font-bold text-blue-600">
              {submissions.length}
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Average Band</div>
            <div className="text-3xl font-bold text-green-600">
              {getAvgBand(submissions)}
            </div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Highest Band</div>
            <div className="text-3xl font-bold text-purple-600">
              {getHighestBand(submissions)}
            </div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Latest Band</div>
            <div className="text-3xl font-bold text-orange-600">
              {submissions.length > 0 ? submissions[0].bandScore : "N/A"}
            </div>
          </div>
        </div>

        {/* Section Breakdown */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2 text-blue-600">
              🎧 Listening
            </h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Tests:</span>
                <span className="font-semibold">{listeningTests.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Band:</span>
                <span className="font-semibold">
                  {getAvgBand(listeningTests)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Highest:</span>
                <span className="font-semibold">
                  {getHighestBand(listeningTests)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2 text-green-600">
              📖 Reading
            </h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Tests:</span>
                <span className="font-semibold">{readingTests.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Band:</span>
                <span className="font-semibold">
                  {getAvgBand(readingTests)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Highest:</span>
                <span className="font-semibold">
                  {getHighestBand(readingTests)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2 text-purple-600">
              ✍️ Writing
            </h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Tests:</span>
                <span className="font-semibold">{writingTests.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Band:</span>
                <span className="font-semibold">
                  {getAvgBand(writingTests)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Highest:</span>
                <span className="font-semibold">
                  {getHighestBand(writingTests)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-3">Recent Submissions</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Test
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Score
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Band
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(Array.isArray(submissions) ? submissions : [])
                  .slice(0, 10)
                  .map((submission) => {
                    const isWriting = submission.testId.includes("writing");
                    return (
                      <tr key={submission.id}>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {submission.testId}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {isWriting
                            ? "Writing (2 tasks)"
                            : `${submission.correctCount} / ${submission.totalQuestions}`}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                            {submission.bandScore}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {new Date(
                            submission.submittedAt
                          ).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
            {submissions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No submissions yet
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
