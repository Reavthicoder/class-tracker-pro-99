import { Student, AttendanceRecord } from './attendance-service';
import { DB_CONFIG } from './constants';
import { toast } from 'sonner';

// Database connection configuration
const dbConfig = {
  host: DB_CONFIG.host,
  user: DB_CONFIG.user,
  password: DB_CONFIG.password,
  database: DB_CONFIG.database,
  connectionLimit: DB_CONFIG.connectionLimit,
  waitForConnections: DB_CONFIG.waitForConnections,
  queueLimit: DB_CONFIG.queueLimit,
  connectTimeout: DB_CONFIG.connectTimeout,
  acquireTimeout: DB_CONFIG.acquireTimeout
};

// Create a connection pool
let pool: any = null;
let isInitialized = false;

/**
 * Initialize the database connection pool
 */
export const initializeDatabase = async () => {
  // If already initialized, exit early
  if (isInitialized) return true;
  
  // Check if we're in a browser environment
  if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
    console.log('Browser environment detected, cannot connect to MySQL');
    return false;
  }
  
  try {
    console.log('Initializing MySQL database connection...');
    console.log('Using configuration:', JSON.stringify({
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
      connectTimeout: dbConfig.connectTimeout
    }));
    
    // Only import mysql2 in a node environment
    try {
      const mysql = await import('mysql2/promise');
      
      // Test database exists first
      try {
        const tempPool = mysql.createPool({
          ...dbConfig,
          connectTimeout: 20000, // Longer timeout for initial test
          multipleStatements: true
        });
        
        // Try connection
        console.log('Testing MySQL database connection...');
        const conn = await tempPool.getConnection();
        console.log('Initial MySQL connection test successful');
        conn.release();
        
        // If we reached here, connection works, so set the main pool
        pool = tempPool;
      } catch (error: any) {
        console.error('Initial MySQL connection test failed:', error.message);
        
        // If database doesn't exist, try to create it
        if (error.message.includes('Unknown database') || error.code === 'ER_BAD_DB_ERROR') {
          console.log('MySQL database does not exist, attempting to create it...');
          
          // Create a pool without specifying the database to create it
          const rootPool = mysql.createPool({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password,
            connectionLimit: 1,
            multipleStatements: true
          });
          
          try {
            const conn = await rootPool.getConnection();
            await conn.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database};`);
            console.log(`MySQL database '${dbConfig.database}' created successfully`);
            conn.release();
            await rootPool.end();
            
            // Now create the main pool with the database specified
            pool = mysql.createPool(dbConfig);
          } catch (createError) {
            console.error('Failed to create MySQL database:', createError);
            throw new Error('Failed to create MySQL database. Please ensure MySQL server is running and credentials are correct.');
          }
        } else if (error.message.includes('Access denied')) {
          console.error('MySQL access denied. Username or password might be incorrect.');
          throw new Error(`MySQL access denied for user '${dbConfig.user}'. Please check your username and password.`);
        } else if (error.message.includes('ECONNREFUSED')) {
          console.error('MySQL connection refused. Server might not be running.');
          throw new Error(`MySQL connection refused at ${dbConfig.host}. Please ensure MySQL server is running.`);
        } else {
          // Other connection error
          throw error;
        }
      }
      
      // Initialize tables if they don't exist
      await createTables();
      
      isInitialized = true;
      console.log('MySQL database initialization complete.');
      return true;
    } catch (importError) {
      console.error('Failed to import mysql2 module:', importError);
      throw new Error('Failed to import mysql2 module. This might be because the application is running in a browser environment without Node.js.');
    }
  } catch (error) {
    console.error('MySQL database connection failed:', error);
    throw error;
  }
};

/**
 * Create necessary tables if they don't exist
 */
const createTables = async () => {
  if (!pool) throw new Error('MySQL database not initialized');
  
  try {
    // Create students table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS students (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        rollNumber VARCHAR(50) NOT NULL UNIQUE
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
    `);
    
    // Create attendance_records table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS attendance_records (
        id VARCHAR(100) PRIMARY KEY,
        date DATE NOT NULL,
        classTitle VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
    `);
    
    // Create student_attendance junction table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS student_attendance (
        id INT PRIMARY KEY AUTO_INCREMENT,
        attendance_id VARCHAR(100) NOT NULL,
        student_id INT NOT NULL,
        status ENUM('present', 'absent', 'late') NOT NULL,
        FOREIGN KEY (attendance_id) REFERENCES attendance_records(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
    `);
    
    console.log('MySQL database tables created successfully');
    
    // Check if we need to add initial students
    const [students] = await pool.execute('SELECT * FROM students');
    if (Array.isArray(students) && students.length === 0) {
      // Add initial students if table is empty
      await addInitialStudents();
    }
  } catch (error) {
    console.error('Error creating MySQL tables:', error);
    throw error;
  }
};

/**
 * Add initial students to the database
 */
const addInitialStudents = async () => {
  if (!pool) return;
  
  const initialStudents = [
    { name: 'Sahsara', rollNumber: 'S001' },
    { name: 'Karthikeya', rollNumber: 'K001' },
    { name: 'Ayushi', rollNumber: 'A001' },
    { name: 'Meghana Madasu', rollNumber: 'M001' },
    { name: 'Sanjana', rollNumber: 'S002' }
  ];
  
  try {
    for (const student of initialStudents) {
      await pool.execute(
        'INSERT INTO students (name, rollNumber) VALUES (?, ?)',
        [student.name, student.rollNumber]
      );
    }
    console.log('Initial students added successfully to MySQL database');
  } catch (error) {
    console.error('Error adding initial students to MySQL:', error);
  }
};

