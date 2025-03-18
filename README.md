
# AttenTrack - Attendance Tracking System

## Project Setup Guide

### Prerequisites
- Node.js (v16 or higher)
- npm (v7 or higher)
- MySQL Server (v8.0 or higher)

### Database Setup

1. **Create MySQL Database**
   
   Log in to MySQL and run the following commands:

   ```sql
   CREATE DATABASE attentrack;
   USE attentrack;
   
   -- Create students table
   CREATE TABLE IF NOT EXISTS students (
     id INT PRIMARY KEY AUTO_INCREMENT,
     name VARCHAR(255) NOT NULL,
     rollNumber VARCHAR(50) NOT NULL UNIQUE
   );
   
   -- Create attendance_records table
   CREATE TABLE IF NOT EXISTS attendance_records (
     id VARCHAR(100) PRIMARY KEY,
     date DATE NOT NULL,
     classTitle VARCHAR(255) NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   
   -- Create student_attendance junction table
   CREATE TABLE IF NOT EXISTS student_attendance (
     id INT PRIMARY KEY AUTO_INCREMENT,
     attendance_id VARCHAR(100) NOT NULL,
     student_id INT NOT NULL,
     status ENUM('present', 'absent', 'late') NOT NULL,
     FOREIGN KEY (attendance_id) REFERENCES attendance_records(id) ON DELETE CASCADE,
     FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
   );
   ```

2. **Configure Database Connection**

   Create a `.env` file in the root of the project with the following content:

   ```
   VITE_DB_HOST=localhost
   VITE_DB_USER=root
   VITE_DB_PASSWORD=Karthikeya#2005
   VITE_DB_DATABASE=attentrack
   ```

   Note: Replace the values with your actual MySQL credentials if different.

### Application Setup

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Start Development Server**

   ```bash
   npm run dev
   ```

   This will start the application on http://localhost:8080

### Running in Production

To run the application in production mode:

1. **Build the Application**

   ```bash
   npm run build
   ```

2. **Serve the Built Files**

   ```bash
   npm run preview
   ```

### Troubleshooting

- **Database Connection Issues:**
  - Ensure MySQL server is running
  - Verify your credentials in the `.env` file
  - Check that the database `attentrack` exists
  - The application will fall back to localStorage if database connection fails

- **Node.js Environment:**
  - For the database features to work correctly, the application must be run in a Node.js environment
  - When running in a browser, the app will automatically fall back to localStorage

### System Architecture

The application uses:
- **Frontend**: React, Tailwind CSS, shadcn/ui components
- **State Management**: React Query
- **Database**: MySQL (with localStorage fallback)
- **API Layer**: Direct database connection in Node.js environment

### Important Notes

- When running in a pure browser environment, the app uses localStorage
- For full functionality with MySQL, use the Node.js-based development server
