import { Student, AttendanceRecord } from './attendance-service';
import { DB_CONFIG, STORAGE_KEYS } from './constants';
import { toast } from 'sonner';

// Check if we're running in a browser environment
const isBrowser = typeof window !== 'undefined';

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
let forceLocalStorage = false;

/**
 * Initialize the database connection pool
 */
export const initializeDatabase = async () => {
  // If already initialized, exit early
  if (isInitialized) return !forceLocalStorage;
  
  // In browser environment, we can't use MySQL directly
  if (isBrowser) {
    console.log('Running in browser environment, using localStorage fallback');
    isInitialized = true;
    forceLocalStorage = true;
    return false;
  }
  
  try {
    console.log('Initializing database...');
    
    // Only import mysql2 in a node environment
    const mysql = await import('mysql2/promise');
    
    // Test database exists first
    try {
      const tempPool = mysql.createPool({
        ...dbConfig,
        connectTimeout: 5000, // Shorter timeout for initial test
        multipleStatements: true
      });
      
      // Try connection
      console.log('Testing database connection...');
      const conn = await tempPool.getConnection();
      console.log('Initial connection test successful');
      conn.release();
      
      // If we reached here, connection works, so set the main pool
      pool = tempPool;
    } catch (error: any) {
      console.error('Initial connection test failed:', error.message);
      
      // If database doesn't exist, try to create it
      if (error.message.includes('Unknown database') || error.code === 'ER_BAD_DB_ERROR') {
        console.log('Database does not exist, attempting to create it...');
        
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
          console.log(`Database '${dbConfig.database}' created successfully`);
          conn.release();
          await rootPool.end();
          
          // Now create the main pool with the database specified
          pool = mysql.createPool(dbConfig);
        } catch (createError) {
          console.error('Failed to create database:', createError);
          forceLocalStorage = true;
          isInitialized = true;
          return false;
        }
      } else {
        // Other connection error
        forceLocalStorage = true;
        isInitialized = true;
        return false;
      }
    }
    
    // Initialize tables if they don't exist
    await createTables();
    
    isInitialized = true;
    forceLocalStorage = false;
    console.log('Database initialization complete.');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    forceLocalStorage = true;
    isInitialized = true;
    toast.error('Failed to connect to MySQL database. Please check your credentials and try again.');
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
    
    // Check if we need to add initial students
    const [students] = await pool.execute('SELECT * FROM students');
    if (Array.isArray(students) && students.length === 0) {
      // Add initial students if table is empty
      await addInitialStudents();
    }
  } catch (error) {
    console.error('Error creating tables:', error);
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
    console.log('Initial students added successfully');
  } catch (error) {
    console.error('Error adding initial students:', error);
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

// STUDENT OPERATIONS

/**
 * Get all students from the database
 */
export const getStudents = async (): Promise<Student[]> => {
  // Always initialize database first
  await initializeDatabase();
  
  if (isBrowser || forceLocalStorage) {
    // Only use localStorage in browser or if database connection failed
    return getLocalStorageItem(STORAGE_KEYS.STUDENTS, []);
  }
  
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute('SELECT * FROM students ORDER BY name');
    conn.release();
    return rows as Student[];
  } catch (error) {
    console.error('Error fetching students:', error);
    // Only fall back to localStorage if absolutely necessary
    toast.error('Failed to fetch students from database. Using local storage as fallback.');
    return getLocalStorageItem(STORAGE_KEYS.STUDENTS, []);
  }
};

/**
 * Add a new student to the database
 */
export const addStudent = async (student: Omit<Student, 'id'>): Promise<Student> => {
  await initializeDatabase();
  
  if (isBrowser || forceLocalStorage) {
    // Only use localStorage in browser or if database connection failed
    const students = await getStudents();
    const newId = students.length > 0 ? Math.max(...students.map(s => s.id)) + 1 : 1;
    const newStudent = { ...student, id: newId };
    
    const updatedStudents = [...students, newStudent];
    setLocalStorageItem(STORAGE_KEYS.STUDENTS, updatedStudents);
    
    return newStudent;
  }
  
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
    console.error('Error adding student:', error);
    toast.error('Failed to add student to database. Using local storage as fallback.');
    
    // Fallback to localStorage only if database operation fails
    const students = await getStudents();
    const newId = students.length > 0 ? Math.max(...students.map(s => s.id)) + 1 : 1;
    const newStudent = { ...student, id: newId };
    
    const updatedStudents = [...students, newStudent];
    setLocalStorageItem(STORAGE_KEYS.STUDENTS, updatedStudents);
    
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
    
    setLocalStorageItem(STORAGE_KEYS.STUDENTS, updatedStudents);
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
    
    setLocalStorageItem(STORAGE_KEYS.STUDENTS, updatedStudents);
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
    
    setLocalStorageItem(STORAGE_KEYS.STUDENTS, updatedStudents);
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
    
    setLocalStorageItem(STORAGE_KEYS.STUDENTS, updatedStudents);
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
    setLocalStorageItem(STORAGE_KEYS.ATTENDANCE, updatedRecords);
    
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
    setLocalStorageItem(STORAGE_KEYS.ATTENDANCE, updatedRecords);
    
    return record;
  }
};

/**
 * Get all attendance records
 */
export const getAttendanceRecords = async (): Promise<AttendanceRecord[]> => {
  await initializeDatabase();
  
  if (isBrowser || forceLocalStorage) {
    // In browser, get from localStorage
    return getLocalStorageItem(STORAGE_KEYS.ATTENDANCE, []);
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
    toast.error('Failed to fetch attendance records from database. Using local storage as fallback.');
    return getLocalStorageItem(STORAGE_KEYS.ATTENDANCE, []);
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
    
    setLocalStorageItem(STORAGE_KEYS.ATTENDANCE, updatedRecords);
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
    
    setLocalStorageItem(STORAGE_KEYS.ATTENDANCE, updatedRecords);
    return true;
  }
};

// LocalStorage helpers for browser environment or fallback
const getLocalStorageItem = (key: string, defaultValue: any = []) => {
  if (!isBrowser) return defaultValue;
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : defaultValue;
};

const setLocalStorageItem = (key: string, value: any) => {
  if (!isBrowser) return;
  localStorage.setItem(key, JSON.stringify(value));
};
