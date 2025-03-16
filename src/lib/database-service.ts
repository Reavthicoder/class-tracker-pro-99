
import mysql from 'mysql2/promise';
import { Student, AttendanceRecord } from './attendance-service';

// Database connection configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'attentrack'
};

// Create a connection pool
let pool: mysql.Pool | null = null;

/**
 * Initialize the database connection pool
 */
export const initializeDatabase = async () => {
  try {
    pool = mysql.createPool(dbConfig);
    console.log('Database connection pool initialized');
    
    // Check connection
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    connection.release();
    
    // Initialize tables if they don't exist
    await createTables();
    
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
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute('SELECT * FROM students ORDER BY name');
    conn.release();
    return rows as Student[];
  } catch (error) {
    console.error('Error fetching students:', error);
    throw error;
  }
};

/**
 * Add a new student to the database
 */
export const addStudent = async (student: Omit<Student, 'id'>): Promise<Student> => {
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
    throw error;
  }
};

/**
 * Update an existing student
 */
export const updateStudent = async (student: Student): Promise<Student> => {
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
    throw error;
  }
};

/**
 * Delete a student by ID
 */
export const deleteStudent = async (id: number): Promise<boolean> => {
  try {
    const conn = await getConnection();
    await conn.execute('DELETE FROM students WHERE id = ?', [id]);
    conn.release();
    return true;
  } catch (error) {
    console.error('Error deleting student:', error);
    throw error;
  }
};

// ATTENDANCE OPERATIONS

/**
 * Save an attendance record
 */
export const saveAttendanceRecord = async (record: AttendanceRecord): Promise<AttendanceRecord> => {
  const conn = await getConnection();
  
  try {
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
    return record;
  } catch (error) {
    // Rollback in case of error
    await conn.rollback();
    console.error('Error saving attendance record:', error);
    throw error;
  } finally {
    conn.release();
  }
};

/**
 * Get all attendance records
 */
export const getAttendanceRecords = async (): Promise<AttendanceRecord[]> => {
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
    throw error;
  }
};

/**
 * Delete an attendance record
 */
export const deleteAttendanceRecord = async (id: string): Promise<boolean> => {
  try {
    const conn = await getConnection();
    await conn.execute('DELETE FROM attendance_records WHERE id = ?', [id]);
    conn.release();
    return true;
  } catch (error) {
    console.error('Error deleting attendance record:', error);
    throw error;
  }
};
