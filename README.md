
# AttenTrack - Attendance Tracking System

## IMPORTANT: MySQL Database Required

This application requires a MySQL database for data storage. The application MUST be run in a Node.js environment using `npm run dev` command.

**DATA WILL NOT BE STORED if the application is accessed directly through a browser without running it through Node.js.**

## Project Setup Guide (Step by Step)

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

3. **Create Database and User**
   ```bash
   # Login to MySQL
   mysql -u root -p
   
   # Create database
   CREATE DATABASE attentrack;
   
   # Exit MySQL
   exit;
   ```

### 3. Configure Environment Variables

Create a `.env` file in the project root with:

```
VITE_DB_HOST=localhost
VITE_DB_USER=root
VITE_DB_PASSWORD=your_mysql_password
VITE_DB_DATABASE=attentrack
```

Replace `your_mysql_password` with your actual MySQL password.

### 4. Running the Application

```bash
# Start the development server
npm run dev
```

The application will be available at http://localhost:8080

### 5. Verify Database Connection

When the application starts, it will:
1. Attempt to connect to the MySQL database
2. Create the necessary tables if they don't exist
3. Add initial student records if needed

Look for "Connected to MySQL database successfully" in the console and toast notifications.

## Troubleshooting

### Database Connection Issues

If you see "MySQL Disconnected" status:

1. **Verify MySQL is running**
   ```bash
   # Check MySQL status
   # Linux
   sudo systemctl status mysql
   
   # macOS
   mysql.server status
   
   # Start if not running
   # Linux
   sudo systemctl start mysql
   
   # macOS
   mysql.server start
   ```

2. **Check your credentials**
   - Ensure the values in your `.env` file match your MySQL settings
   - Try connecting manually: `mysql -u root -p` with your password

3. **Database doesn't exist**
   ```bash
   mysql -u root -p
   CREATE DATABASE attentrack;
   exit;
   ```

4. **Reset tables** (if data is corrupted)
   ```bash
   mysql -u root -p
   USE attentrack;
   DROP TABLE IF EXISTS student_attendance;
   DROP TABLE IF EXISTS attendance_records;
   DROP TABLE IF EXISTS students;
   exit;
   ```
   Then restart the application to recreate the tables.

### Common Error Messages

- **"Access denied for user..."**: Update your credentials in the `.env` file
- **"Unknown database 'attentrack'"**: Create the database using the commands above
- **"ECONNREFUSED"**: Make sure MySQL server is running

## Data Storage

When run properly with Node.js and MySQL:
- All student data is stored in the `students` table
- All attendance records are stored in the `attendance_records` and `student_attendance` tables
- LocalStorage is ONLY used as a fallback if database connection fails

