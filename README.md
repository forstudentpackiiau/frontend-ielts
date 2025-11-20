# IELTS Exam Platform

A full-stack web application for conducting IELTS (International English Language Testing System) exams online. Built with **React**, **TailwindCSS**, and **Express.js**, this platform provides a secure, user-friendly interface for both administrators and students.

---

## 📋 Table of Contents

- [Purpose of the Project](#purpose-of-the-project)
- [JSON File Structure](#json-file-structure)
- [Requirements Implementation](#requirements-implementation)
- [Installation](#installation)
- [Running the Project](#running-the-project)
- [Deployment](#deployment)
- [Example Usage](#example-usage)
- [Project Structure](#project-structure)
- [Features](#features)
- [Security](#security)
- [Technologies Used](#technologies-used)

---

## 🎯 Purpose of the Project

This IELTS Exam Platform is designed to:

1. **Facilitate Online IELTS Testing**: Provide a digital platform for conducting IELTS Listening, Reading, and Writing tests
2. **Manage Users and Tests**: Allow administrators to create users, assign tests, and monitor performance
3. **Ensure Exam Integrity**: Implement secure authentication and prevent users from accessing correct answers before submission
4. **Track Performance**: Calculate band scores automatically and provide detailed statistics
5. **Enhance User Experience**: Offer an intuitive, mobile-friendly interface with real-time navigation and progress tracking

---

## 📄 JSON File Structure

The platform uses JSON files to store test data. Each test file follows a structured format:

### Root Level Properties

```json
{
  "id": "cambridge6-listening-test1",
  "book": "cambridge6",
  "section": "listening",
  "title": "IELTS Book 6 Listening Test 1",
  "activated": true,
  "duration": 1800,
  "audio": "URL_to_audio_file",
  "total_questions": 40,
  "answers": { ... },
  "parts": [ ... ]
}
```

| Property          | Type    | Description                                       |
| ----------------- | ------- | ------------------------------------------------- |
| `id`              | string  | Unique identifier for the test                    |
| `book`            | string  | Source book (e.g., "cambridge6")                  |
| `section`         | string  | Test section (listening, reading, writing)        |
| `title`           | string  | Full test title                                   |
| `activated`       | boolean | Whether the test is available                     |
| `duration`        | number  | Test duration in seconds                          |
| `audio`           | string  | URL to audio file (for listening tests)           |
| `total_questions` | number  | Total number of questions                         |
| `answers`         | object  | Correct answers (key: question ID, value: answer) |
| `parts`           | array   | Array of test parts                               |

### Answers Format

Answers are stored as key-value pairs where:

- **Key**: Question ID (string or number)
- **Value**: Can be a string, number, or array (for questions with multiple correct answers)

```json
"answers": {
  "1": "keep-fit",
  "2": "swimming",
  "7": ["10", "4.30"],
  "19": ["Monday", "Thursday"],
  "38": ["C", "E", "F"]
}
```

### Parts Structure

Each part contains:

```json
{
  "part": 1,
  "title": "Notes on Sports Club",
  "questions": [
    {
      "type": "table_completion",
      "instruction": "Complete the notes below...",
      "data": { ... }
    }
  ]
}
```

### Question Types

The platform supports 8 different question types:

#### 1. Table Completion

Used for filling in tables with missing information.

```json
{
  "type": "table_completion",
  "instruction": "Complete the table below...",
  "data": {
    "title": "Membership Schemes",
    "headers": ["Type", "Cost", "Benefits"],
    "rows": [
      {
        "cells": [
          { "text": "GOLD" },
          { "id": 5, "prefix": "£" },
          { "text": "All facilities" }
        ]
      }
    ]
  }
}
```

#### 2. Sentence Completion

For completing sentences with missing words.

```json
{
  "type": "sentence_completion",
  "instruction": "Write ONE WORD ONLY...",
  "questions": [
    {
      "id": 9,
      "text": "To join, book an instructor's",
      "note": "(optional note)"
    }
  ]
}
```

#### 3. Matching

Match items to options (A, B, C, etc.).

```json
{
  "type": "matching",
  "instruction": "Match each part...",
  "data": {
    "items": [{ "id": 11, "text": "box office" }],
    "options": ["A. doubled in number", "B. given separate entrance"]
  }
}
```

#### 4. Form Completion

Fill in form fields.

```json
{
  "type": "form_completion",
  "instruction": "Complete the form...",
  "data": {
    "title": "Registration Form",
    "fields": [
      {
        "label": "Starting time",
        "id": 18,
        "suffix": "pm"
      }
    ]
  }
}
```

#### 5. Multiple Choice (Single Answer)

Select one correct answer from options.

```json
{
  "type": "multiple_choice",
  "id": 21,
  "text": "What is Brian going to do?",
  "options": ["A. attend a class", "B. write a report", "C. read a book"]
}
```

#### 6. Notes Completion

Complete notes or bullet points.

```json
{
  "type": "notes_completion",
  "instruction": "Complete the notes...",
  "data": {
    "items": [
      {
        "label": "Refectory",
        "text": "inform them",
        "id": 22,
        "suffix": "about dietary requirements"
      }
    ]
  }
}
```

#### 7. Summary Completion

Fill in blanks in a paragraph.

```json
{
  "type": "summary_completion",
  "instruction": "Complete the summary...",
  "data": {
    "title": "Business Centre",
    "text": "This centre contains [26] and [27]...",
    "gaps": [{ "id": 26 }, { "id": 27 }]
  }
}
```

#### 8. Multiple Choice (Multiple Answers)

Select multiple correct answers.

```json
{
  "type": "multiple_choice_multiple",
  "instruction": "Which THREE problems are mentioned?",
  "id": 38,
  "options": [
    "A. unsympathetic landlords",
    "B. unclean water",
    "C. heating problems"
  ]
}
```

---

## ✅ Requirements Implementation

Based on the requirements in `requirements.md`, here's how each feature was implemented:

### 1. Authentication & Routing

- **Implementation**: JWT-based authentication with role-based access control
- **Admin Login**: Redirects to `/admin` dashboard
- **User Login**: Redirects to `/exam` page
- **Security**: Protected routes prevent unauthorized access

### 2. Admin Panel (AdminDashboard)

- **CRUD Operations**: Full create, read, update, delete functionality for users
- **Test Management**: View all tests from JSON database
- **Test Assignment**: Assign specific tests to individual users
- **Statistics**: View detailed exam results, band scores, and performance metrics
- **Technologies**: React with axios for API calls, TailwindCSS for styling

### 3. Test Structure

- **JSON Storage**: Tests stored in structured JSON files (`cambridge6_listening_test1.json`)
- **Dynamic Rendering**: React components dynamically render different question types
- **Answer Security**: Users never receive correct answers during the exam
- **Admin Analytics**: Detailed statistics showing correct/incorrect answers per question

### 4. Exam UX/UI

- **Part Navigation Component**:
  - Shows all 4 parts with completion indicators
  - Displays current part with individual question numbers (1-40)
  - Visual feedback for answered vs. unanswered questions
  - Active question highlighting with ring indicator
  - Submit button integrated into navigation
- **Mobile-Friendly**: Responsive design using TailwindCSS
- **Intuitive Interface**: Clean, accessible layout with clear visual hierarchy
- **Timer**: Real-time countdown timer with warning when time is running out

### 5. Security & Data Protection

- **Answer Protection**: Backend-only storage of correct answers
- **Secure API**: All test data endpoints validate authentication
- **Score Calculation**: Server-side validation and scoring
- **Password Hashing**: bcryptjs for secure password storage
- **JWT Tokens**: Secure session management with expiration

### 6. Implementation Details

- **Frontend**:
  - React 18 with hooks (useState, useEffect, useContext)
  - TailwindCSS v3.3+ for styling
  - Component-based architecture
  - Context API for global state (authentication)
  - React Router v6 for navigation
- **Backend**:
  - Express.js REST API
  - Middleware for authentication and authorization
  - In-memory data storage (can be replaced with database)
  - CORS enabled for cross-origin requests
- **JSON Database**:
  - Organized folder structure (cambridge6/listening/test1.json)
  - Dynamic test loading from filesystem
  - Extensible format supporting multiple test types

---

## 🚀 Installation

### Prerequisites

- **Node.js** (version 16 or higher)
- **npm** (comes with Node.js)
- **Git** (optional, for cloning)

### Step-by-Step Installation

1. **Navigate to the project directory**:

   ```bash
   cd "c:\Users\bekbo\Desktop\06.11.2025"
   ```

2. **Install root dependencies**:

   ```bash
   npm install
   ```

3. **Install server dependencies**:

   ```bash
   cd server
   npm install
   cd ..
   ```

4. **Install client dependencies**:
   ```bash
   cd client
   npm install
   cd ..
   ```

Alternatively, use the convenience script:

```bash
npm run install-all
```

---

## ▶️ Running the Project

### Development Mode

**Option 1: Run both frontend and backend concurrently (recommended)**

```bash
npm run dev
```

This will start:

- Backend server on `http://localhost:5000`
- Frontend development server on `http://localhost:3000`

**Option 2: Run separately**

Terminal 1 (Backend):

```bash
npm run server
```

Terminal 2 (Frontend):

```bash
npm run client
```

### Accessing the Application

Once both servers are running:

- Open your browser and navigate to: `http://localhost:3000`
- You'll see the login page

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)

The easiest way to deploy this application is using Vercel, which provides free hosting for both frontend and backend.

#### Quick Deploy

1. **Push to GitHub**:

   ```bash
   # Windows
   deploy.bat

   # Linux/Mac
   chmod +x deploy.sh
   ./deploy.sh
   ```

2. **Deploy on Vercel**:

   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your GitHub repository
   - Follow the setup wizard

3. **Configure Environment Variables** (Important!):

   **Backend Project**:

   ```env
   JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
   CLIENT_URL=https://your-frontend-url.vercel.app
   NODE_ENV=production
   ```

   **Frontend Project**:

   ```env
   VITE_API_URL=https://your-backend-url.vercel.app
   ```

#### Complete Guide

For detailed step-by-step instructions including:

- DuckDNS setup (custom domain)
- Self-hosting options
- SSL/HTTPS configuration
- Troubleshooting tips

**See**: [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md)

### Alternative: Self-host with DuckDNS

If you prefer to host on your own server with a free DuckDNS domain, follow the complete guide in [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md).

---

---

## 💡 Example Usage

### As an Administrator

1. **Login**:

   - Username: `admin`
   - Password: `admin123`

2. **View Dashboard**:

   - See total users, submissions, and average band scores

3. **Manage Users**:

   - Click "Users Management" tab
   - Click "Add User" to create a new student account
   - Fill in username, password, name
   - Select "User" role
   - Assign "Cambridge 6 - Listening Test 1"
   - Click "Save"

4. **View Statistics**:

   - Click "Statistics" tab
   - See all submissions with:
     - Student name
     - Test taken
     - Score (e.g., 35/40)
     - Band score (e.g., 8.0)
     - Submission date

5. **Edit/Delete Users**:
   - Use edit icon to modify user details
   - Use trash icon to delete users

### As a Student

1. **Login**:

   - Username: `student1`
   - Password: `password123`

2. **View Assigned Tests**:

   - See list of tests assigned by admin
   - View test details (duration, total questions)

3. **Start Test**:

   - Click "Start Test" button
   - Audio player appears (for listening tests)
   - Timer starts counting down

4. **Navigate Through Test**:

   - Use Part Navigation bar at the top
   - Click on "Part 1", "Part 2", etc., to switch parts
   - Click on individual question numbers (1-40) within current part
   - Green indicators show answered questions
   - Blue ring shows currently active question

5. **Answer Questions**:

   - Fill in text fields, select radio buttons, or check checkboxes
   - Different question types have appropriate input methods
   - Your answers are saved in real-time

6. **Submit Test**:

   - Click "Submit" button in navigation bar
   - Confirm submission
   - View results immediately:
     - Band score (e.g., 7.5)
     - Correct answers (e.g., 32/40)
     - Percentage breakdown

7. **Return to Tests**:
   - Click "Back to Tests" to see other assigned tests

---

## 📁 Project Structure

```
06.11.2025/
├── client/                          # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── PartNavigation.jsx   # Part navigation component
│   │   │   └── questions/           # Question type components
│   │   │       ├── TableCompletion.jsx
│   │   │       ├── SentenceCompletion.jsx
│   │   │       ├── Matching.jsx
│   │   │       ├── FormCompletion.jsx
│   │   │       ├── MultipleChoice.jsx
│   │   │       ├── NotesCompletion.jsx
│   │   │       ├── SummaryCompletion.jsx
│   │   │       └── MultipleChoiceMultiple.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Authentication context
│   │   ├── pages/
│   │   │   ├── Login.jsx            # Login page
│   │   │   ├── AdminDashboard.jsx   # Admin dashboard
│   │   │   └── UserExam.jsx         # User exam interface
│   │   ├── App.jsx                  # Main app component
│   │   ├── main.jsx                 # React entry point
│   │   └── index.css                # TailwindCSS styles
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── vite.config.js
├── server/                          # Express.js backend
│   ├── data/
│   │   ├── users.js                 # User data management
│   │   ├── tests.js                 # Test data loading
│   │   └── submissions.js           # Submission storage
│   ├── middleware/
│   │   └── auth.js                  # Authentication middleware
│   ├── routes/
│   │   ├── auth.js                  # Authentication routes
│   │   ├── users.js                 # User CRUD routes
│   │   ├── tests.js                 # Test data routes
│   │   └── submissions.js           # Submission routes
│   ├── index.js                     # Server entry point
│   ├── package.json
│   └── .env                         # Environment variables
├── cambridge6_listening_test1.json  # Test data file
├── requirements.md                  # Original requirements
├── package.json                     # Root package.json
├── .gitignore
└── README.md                        # This file
```

---

## ✨ Features

### For Administrators

- ✅ User management (create, read, update, delete)
- ✅ Test database overview
- ✅ Assign tests to specific users
- ✅ View detailed statistics and performance metrics
- ✅ Calculate band scores automatically
- ✅ Monitor all submissions

### For Students

- ✅ View assigned tests
- ✅ Take tests with real-time timer
- ✅ Audio playback for listening tests
- ✅ Intuitive navigation between parts and questions
- ✅ Visual progress tracking
- ✅ Immediate results after submission
- ✅ Band score calculation

### Question Types Supported

1. Table Completion
2. Sentence Completion
3. Matching
4. Form Completion
5. Multiple Choice (single answer)
6. Notes Completion
7. Summary Completion
8. Multiple Choice (multiple answers)

---

## 🔒 Security

This platform implements multiple security measures:

1. **Password Hashing**: All passwords are hashed using bcryptjs before storage
2. **JWT Authentication**: Secure token-based authentication with expiration
3. **Role-Based Access**: Admin and user roles with appropriate permissions
4. **Protected Routes**: Frontend routes protected with authentication checks
5. **API Security**: All API endpoints validate JWT tokens
6. **Answer Protection**: Correct answers never sent to frontend during exam
7. **Server-Side Validation**: Score calculation and answer checking on backend only

---

## 🛠️ Technologies Used

### Frontend

- **React 18**: Modern JavaScript library for building user interfaces
- **React Router v6**: Client-side routing
- **TailwindCSS v3.3+**: Utility-first CSS framework
- **Axios**: HTTP client for API requests
- **React Icons**: Icon library
- **Vite**: Fast build tool and development server

### Backend

- **Express.js**: Web application framework for Node.js
- **bcryptjs**: Password hashing
- **jsonwebtoken (JWT)**: Token-based authentication
- **CORS**: Cross-Origin Resource Sharing
- **dotenv**: Environment variable management
- **body-parser**: Request body parsing

### Development Tools

- **Concurrently**: Run multiple npm scripts simultaneously
- **Nodemon**: Auto-restart server on file changes

---

## 🔄 Adding More Tests

To add new tests to the platform:

1. **Create a new JSON file** in the root directory (e.g., `cambridge7_reading_test2.json`)
2. **Follow the JSON structure** outlined in this README
3. **Update the test loading logic** in `server/data/tests.js` to include the new file
4. **Restart the server** to make the new test available

Example:

```javascript
// In server/data/tests.js
const tests = [
  "cambridge6_listening_test1.json",
  "cambridge7_reading_test2.json", // Add your new test here
];
```

---

## 🤝 Contributing

This is a demonstration project. For production use, consider:

- Implementing a proper database (PostgreSQL, MongoDB)
- Adding user profile management
- Implementing email notifications
- Adding writing section evaluation (manual or AI-assisted)
- Creating mobile apps (React Native)
- Adding more test types and question formats
- Implementing test scheduling and time windows
- Adding detailed analytics and reporting

---

## 📝 License

This project is created for educational purposes. Feel free to modify and use as needed.

---

## 🐛 Troubleshooting

### Port Already in Use

If you see "Port 5000 is already in use":

```bash
# Change PORT in server/.env
PORT=5001
```

### Module Not Found

If you encounter module errors:

```bash
# Reinstall dependencies
npm run install-all
```

### CORS Issues

If you face CORS errors, ensure:

- Backend is running on port 5000
- Frontend proxy is configured in `client/vite.config.js`

### Authentication Errors

If login fails:

- Check that JWT_SECRET is set in `server/.env`
- Verify username and password match demo credentials
- Check browser console for detailed error messages

---

## 📧 Support

For questions or issues, please check:

1. This README file
2. The `requirements.md` file
3. The `question-types.md` file for JSON structure guide
4. Code comments in source files

---

## 📚 Additional Documentation

### Database System (SQLite)

The platform uses **SQLite** for persistent data storage:

- **Location**: `server/ielts.db`
- **Tables**: users, submissions, active_tests
- **Package**: better-sqlite3

**Key Features**:

- ✅ Data persists across server restarts
- ✅ Foreign key constraints with cascade delete
- ✅ Automatic test activation management
- ✅ One active test per section

**View Database**: Use DB Browser for SQLite or VS Code SQLite extension

**Reset Database**: Delete `server/ielts.db` and restart server

### Test Activation System

- **One active test per section** (listening/reading/writing)
- All users automatically see activated tests
- No manual assignment needed
- Admin activates via Tests Database tab

### System Architecture Flow

```
Test Database → Admin Activates → All Users See It → User Takes Test → Submission Saved
```

### Common Issues & Quick Fixes

**Tests Not Showing**:

1. Check test file is in `test-database/{section}/{book}/test{number}.json`
2. Verify JSON is valid with a JSON validator
3. Check test is activated in admin dashboard
4. Restart server if needed

**Login Issues**:

- Default admin: `admin` / `admin123`
- Default student: `student1` / `password123`
- Check JWT_SECRET is set in `server/.env`

**Port Conflicts**:

- Backend: Change PORT in `server/.env`
- Frontend: Change port in `client/vite.config.js`

**Data Persistence**:

- All submissions/users stored in SQLite (`server/ielts.db`)
- Backup `server/ielts.db` regularly
- Database survives restarts (unlike old in-memory system)

**Server Not Loading Tests**:

```bash
# Verify test structure
ls test-database/listening/cambridge6/test1.json

# Check server logs
npm run server
# Look for "Tests loaded successfully" message
```

### API Quick Reference

**Admin Endpoints**:

- `GET /api/tests/all` - Get all tests organized by section
- `PATCH /api/tests/:testId/activate` - Activate/deactivate test
- `GET /api/submissions/all` - View all submissions
- `GET /api/submissions/:id` - View detailed submission with answers
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

**User Endpoints**:

- `GET /api/tests/assigned` - Get activated tests (all users see same tests)
- `GET /api/tests/:testId` - Get test data without answers
- `POST /api/submissions` - Submit test answers

### Test Management Workflow

1. **Add New Test**: Place JSON file in `test-database/{section}/{book}/test{number}.json`
2. **Activate Test**: Admin Dashboard → Tests Database → Select section → Click "Activate"
3. **Users See It**: All users automatically see activated test
4. **Monitor Results**: Admin Dashboard → Statistics tab → View submissions

### Submission Review

Admin can view detailed submissions showing:

- ✅ **Green** = Correct answer
- ❌ **Red** = Incorrect (shows user's answer + correct answer)
- Score, band score, time spent
- Full question-by-question breakdown

For complete question type documentation and JSON structure, see **`question-types.md`**.

For original project requirements, see **`requirements.md`**.

---

**Built with ❤️ using React, TailwindCSS, and Express.js**
