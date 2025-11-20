# Test Database

This folder contains all IELTS test files organized by section and book.

## Structure

```
test-database/
├── listening/
│   ├── cambridge6/
│   │   ├── test1.json
│   │   ├── test2.json
│   │   └── ...
│   ├── cambridge7/
│   │   └── test1.json
│   └── ...
├── reading/
│   ├── cambridge6/
│   │   └── test1.json
│   └── ...
└── writing/
    ├── cambridge6/
    │   └── test1.json
    └── ...
```

## How to Add Tests

### 1. Create a Test JSON File

Each test file should follow this structure:

```json
{
  "id": "cambridge6-listening-test1",
  "book": "cambridge6",
  "section": "listening",
  "title": "IELTS Book 6 Listening Test 1",
  "activated": false,
  "duration": 1800,
  "audio": "https://...",
  "total_questions": 40,
  "answers": {
    "1": "answer1",
    "2": "answer2"
  },
  "parts": [
    {
      "part": 1,
      "title": "Part 1 Title",
      "questions": [...]
    }
  ]
}
```

### 2. File Organization

**Path Structure**: `{section}/{book}/test{number}.json`

Examples:
- `listening/cambridge6/test1.json`
- `listening/cambridge6/test2.json`
- `reading/cambridge7/test1.json`
- `writing/ielts-trainer/test1.json`

### 3. Important Fields

- `id`: Unique identifier (e.g., "cambridge6-listening-test1")
- `section`: Must be "listening", "reading", or "writing"
- `activated`: Set to `false` by default. Admin activates via dashboard
- `book`: Book/source name (e.g., "cambridge6", "cambridge7")

## Test Activation

### How It Works

1. **Admin Dashboard**: Navigate to "Tests Database" tab
2. **Select Section**: Choose Listening, Reading, or Writing
3. **Activate Test**: Click "Activate for Exam" button
4. **Only ONE active**: Activating deactivates others in same section
5. **User Assignment**: Users automatically get active tests

### Rules

- ✅ Only **ONE active test** per section at a time
- ✅ Users are assigned the currently active test from each section
- ✅ Admins can switch active tests anytime via dashboard

## Current Tests

### Listening
- **Cambridge 6 - Test 1** (`listening/cambridge6/test1.json`)

### Reading
- (No tests added yet)

### Writing
- (No tests added yet)

## Adding New Books

To add tests from a new book:

1. Create folder: `test-database/{section}/{book-name}/`
2. Add test files: `test1.json`, `test2.json`, etc.
3. Tests appear automatically in Admin Dashboard

Example:
```bash
mkdir test-database/listening/cambridge7
# Add test files inside
```

## Notes

- ✅ Server recursively scans all subdirectories
- ✅ All `.json` files loaded automatically
- ✅ No server restart needed
- ⚠️ Ensure JSON files are valid
- ⚠️ `id` field must be unique across ALL tests
