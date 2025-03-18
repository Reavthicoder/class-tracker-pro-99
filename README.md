
# AttenTrack - Attendance Tracking System

## Important Note: Data Storage

This application is designed to store all data in a MySQL database when run properly in a Node.js environment. 

**When run directly in the browser (e.g., via GitHub Pages or other static hosting), the app will fall back to localStorage for data storage. This is NOT recommended for production use.**

For proper data storage in MySQL, follow the setup instructions below carefully.

## Project Setup Guide

### Prerequisites
- Node.js (v16 or higher)
- npm (v7 or higher)
- MySQL Server (v8.0 or higher) - **REQUIRED for proper data storage**

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
   - The application will automatically create the necessary tables when it first connects.
   - However, you need to create the database first:
   
   ```sql
   -- Create Database
   CREATE DATABASE IF NOT EXISTS attentrack;
   ```

   - The following tables will be created automatically when the app connects:
     - `students` - Stores student information
     - `attendance_records` - Stores attendance session records
     - `student_attendance` - Junction table for student attendance status

#### 2. Application Configuration

1. **Configure Environment Variables**
   - Create a `.env` file in the root of the project with the following content:

   ```
   VITE_DB_HOST=localhost
   VITE_DB_USER=your_mysql_username
   VITE_DB_PASSWORD=your_mysql_password
   VITE_DB_DATABASE=attentrack
   ```

   - Replace `your_mysql_username` and `your_mysql_password` with your actual MySQL credentials.
   - The database name should be `attentrack` (or match whatever you created in step 1.3)

2. **Install Dependencies**
   - Open a terminal in the project directory
   - Run:
   ```bash
   npm install
   ```

#### 3. Running in Node.js Environment (REQUIRED for MySQL Storage)

**IMPORTANT**: The application MUST be run in a Node.js environment for MySQL database functionality to work.

1. **Start Development Server**
   ```bash
   npm run dev
   ```
   This will start the application on http://localhost:5173 (or other port as configured)

2. **Verify Database Connection**
   - After starting the application, check the database status indicator in the top-right corner.
   - A green "MySQL Connected" badge indicates successful connection.
   - A red "MySQL Disconnected" badge indicates connection failure.

#### 4. Initial Data

The application will automatically add the following students to the database when it first connects:
- Sahsara (Roll Number: S001)
- Karthikeya (Roll Number: K001)
- Ayushi (Roll Number: A001)
- Meghana Madasu (Roll Number: M001)
- Sanjana (Roll Number: S002)

#### 5. Building for Production

1. **Build the Application**
   ```bash
   npm run build
   ```

2. **Serve the Built Files with Node.js**
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

5. **Check Connection in Application Console**
   - Open browser developer tools (F12) and check the console for specific error messages
   - If you see "Running in browser environment" messages, you are not running the app with Node.js

### Common Errors and Solutions

1. **"Access denied for user..."**
   - Solution: Check your MySQL username and password in `.env` file

2. **"ER_BAD_DB_ERROR: Unknown database 'attentrack'"**
   - Solution: Make sure you've created the database with `CREATE DATABASE attentrack;`

3. **"ECONNREFUSED"**
   - Solution: Make sure MySQL server is running

4. **Browser Mode (No DB)**
   - This message appears when running the app directly in a browser without Node.js
   - Solution: Always use `npm run dev` to start the application properly
   - Remember that data will only be stored in MySQL when run with Node.js
