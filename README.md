# Smart-Habit
A Smart Productivity and Habit Tracker

[Demo Video](https://drive.google.com/file/d/1TD5hJAH-1I8v1xVXySO1W0ZAcAurx8Cl/view?usp=sharing)

[Project Screenshot](/images/Screenshot%202025-06-28%20080212.png)

A comprehensive habit tracking application with drag-and-drop functionality, calendar view, daily reminders, and category management.

## Table of Contents
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Development](#development)

## Features

### Core Functionality
 **Habit Management**
- Add, edit, and delete habits
- Mark habits as complete/incomplete
- Visual streak tracking (🔥)
- Daily progress statistics

 **Enhanced Features**
- **Drag-and-Drop Reordering** - Organize habits by priority
- **Calendar View** - Visualize monthly habit completion
- **Category System** - Color-coded categories with filtering
- **Daily Reminders** - Browser notification system
- **Dark/Light Mode** - Eye-friendly theme switching

 **Progress Tracking**
- Current streak counter
- Completion percentage
- Daily progress tracker
- Historical view in calendar

## Technologies Used

**Frontend:**
- HTML5, CSS3, JavaScript (ES6+)
- Font Awesome icons
- Flatpickr for time input

**Backend:**
- json-server (REST API mock)
- localStorage (for theme and reminders)

**Development Tools:**
- Visual Studio Code
- Git for version control

## Installation

### Prerequisites
- Node.js (v14+)
- npm (v6+)

### Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/smart-habit.git
   cd smart-habit
   ```

2. Install dependencies:
   ```bash
   npm install json-server
   ```

3. Start the backend server:
   ```bash
   npx json-server --watch db.json --port 3000
   ```

4. Launch the application:
   - Open `index.html` in your browser (use Live Server extension for best experience)
   - Or serve it using:
     ```bash
     python -m http.server 8000
     ```


## Usage

### Basic Operations
- **Add a Habit**: Fill the form and click "Add Habit"
- **Complete Habit**: Check the checkbox
- **Delete Habit**: Click the trash icon
- **Reorder Habits**: Drag and drop items

### Advanced Features
- **Switch Views**: Toggle between list and calendar views
- **Set Reminder**: Configure daily notification time
- **Filter Habits**: Use category and status filters
- **Toggle Theme**: Click the moon/sun icon

## API Endpoints

The application uses these RESTful endpoints:

| Method | Endpoint         | Description                     |
|--------|------------------|---------------------------------|
| GET    | /habits          | Get all habits                  |
| POST   | /habits          | Create a new habit              |
| PUT    | /habits/:id      | Update a habit                  |
| PATCH  | /habits/:id      | Partial update (e.g., order)    |
| DELETE | /habits/:id      | Delete a habit                  |

Example habit object:
```json
{
  "id": 1,
  "name": "Drink water",
  "completed": false,
  "streak": 3,
  "lastCompleted": "2023-05-20T08:00:00.000Z",
  "createdAt": "2023-05-15T10:00:00.000Z",
  "category": "health",
  "order": 0
}
```

## Development

### Project Structure
```
smart-habit/
├── index.html          # Main HTML file
├── css/
│   └── style.css       # All styles
├── src/
│   └── index.js        # Main JavaScript
├── db.json             # Database file
└── README.md           # This file
```

### Customizing
1. **Add New Categories**:
   - Update the category selectors in HTML
   - Add corresponding CSS classes

2. **Modify Styling**:
   - Edit the CSS variables in `:root` for theme colors
   - Adjust the calendar styling in `style.css`

3. **Extend Functionality**:
   - Add new fields to the habit object
   - Create additional filter options


> **Note**: For proper notification functionality, ensure your browser has permission to show notifications. The calendar view shows habits completed on each day of the month. Drag-and-drop reordering is persisted to the database.