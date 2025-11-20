const bcrypt = require("bcryptjs");

// In-memory user storage (in production, use a database)
let users = [
  {
    id: 1,
    username: "admin",
    password: bcrypt.hashSync("admin123", 10),
    name: "Administrator",
    role: "admin",
    assignedTests: {
      listening: null,
      reading: null,
      writing: null,
    },
  },
  {
    id: 2,
    username: "student1",
    password: bcrypt.hashSync("password123", 10),
    name: "John Doe",
    role: "user",
    assignedTests: {
      listening: "cambridge6-listening-test1",
      reading: null,
      writing: null,
    },
  },
];

let nextUserId = 3;

const addUser = (userData) => {
  const newUser = {
    id: nextUserId++,
    ...userData,
  };
  users.push(newUser);
  return newUser;
};

const updateUser = (userId, updateData) => {
  const userIndex = users.findIndex((u) => u.id === userId);
  if (userIndex === -1) return null;

  users[userIndex] = {
    ...users[userIndex],
    ...updateData,
  };
  return users[userIndex];
};

const deleteUser = (userId) => {
  const userIndex = users.findIndex((u) => u.id === userId);
  if (userIndex === -1) return false;

  users.splice(userIndex, 1);
  return true;
};

module.exports = {
  users,
  addUser,
  updateUser,
  deleteUser,
};
