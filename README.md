
# AttenTrack - Attendance Tracking System

## Project Setup Guide

### Prerequisites
- Node.js (v16 or higher)
- npm (v7 or higher)
- MySQL Server (v8.0 or higher) - **REQUIRED for full functionality**

### Database Setup (Important!)

1. **Install MySQL Server**
   
   If you don't have MySQL Server installed, download and install it from the [official MySQL website](https://dev.mysql.com/downloads/mysql/).

2. **Start MySQL Server**
   
   Make sure your MySQL server is running before starting the application.

3. **Create MySQL Database**
   
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

4. **Configure Database Connection**

   The `.env` file in the root of the project should have the following content with your MySQL credentials:

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

2. **Start Development Server (Important: Use Node.js environment)**

   ```bash
   npm run dev
   ```

   This will start the application on http://localhost:5173

   **IMPORTANT**: For database functionality to work correctly, you must run the application from a Node.js environment, NOT by opening the HTML file directly in a browser.

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

### Troubleshooting Database Connection

- **Check MySQL Server Status**
  - Ensure MySQL server is running before starting the application
  - On Windows: Check Services app to see if MySQL service is running
  - On macOS: Run `mysql.server status` in terminal
  - On Linux: Run `sudo service mysql status` or `sudo systemctl status mysql` in terminal

- **Verify Database Credentials**
  - Double-check user, password and database name in `.env` file
  - Ensure the MySQL user has proper permissions to access the database

- **Test MySQL Connection Separately**
  - Run `mysql -u root -p` and enter your password to verify you can connect
  - Try `USE attentrack;` to ensure the database exists and is accessible

- **Check Network Settings**
  - If MySQL is on a different machine, ensure the host is correctly specified
  - Check firewall settings to ensure MySQL port (default 3306) is open

### System Architecture

The application uses:
- **Frontend**: React, Tailwind CSS, shadcn/ui components
- **State Management**: React Query
- **Database**: MySQL (primary storage)
- **API Layer**: Direct database connection in Node.js environment

### Important Notes

- The application REQUIRES a MySQL database connection for full functionality
- When running in a browser-only environment (without Node.js), most database features will not work
- For optimal experience, always run in a Node.js environment with MySQL properly configured
