
import mysql from 'mysql2/promise';
import { Student, AttendanceRecord } from './attendance-service';

// Check if we're running in a browser environment
const isBrowser = typeof window !== 'undefined';

// Database connection configuration - use environment variables if available
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'attentrack'
};

// Create a connection pool
let pool: mysql.Pool | null = null;
let isInitialized = false;

/**
 * Initialize the database connection pool
 */
export const initializeDatabase = async () => {
  // If already initialized or in browser, exit early
  if (isInitialized) return true;
  if (isBrowser) {
    console.log('Running in browser environment, using localStorage fallback');
    isInitialized = true;
    return true; // Return true for browser to allow the app to continue
  }
  
  try {
    pool = mysql.createPool(dbConfig);
    console.log('Database connection pool initialized');
    
    // Check connection
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    connection.release();
    
    // Initialize tables if they don't exist
    await createTables();
    
    isInitialized = true;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};

/**
 * Create necessary tables if they don't exist
 */
const createTables = async () => {
  if (isBrowser) return; // Skip in browser
  if (!pool) throw new Error('Database not initialized');
  
  try {
    // Create students table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS students (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        rollNumber VARCHAR(50) NOT NULL UNIQUE
      )
    `);
    
    // Create attendance_records table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS attendance_records (
        id VARCHAR(100) PRIMARY KEY,
        date DATE NOT NULL,
        classTitle VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
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
      )
    `);
    
    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
};

/**
 * Get a database connection from the pool
 */
const getConnection = async () => {
  if (isBrowser) throw new Error('Cannot get database connection in browser');
  
  if (!pool) {
    await initializeDatabase();
  }
  if (!pool) throw new Error('Failed to initialize database');
  return pool.getConnection();
};

// LocalStorage helpers for browser environment
const getLocalStorageItem = (key: string, defaultValue: any = []) => {
  if (!isBrowser) return defaultValue;
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : defaultValue;
};

const setLocalStorageItem = (key: string, value: any) => {
  if (!isBrowser) return;
  localStorage.setItem(key, JSON.stringify(value));
};

// STUDENT OPERATIONS

/**
 * Get all students from the database
 */
export const getStudents = async (): Promise<Student[]> => {
  // Always initialize database first
  await initializeDatabase();
  
  if (isBrowser) {
    // In browser, get from localStorage
    return getLocalStorageItem('attentrack-students', []);
  }
  
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute('SELECT * FROM students ORDER BY name');
    conn.release();
    return rows as Student[];
  } catch (error) {
    console.error('Error fetching students:', error);
    // Fallback to localStorage even in server environment if DB fails
    return getLocalStorageItem('attentrack-students', []);
  }
};

/**
 * Add a new student to the database
 */
export const addStudent = async (student: Omit<Student, 'id'>): Promise<Student> => {
  await initializeDatabase();
  
  if (isBrowser) {
    // In browser, save to localStorage
    const students = await getStudents();
    const newId = students.length > 0 ? Math.max(...students.map(s => s.id)) + 1 : 1;
    const newStudent = { ...student, id: newId };
    
    const updatedStudents = [...students, newStudent];
    setLocalStorageItem('attentrack-students', updatedStudents);
    
    return newStudent;
  }
  
  try {
    const conn = await getConnection();
    const [result] = await conn.execute(
      'INSERT INTO students (name, rollNumber) VALUES (?, ?)',
      [student.name, student.rollNumber]
    );
    conn.release();
    
    const insertId = (result as mysql.ResultSetHeader).insertId;
    return { ...student, id: insertId };
  } catch (error) {
    console.error('Error adding student:', error);
    
    // Fallback to localStorage
    const students = await getStudents();
    const newId = students.length > 0 ? Math.max(...students.map(s => s.id)) + 1 : 1;
    const newStudent = { ...student, id: newId };
    
    const updatedStudents = [...students, newStudent];
    setLocalStorageItem('attentrack-students', updatedStudents);
    
    return newStudent;
  }
};

/**
 * Update an existing student
 */
