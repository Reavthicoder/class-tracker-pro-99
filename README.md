
# AttenTrack - Attendance Tracking System

## IMPORTANT: MySQL Database Required

This application requires a MySQL database for data storage. The application MUST be run in a Node.js environment using `npm run dev` command.

**DATA WILL NOT BE STORED in MySQL if the application is accessed directly through a browser without running it through Node.js.**

## Quick Start Guide

```bash
# Install dependencies
npm install

# Start MySQL server (if not already running)
# macOS:
mysql.server start
# Linux:
sudo systemctl start mysql
# Windows:
# Use the Services application to start MySQL

# Verify MySQL is running and accepting connections:
mysql -u root -p
# Enter your password: Karthikeya#2005
# If successful, you'll see the MySQL prompt
mysql> exit;

# Create database (first time only)
mysql -u root -p
# Enter your password: Karthikeya#2005
CREATE DATABASE attentrack;
exit;

# Start the application
npm run dev
```

## Complete Project Setup Guide (Step by Step)

### 1. Install Dependencies

```bash
# Install all required npm packages
npm install

# If mysql2 is not installed
npm install mysql2
```

### 2. MySQL Database Setup

1. **Install MySQL Server** (if not already installed)
   - Windows: Download from [MySQL website](https://dev.mysql.com/downloads/mysql/)
   - macOS: Use `brew install mysql`
   - Linux: `sudo apt install mysql-server`

2. **Start MySQL Server**
   - Windows: Open Services, find MySQL and start it
   - macOS: Run `mysql.server start`
   - Linux: Run `sudo systemctl start mysql`
   
   **IMPORTANT**: Make sure MySQL is actually running before proceeding!

3. **Check MySQL Status**
   ```bash
   # macOS and Linux
   mysqladmin -u root -p status
   
   # Windows (in MySQL Command Line Client)
   \s
   ```

4. **Test Connection**
   ```bash
   # Try connecting to MySQL directly to verify credentials
   mysql -u root -p
   # Enter password: Karthikeya#2005
   
   # If this fails, your username or password might be incorrect
   ```

5. **Create Database**
   ```bash
   # Login to MySQL
   mysql -u root -p
   # Enter password: Karthikeya#2005
   
   # Create database
   CREATE DATABASE attentrack;
   
   # Verify database was created
   SHOW DATABASES;
   
   # You should see 'attentrack' in the list
   
   # Exit MySQL
   exit;
   ```

### 3. Configure Environment Variables

Make sure the `.env` file in the project root has these exact values:

```
VITE_DB_HOST=localhost
VITE_DB_USER=root
VITE_DB_PASSWORD=Karthikeya#2005
VITE_DB_DATABASE=attentrack
```

### 4. Running the Application

```bash
# Start the development server
npm run dev
```

The application will be available at http://localhost:8080 or the port shown in your terminal.

### 5. Verify Database Connection

When the application starts, it will:
1. Attempt to connect to the MySQL database
2. Create the necessary tables if they don't exist
3. Add initial student records if needed

Look for "Connected to MySQL database successfully" in the console and toast notifications.

## Troubleshooting

### Database Connection Issues

If you see "MySQL Disconnected" status or "Connecting to MySQL database..." appears for a long time:

1. **Verify MySQL is running**
   ```bash
   # Check MySQL status
   # Linux
   sudo systemctl status mysql
   
   # macOS
   mysql.server status
   
   # Windows
   # Check Services application
   
   # Start if not running
   # Linux
   sudo systemctl start mysql
   
   # macOS
   mysql.server start
   
   # Windows
   # Start in Services application
   ```

2. **Check MySQL user permissions**
   ```bash
   # Connect to MySQL
   mysql -u root -p
   # Enter your password
   
   # Make sure the root user has all privileges
   GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' WITH GRANT OPTION;
   GRANT ALL PRIVILEGES ON attentrack.* TO 'root'@'localhost' WITH GRANT OPTION;
   FLUSH PRIVILEGES;
   
   # Check if the user exists and has correct privileges
   SELECT user, host FROM mysql.user WHERE user = 'root';
   SHOW GRANTS FOR 'root'@'localhost';
   exit;
   ```

3. **Verify database exists and is accessible**
   ```bash
   mysql -u root -p
   # Enter your password
   
   # Check if database exists
   SHOW DATABASES;
   
   # Create it if it doesn't
   CREATE DATABASE IF NOT EXISTS attentrack;
   
   # Try to use it
   USE attentrack;
   
   # If successful, exit
   exit;
   ```

4. **Remove any firewall or security restrictions**
   - Ensure your firewall isn't blocking connections to MySQL (port 3306)
   - Try setting the host to '127.0.0.1' instead of 'localhost' in your .env file

5. **Reset MySQL password (if necessary)**
   If you suspect the password might be incorrect, you can reset it:
   ```bash
   # On Linux
   sudo mysqladmin -u root password "Karthikeya#2005"
   
   # On macOS
   mysqladmin -u root password "Karthikeya#2005"
   
   # Or change it from within MySQL
   mysql -u root -p
   # Enter current password
   ALTER USER 'root'@'localhost' IDENTIFIED BY 'Karthikeya#2005';
   FLUSH PRIVILEGES;
   exit;
   ```

6. **Manually create tables** (if automatic creation fails)
   ```bash
   mysql -u root -p
   # Enter your password
   USE attentrack;
   
   # Create tables manually using the SQL from constants.ts
   CREATE TABLE IF NOT EXISTS students (
     id INT PRIMARY KEY AUTO_INCREMENT,
     name VARCHAR(255) NOT NULL,
     rollNumber VARCHAR(50) NOT NULL UNIQUE
   );

   CREATE TABLE IF NOT EXISTS attendance_records (
     id VARCHAR(100) PRIMARY KEY,
     date DATE NOT NULL,
     classTitle VARCHAR(255) NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   CREATE TABLE IF NOT EXISTS student_attendance (
     id INT PRIMARY KEY AUTO_INCREMENT,
     attendance_id VARCHAR(100) NOT NULL,
     student_id INT NOT NULL,
     status ENUM('present', 'absent', 'late') NOT NULL,
     FOREIGN KEY (attendance_id) REFERENCES attendance_records(id) ON DELETE CASCADE,
     FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
   );
   
   # Exit MySQL
   exit;
   ```

### Common Error Messages

- **"Access denied for user..."**: Update your credentials in the `.env` file or check user permissions with the steps above
- **"Unknown database 'attentrack'"**: Create the database using the commands above
- **"ECONNREFUSED"**: Make sure MySQL server is running
- **Connection timeout**: Check firewall settings or try changing the host to '127.0.0.1' instead of 'localhost'
- **"ER_NOT_SUPPORTED_AUTH_MODE"**: Run `ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'Karthikeya#2005';` in MySQL

## Data Storage

When run properly with Node.js and MySQL:
- All student data is stored in the `students` table
- All attendance records are stored in the `attendance_records` and `student_attendance` tables
- LocalStorage is ONLY used as a fallback if database connection fails
