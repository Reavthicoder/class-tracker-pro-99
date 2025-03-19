
# AttenTrack - Attendance Tracking System

## IMPORTANT: MySQL Database Required

This application requires a MySQL database for data storage. The application MUST be run in a Node.js environment using `npm run dev` command.

**DATA WILL NOT BE STORED if the application is accessed directly through a browser without running it through Node.js.**

## Project Setup Guide (Step by Step)

### Prerequisites
- Node.js (v16 or higher)
- npm (v7 or higher)
- MySQL Server (v8.0 or higher) - **ABSOLUTELY REQUIRED**

### 1. MySQL Database Setup

1. **Install MySQL Server**
   - Download and install MySQL Server from the [official MySQL website](https://dev.mysql.com/downloads/mysql/)
   - Follow the installation instructions for your operating system
   - During installation, set a root password and remember it

2. **Start MySQL Server**
   - Windows: Open Services, find MySQL and ensure it's running
   - macOS: Run `mysql.server start` in Terminal
   - Linux: Run `sudo systemctl start mysql` or `sudo service mysql start`

3. **Create Database**
   - Open MySQL command line:
     - Windows: Use MySQL Command Line Client from Start Menu
     - macOS/Linux: Run `mysql -u root -p` and enter your password
   - Create the database with this command:
   ```sql
   CREATE DATABASE attentrack;
   ```
   - Exit MySQL command line with `exit;`

### 2. Application Configuration

1. **Set Environment Variables**
   - Create a `.env` file in the root directory with these values:
   ```
   VITE_DB_HOST=localhost
   VITE_DB_USER=root
   VITE_DB_PASSWORD=your_mysql_password
   VITE_DB_DATABASE=attentrack
   ```
   - Replace `your_mysql_password` with your actual MySQL root password

2. **Install Dependencies**
   ```bash
   npm install
   ```

### 3. Running the Application (REQUIRED for MySQL Storage)

1. **Start Development Server**
   ```bash
   npm run dev
   ```
   This will start the application in development mode with MySQL integration

2. **Verify Database Connection**
   - Check for "MySQL Connected" badge in the top right corner
   - If it shows "MySQL Disconnected", see troubleshooting steps below

### 4. Initial Data

When first run properly, the application will automatically add these students to the database:
- Sahsara (Roll Number: S001)
- Karthikeya (Roll Number: K001)
- Ayushi (Roll Number: A001)
- Meghana Madasu (Roll Number: M001)
- Sanjana (Roll Number: S002)

### Troubleshooting Database Connection

If you see "MySQL Disconnected" status:

1. **Verify MySQL is Running**
   - Windows: Check Services
   - macOS: Run `mysql.server status`
   - Linux: Run `sudo systemctl status mysql`

2. **Check MySQL Credentials**
   - Verify your MySQL username and password in the `.env` file
   - Try connecting manually: `mysql -u root -p` with your password

3. **Check Database Exists**
   - Connect to MySQL and run: `SHOW DATABASES;`
   - Ensure `attentrack` is listed

4. **Check Port Availability**
   - Default MySQL port is 3306
   - Ensure no firewall is blocking this port

5. **Restart MySQL Service**
   - Windows: Restart in Services
   - macOS: Run `mysql.server restart`
   - Linux: Run `sudo systemctl restart mysql`

6. **Check Error Logs**
   - Open browser console (F12) for detailed error messages
   - MySQL logs are usually in /var/log/mysql/ on Linux/macOS

### Common Error Messages

1. **"Access denied for user..."**
   - Your MySQL username or password in `.env` is incorrect
   - Solution: Update VITE_DB_USER and VITE_DB_PASSWORD in `.env`

2. **"Unknown database 'attentrack'"**
   - The database doesn't exist
   - Solution: Connect to MySQL and run `CREATE DATABASE attentrack;`

3. **"ECONNREFUSED"**
   - MySQL server is not running or unreachable
   - Solution: Start MySQL server and ensure it's running on default port (3306)

Remember: This application is designed to work ONLY with a MySQL database in a Node.js environment!
