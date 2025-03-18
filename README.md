
# AttenTrack - Attendance Tracking System

## Project Setup Guide

### Prerequisites
- Node.js (v16 or higher)
- npm (v7 or higher)
- MySQL Server (v8.0 or higher) - **REQUIRED for full functionality**

### Setup Instructions (Step by Step)

#### 1. Database Configuration

1. **Install MySQL Server**
   - Download and install MySQL Server from the [official MySQL website](https://dev.mysql.com/downloads/mysql/).
   - Follow the installation instructions for your operating system.
   - Make sure to note your MySQL username and password during installation.

2. **Start MySQL Server**
   - Windows: Open Services, find MySQL and ensure it's running
   - macOS: Run `mysql.server start` in Terminal
   - Linux: Run `sudo systemctl start mysql` or `sudo service mysql start`

3. **Create Database and Tables**
   - Open MySQL command line or a MySQL client like MySQL Workbench
   - Run the following SQL commands:

   ```sql
   -- Create Database
   CREATE DATABASE IF NOT EXISTS attentrack;
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

#### 2. Application Configuration

1. **Configure Environment Variables**
   - Create or edit the `.env` file in the root of the project:

   ```
   VITE_DB_HOST=localhost
   VITE_DB_USER=your_mysql_username
   VITE_DB_PASSWORD=your_mysql_password
   VITE_DB_DATABASE=attentrack
   ```

   - Replace `your_mysql_username` and `your_mysql_password` with your actual MySQL credentials.

2. **Install Dependencies**
   - Open a terminal in the project directory
   - Run:
   ```bash
   npm install
   ```

#### 3. Running in Node.js Environment

**IMPORTANT**: The application MUST be run in a Node.js environment for database functionality to work.

1. **Start Development Server**
   ```bash
   npm run dev
   ```
   This will start the application on http://localhost:5173 (or other port as configured)

2. **Verify Database Connection**
   - After starting the application, check the database status indicator in the top-right corner.
   - A green "MySQL Connected" badge indicates successful connection.
   - A red "MySQL Disconnected" badge indicates connection failure.

#### 4. Building for Production

1. **Build the Application**
   ```bash
   npm run build
   ```

2. **Serve the Built Files**
   ```bash
   npm run preview
   ```

### Troubleshooting Database Connection

If you see "MySQL Disconnected" status or database errors:

1. **Verify MySQL Server is Running**
   - Windows: Check Services app
   - macOS: Run `mysql.server status` in Terminal
   - Linux: Run `sudo systemctl status mysql` or `sudo service mysql status`

2. **Check Database Credentials**
   - Ensure your `.env` file has correct values for:
     - `VITE_DB_HOST` (usually "localhost")
     - `VITE_DB_USER` (your MySQL username)
     - `VITE_DB_PASSWORD` (your MySQL password)
     - `VITE_DB_DATABASE` (should be "attentrack")

3. **Test Direct MySQL Connection**
   - Run: `mysql -u your_mysql_username -p` and enter your password
   - If this fails, the issue is with your MySQL installation or credentials

4. **Check Database Existence**
   - After connecting to MySQL, run: `SHOW DATABASES;`
   - Ensure "attentrack" is listed

5. **Examine Console Logs**
   - Open browser developer tools (F12) and check the console for specific error messages

### Common Errors and Solutions

1. **"Access denied for user..."**
   - Solution: Check your MySQL username and password in `.env` file

2. **"ER_BAD_DB_ERROR: Unknown database 'attentrack'"**
   - Solution: Run the database creation script from Step 1.3

3. **"ECONNREFUSED"**
   - Solution: Make sure MySQL server is running

4. **Browser Mode (No DB)**
   - This message appears when running the app directly in a browser without Node.js
   - Solution: Always use `npm run dev` to start the application properly
