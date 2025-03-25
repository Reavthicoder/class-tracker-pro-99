import { useState, useEffect, useCallback } from 'react';
import * as db from './database-service';

// Types
export interface Student {
  id: number;
  name: string;
  rollNumber: string;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  classTitle: string;
  students: {
    studentId: number;
    status: 'present' | 'absent' | 'late';
  }[];
}

// Initialize database and seed with sample data if needed
let dbInitialized = false;

const initDb = async () => {
  if (dbInitialized) return;
  
  try {
    console.log('Initializing MySQL database from attendance service...');
    await db.initializeDatabase();
    dbInitialized = true;
    console.log('MySQL database initialization complete from attendance service.');
  } catch (error) {
    console.error('Failed to initialize MySQL database:', error);
    throw new Error('This application requires a MySQL database to function');
  }
};

// Call initDb when the file is imported
initDb().catch(err => console.error('DB init failed:', err));

// Hooks for accessing data
export const useStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Ensure DB is initialized before fetching
      if (!dbInitialized) {
        await initDb();
      }
      
      const data = await db.getStudents();
      setStudents(data);
    } catch (err) {
      console.error('Error fetching students from MySQL:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch students from MySQL database'));
      throw new Error('This application requires a MySQL database to function');
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);
  
  const addStudent = async (student: Omit<Student, 'id'>): Promise<Student> => {
    try {
      setError(null);
      const newStudent = await db.addStudent(student);
      await fetchStudents(); // Refresh list
      return newStudent;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to add student to MySQL database');
      setError(error);
      console.error('Error adding student to MySQL:', error);
      throw error;
    }
  };
  
  const updateStudent = async (student: Student): Promise<Student> => {
    try {
      setError(null);
      const updatedStudent = await db.updateStudent(student);
      await fetchStudents(); // Refresh list
      return updatedStudent;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update student in MySQL database');
      setError(error);
      console.error('Error updating student in MySQL:', error);
      throw error;
    }
  };
  
  const deleteStudent = async (id: number): Promise<boolean> => {
    try {
      setError(null);
      await db.deleteStudent(id);
      await fetchStudents(); // Refresh list
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete student from MySQL database');
      setError(error);
      console.error('Error deleting student from MySQL:', error);
      throw error;
    }
  };
  
  return { 
    students, 
    loading, 
    error,
    addStudent,
    updateStudent,
    deleteStudent,
    refreshStudents: fetchStudents
  };
};

export const useAttendanceRecords = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Ensure DB is initialized before fetching
      if (!dbInitialized) {
        await initDb();
      }
      
      const data = await db.getAttendanceRecords();
      setRecords(data);
    } catch (err) {
      console.error('Error fetching attendance records from MySQL:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch attendance records from MySQL database'));
      throw new Error('This application requires a MySQL database to function');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Load records
  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);
  
  // Save records function
  const saveAttendanceRecord = async (record: AttendanceRecord) => {
    try {
      setError(null);
      await db.saveAttendanceRecord(record);
      await fetchRecords(); // Refresh records
      return record;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to save attendance record to MySQL database');
      setError(error);
      console.error('Error saving attendance record to MySQL:', error);
      throw error;
    }
  };
  
  const deleteAttendanceRecord = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      await db.deleteAttendanceRecord(id);
      await fetchRecords(); // Refresh records
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete attendance record from MySQL database');
      setError(error);
      console.error('Error deleting attendance record from MySQL:', error);
      throw error;
    }
  };
  
  return { 
    records, 
    loading, 
    error,
    saveAttendanceRecord,
    deleteAttendanceRecord,
    refreshRecords: fetchRecords
  };
};

// Get today's date in YYYY-MM-DD format
export const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// Generate a unique ID for new attendance records
export const generateAttendanceId = () => {
  return `attendance-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

// Get weekly attendance data for charts
export const getWeeklyAttendanceData = (records: AttendanceRecord[]) => {
  // Get dates for the last 7 days
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  // Initialize data for each date
  const weeklyData = dates.map(date => ({
    date,
    present: 0,
    absent: 0,
    late: 0,
    total: 0
  }));
  
  // Count attendance for each date
  records.forEach(record => {
    const dateIndex = weeklyData.findIndex(d => d.date === record.date);
    if (dateIndex >= 0) {
      record.students.forEach(student => {
        weeklyData[dateIndex].total++;
        weeklyData[dateIndex][student.status]++;
      });
    }
  });
  
  // Format dates for display
  return weeklyData.map(data => ({
    ...data,
    formattedDate: new Date(data.date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }));
};
