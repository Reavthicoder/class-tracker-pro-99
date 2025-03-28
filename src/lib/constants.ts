
/**
 * Database configuration constants
 */
export const DB_CONFIG = {
  host: import.meta.env.VITE_DB_HOST || 'localhost',
  user: import.meta.env.VITE_DB_USER || 'root',
  password: import.meta.env.VITE_DB_PASSWORD || 'Karthikeya#2005',
  database: import.meta.env.VITE_DB_DATABASE || 'attentrack',
  // Additional configuration options
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
  // Add connection timeout to prevent hanging
  connectTimeout: 60000, // Increased timeout for initial connection
  // Add a longer acquisition timeout
  acquireTimeout: 60000  // Increased timeout
};

/**
 * Application routes
 */
export const ROUTES = {
  HOME: '/',
  ATTENDANCE: '/attendance',
  REPORTS: '/reports',
  SCHEDULE: '/schedule',
  STUDENTS: '/students'
};

/**
 * Database tables SQL creation scripts
 * Added explicit CHARACTER SET and COLLATION for better compatibility
 */
export const SQL_SCRIPTS = {
  CREATE_TABLES: `
-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  rollNumber VARCHAR(50) NOT NULL UNIQUE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- Create attendance_records table
CREATE TABLE IF NOT EXISTS attendance_records (
  id VARCHAR(100) PRIMARY KEY,
  date DATE NOT NULL,
  classTitle VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- Create student_attendance junction table
CREATE TABLE IF NOT EXISTS student_attendance (
  id INT PRIMARY KEY AUTO_INCREMENT,
  attendance_id VARCHAR(100) NOT NULL,
  student_id INT NOT NULL,
  status ENUM('present', 'absent', 'late') NOT NULL,
  FOREIGN KEY (attendance_id) REFERENCES attendance_records(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;`
};

/**
 * Database connection status
 */
export const DB_CONNECTION_STATUS = {
  CHECKING: 'checking',
  BROWSER: 'browser',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected'
} as const;