/**
 * Get a database connection from the pool
 */
const getConnection = async () => {
  if (!pool) {
    await initializeDatabase();
  }
  if (!pool) throw new Error('Failed to initialize MySQL database');
  return pool.getConnection();
};

// STUDENT OPERATIONS

/**
 * Get all students from the database
 */
export const getStudents = async (): Promise<Student[]> => {
  // Always initialize database first
  await initializeDatabase();
  
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute('SELECT * FROM students ORDER BY name');
    conn.release();
    return rows as Student[];
  } catch (error) {
    console.error('Error fetching students from MySQL:', error);
    toast.error('Failed to fetch students from MySQL database.');
    throw new Error('Failed to fetch students from MySQL database');
  }
};

/**
 * Add a new student to the database
 */
export const addStudent = async (student: Omit<Student, 'id'>): Promise<Student> => {
  await initializeDatabase();
  
  try {
    const conn = await getConnection();
    const [result] = await conn.execute(
      'INSERT INTO students (name, rollNumber) VALUES (?, ?)',
      [student.name, student.rollNumber]
    );
    conn.release();
    
    const insertId = (result as any).insertId;
    return { ...student, id: insertId };
  } catch (error) {
    console.error('Error adding student to MySQL:', error);
    toast.error('Failed to add student to MySQL database.');
    throw new Error('Failed to add student to MySQL database');
  }
};

/**
 * Update an existing student
 */
export const updateStudent = async (student: Student): Promise<Student> => {
  await initializeDatabase();
  
  try {
    const conn = await getConnection();
    await conn.execute(
      'UPDATE students SET name = ?, rollNumber = ? WHERE id = ?',
      [student.name, student.rollNumber, student.id]
    );
    conn.release();
    return student;
  } catch (error) {
    console.error('Error updating student in MySQL:', error);
    toast.error('Failed to update student in MySQL database.');
    throw new Error('Failed to update student in MySQL database');
  }
};

/**
 * Delete a student by ID
 */
export const deleteStudent = async (id: number): Promise<boolean> => {
  await initializeDatabase();
  
  try {
    const conn = await getConnection();
    await conn.execute('DELETE FROM students WHERE id = ?', [id]);
    conn.release();
    return true;
  } catch (error) {
    console.error('Error deleting student from MySQL:', error);
    toast.error('Failed to delete student from MySQL database.');
    throw new Error('Failed to delete student from MySQL database');
  }
};

// ATTENDANCE OPERATIONS

/**
 * Save an attendance record
 */
export const saveAttendanceRecord = async (record: AttendanceRecord): Promise<AttendanceRecord> => {
  await initializeDatabase();
  
  try {
    const conn = await getConnection();
    
    // Start transaction
    await conn.beginTransaction();
    
    // Insert attendance record
    await conn.execute(
      'INSERT INTO attendance_records (id, date, classTitle) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE date = ?, classTitle = ?',
      [record.id, record.date, record.classTitle, record.date, record.classTitle]
    );
    
    // Delete existing student attendance entries for this record (for updates)
    await conn.execute('DELETE FROM student_attendance WHERE attendance_id = ?', [record.id]);
    
    // Insert new student attendance entries
    for (const studentAttendance of record.students) {
      await conn.execute(
        'INSERT INTO student_attendance (attendance_id, student_id, status) VALUES (?, ?, ?)',
        [record.id, studentAttendance.studentId, studentAttendance.status]
      );
    }
    
    // Commit transaction
    await conn.commit();
    conn.release();
    return record;
  } catch (error) {
    console.error('Error saving attendance record to MySQL:', error);
    toast.error('Failed to save attendance record to MySQL database.');
    throw new Error('Failed to save attendance record to MySQL database');
  }
};

/**
 * Get all attendance records
 */
export const getAttendanceRecords = async (): Promise<AttendanceRecord[]> => {
  await initializeDatabase();
  
  try {
    const conn = await getConnection();
    
    // Get all attendance records
    const [records] = await conn.execute(`
      SELECT * FROM attendance_records 
      ORDER BY date DESC
    `);
    
    // For each record, get the student attendance
    const attendanceRecords = await Promise.all(
      (records as any[]).map(async (record) => {
        const [studentAttendances] = await conn.execute(`
          SELECT sa.student_id as studentId, sa.status 
          FROM student_attendance sa
          WHERE sa.attendance_id = ?
        `, [record.id]);
        
        return {
          id: record.id,
          date: record.date.toISOString().split('T')[0], // Format date as YYYY-MM-DD
          classTitle: record.classTitle,
          students: studentAttendances as { studentId: number; status: 'present' | 'absent' | 'late' }[]
        };
      })
    );
    
    conn.release();
    return attendanceRecords;
  } catch (error) {
    console.error('Error fetching attendance records from MySQL:', error);
    toast.error('Failed to fetch attendance records from MySQL database.');
    throw new Error('Failed to fetch attendance records from MySQL database');
  }
};

/**
 * Delete an attendance record
 */
export const deleteAttendanceRecord = async (id: string): Promise<boolean> => {
  await initializeDatabase();
  
  try {
    const conn = await getConnection();
    await conn.execute('DELETE FROM attendance_records WHERE id = ?', [id]);
    conn.release();
    return true;
  } catch (error) {
    console.error('Error deleting attendance record from MySQL:', error);
    toast.error('Failed to delete attendance record from MySQL database.');
    throw new Error('Failed to delete attendance record from MySQL database');
  }
};

