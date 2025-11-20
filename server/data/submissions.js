// In-memory submission storage (in production, use a database)
let submissions = [];
let nextSubmissionId = 1;

const addSubmission = (submissionData) => {
  const newSubmission = {
    id: nextSubmissionId++,
    ...submissionData,
  };
  submissions.push(newSubmission);
  return newSubmission;
};

const getUserSubmissions = (userId) => {
  return submissions.filter((s) => s.userId === userId);
};

const getAllSubmissions = () => {
  return submissions;
};

const getSubmission = (submissionId) => {
  return submissions.find((s) => s.id === submissionId);
};

module.exports = {
  addSubmission,
  getUserSubmissions,
  getAllSubmissions,
  getSubmission,
};