export const updateStudent = async (student: Student): Promise<Student> => {
  await initializeDatabase();
  
  if (isBrowser) {
    // In browser, update in localStorage
    const students = await getStudents();
    const updatedStudents = students.map(s => 
      s.id === student.id ? student : s
    );
    
    setLocalStorageItem('attentrack-students', updatedStudents);
    return student;
  }
  
  try {
    const conn = await getConnection();
    await conn.execute(
      'UPDATE students SET name = ?, rollNumber = ? WHERE id = ?',
      [student.name, student.rollNumber, student.id]
    );
    conn.release();
    return student;
  } catch (error) {
    console.error('Error updating student:', error);
    
    // Fallback to localStorage
    const students = await getStudents();
    const updatedStudents = students.map(s => 
      s.id === student.id ? student : s
    );
    
    setLocalStorageItem('attentrack-students', updatedStudents);
    return student;
  }
};

/**
 * Delete a student by ID
 */
export const deleteStudent = async (id: number): Promise<boolean> => {
  await initializeDatabase();
  
  if (isBrowser) {
    // In browser, delete from localStorage
    const students = await getStudents();
    const updatedStudents = students.filter(s => s.id !== id);
    
    setLocalStorageItem('attentrack-students', updatedStudents);
    return true;
  }
  
  try {
    const conn = await getConnection();
    await conn.execute('DELETE FROM students WHERE id = ?', [id]);
    conn.release();
    return true;
  } catch (error) {
    console.error('Error deleting student:', error);
    
    // Fallback to localStorage
    const students = await getStudents();
    const updatedStudents = students.filter(s => s.id !== id);
    
    setLocalStorageItem('attentrack-students', updatedStudents);
    return true;
  }
};

// ATTENDANCE OPERATIONS

/**
 * Save an attendance record
 */
export const saveAttendanceRecord = async (record: AttendanceRecord): Promise<AttendanceRecord> => {
  await initializeDatabase();
  
  if (isBrowser) {
    // In browser, save to localStorage
    const records = await getAttendanceRecords();
    const existingIndex = records.findIndex(r => r.id === record.id);
    
    let updatedRecords: AttendanceRecord[];
    
    if (existingIndex >= 0) {
      updatedRecords = [...records];
      updatedRecords[existingIndex] = record;
    } else {
      updatedRecords = [record, ...records];
    }
    
    updatedRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setLocalStorageItem('attentrack-attendance', updatedRecords);
    
    return record;
  }
  
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
    console.error('Error saving attendance record:', error);
    
    // If database fails, fall back to localStorage
    const records = await getAttendanceRecords();
    const existingIndex = records.findIndex(r => r.id === record.id);
    
    let updatedRecords: AttendanceRecord[];
    
    if (existingIndex >= 0) {
      updatedRecords = [...records];
      updatedRecords[existingIndex] = record;
    } else {
      updatedRecords = [record, ...records];
    }
    
    updatedRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setLocalStorageItem('attentrack-attendance', updatedRecords);
    
    return record;
  }
};

/**
 * Get all attendance records
 */
export const getAttendanceRecords = async (): Promise<AttendanceRecord[]> => {
  await initializeDatabase();
  
  if (isBrowser) {
    // In browser, get from localStorage
    return getLocalStorageItem('attentrack-attendance', []);
  }
  
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
    console.error('Error fetching attendance records:', error);
    // Fallback to localStorage
    return getLocalStorageItem('attentrack-attendance', []);
  }
};

/**
 * Delete an attendance record
 */
export const deleteAttendanceRecord = async (id: string): Promise<boolean> => {
  await initializeDatabase();
  
  if (isBrowser) {
    // In browser, delete from localStorage
    const records = await getAttendanceRecords();
    const updatedRecords = records.filter(r => r.id !== id);
    
    setLocalStorageItem('attentrack-attendance', updatedRecords);
    return true;
  }
  
  try {
    const conn = await getConnection();
    await conn.execute('DELETE FROM attendance_records WHERE id = ?', [id]);
    conn.release();
    return true;
  } catch (error) {
    console.error('Error deleting attendance record:', error);
    
    // Fallback to localStorage
    const records = await getAttendanceRecords();
    const updatedRecords = records.filter(r => r.id !== id);
    
    setLocalStorageItem('attentrack-attendance', updatedRecords);
    return true;
  }
};
