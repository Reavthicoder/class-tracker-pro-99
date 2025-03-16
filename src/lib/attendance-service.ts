
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

// Sample Indian student names
const studentNames = [
  "Aarav Sharma", "Aditi Patel", "Arjun Singh", "Ananya Verma", "Advait Joshi",
  "Aisha Khan", "Aryan Mehta", "Avni Gupta", "Dhruv Kumar", "Diya Reddy",
  "Ishaan Malhotra", "Isha Kapoor", "Kabir Bedi", "Kiara Agarwal", "Krishna Rao",
  "Lakshmi Nair", "Manav Choudhary", "Meera Banerjee", "Neha Desai", "Nikhil Gandhi",
  "Ojas Trivedi", "Pari Saxena", "Pranav Thakur", "Prisha Iyer", "Rahul Dubey",
  "Riya Shah", "Rohan Bajaj", "Saanvi Chauhan", "Samar Ahuja", "Sanya Bhatia",
  "Shaurya Sen", "Shreya Sharma", "Siddharth Pillai", "Siya Chakraborty", "Tanvi Menon",
  "Tara Hegde", "Udayan Chowdhury", "Vanya Singh", "Vedant Khanna", "Vihaan Mehra",
  "Yash Mitra", "Zara Ahmed", "Dev Kumar", "Anika Lahiri", "Arnav Bhatt",
  "Kavya Goyal", "Reyansh Rana", "Ishita Sen", "Vivaan Malik", "Myra Prasad"
];

// Generate 50 student objects
const generateStudents = (): Student[] => {
  return studentNames.map((name, index) => ({
    id: index + 1,
    name,
    rollNumber: `R${(index + 1).toString().padStart(3, '0')}`
  }));
};

// Initialize students
const initialStudents = generateStudents();

// Generate a random day in the last 21 days
const generateRandomDate = () => {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 21);
  const pastDate = new Date(now);
  pastDate.setDate(now.getDate() - daysAgo);
  return pastDate.toISOString().split('T')[0];
};

// Generate sample class titles
const classTitles = [
  "Mathematics 101", 
  "Physics 201", 
  "Chemistry 101", 
  "Biology 301", 
  "Computer Science 201", 
  "English Literature",
  "History of India"
];

// Generate initial attendance records (past 3 weeks of random data)
const generateInitialAttendanceRecords = (): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  
  // Generate 15 random attendance records
  for (let i = 0; i < 15; i++) {
    const date = generateRandomDate();
    const classTitle = classTitles[Math.floor(Math.random() * classTitles.length)];
    
    const students = initialStudents.map(student => {
      // Random status with 80% chance of present, 15% absent, 5% late
      const rand = Math.random();
      let status: 'present' | 'absent' | 'late' = 'present';
      
      if (rand > 0.8 && rand < 0.95) {
        status = 'absent';
      } else if (rand >= 0.95) {
        status = 'late';
      }
      
      return {
        studentId: student.id,
        status
      };
    });
    
    records.push({
      id: `attendance-${date}-${i}`,
      date,
      classTitle,
      students
    });
  }
  
  // Sort records by date (newest first)
  return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Initialize database and seed with sample data if needed
let dbInitialized = false;

const initDb = async () => {
  if (dbInitialized) return;
  
  try {
    console.log('Initializing database...');
    await db.initializeDatabase();
    
    // Check if we have students in the database
    const students = await db.getStudents();
    
    // If no students found, seed with initial data
    if (students.length === 0) {
      console.log('No students found. Seeding database with initial students...');
      
      // Add students in batches to avoid overwhelming the connection
      const batches = [];
      for (let i = 0; i < initialStudents.length; i += 10) {
        batches.push(initialStudents.slice(i, i + 10));
      }
      
      for (const batch of batches) {
        await Promise.all(
          batch.map(student => 
            db.addStudent({ name: student.name, rollNumber: student.rollNumber })
          )
        );
      }
      
      // Now seed with initial attendance records
      console.log('Seeding database with initial attendance records...');
      const records = generateInitialAttendanceRecords();
      
      // Add records in batches
      const recordBatches = [];
      for (let i = 0; i < records.length; i += 5) {
        recordBatches.push(records.slice(i, i + 5));
      }
      
      for (const batch of recordBatches) {
        await Promise.all(
          batch.map(record => db.saveAttendanceRecord(record))
        );
      }
    }
    
    dbInitialized = true;
    console.log('Database initialization complete.');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    // Continue anyway - the app will use localStorage fallback
  }
};

// Call initDb when the file is imported (but with a slight delay in browser)
if (typeof window !== 'undefined') {
  // In browser, delay initialization to avoid blocking rendering
  setTimeout(() => {
    initDb().catch(err => console.error('Delayed DB init failed:', err));
  }, 1000);
} else {
  // In Node.js environment, initialize immediately
  initDb().catch(err => console.error('DB init failed:', err));
}

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
      console.error('Error fetching students:', err);
      setError(err instanceof Error ? err : new Error('Unknown error fetching students'));
      
      // Fallback to sample data if DB fails
      setStudents(initialStudents);
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
      const error = err instanceof Error ? err : new Error('Unknown error adding student');
      setError(error);
      console.error('Error adding student:', error);
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
      const error = err instanceof Error ? err : new Error('Unknown error updating student');
      setError(error);
      console.error('Error updating student:', error);
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
      const error = err instanceof Error ? err : new Error('Unknown error deleting student');
      setError(error);
      console.error('Error deleting student:', error);
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
      console.error('Error fetching attendance records:', err);
      setError(err instanceof Error ? err : new Error('Unknown error fetching records'));
      
      // Fallback to localStorage
      try {
        // Avoid "not defined" errors in SSR
        if (typeof localStorage !== 'undefined') {
          const storedRecords = localStorage.getItem('attentrack-attendance');
          if (storedRecords) {
            setRecords(JSON.parse(storedRecords));
          } else {
            const initialRecords = generateInitialAttendanceRecords();
            setRecords(initialRecords);
            localStorage.setItem('attentrack-attendance', JSON.stringify(initialRecords));
          }
        } else {
          // If localStorage not available, use empty array
          setRecords([]);
        }
      } catch (localStorageErr) {
        console.error('LocalStorage fallback also failed:', localStorageErr);
        // Use empty array as last resort
        setRecords([]);
      }
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
      const error = err instanceof Error ? err : new Error('Unknown error saving record');
      setError(error);
      console.error('Error saving attendance record:', error);
      
      // Attempt fallback to localStorage
      try {
        if (typeof localStorage !== 'undefined') {
          const existingRecords = records;
          const existingIndex = existingRecords.findIndex(r => r.id === record.id);
          
          let newRecords: AttendanceRecord[];
          
          if (existingIndex >= 0) {
            newRecords = [...existingRecords];
            newRecords[existingIndex] = record;
          } else {
            newRecords = [record, ...existingRecords];
          }
          
          newRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setRecords(newRecords);
          localStorage.setItem('attentrack-attendance', JSON.stringify(newRecords));
        }
      } catch (localStorageErr) {
        console.error('LocalStorage fallback also failed:', localStorageErr);
      }
      
      return record;
    }
  };
  
  const deleteAttendanceRecord = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      await db.deleteAttendanceRecord(id);
      await fetchRecords(); // Refresh records
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error deleting record');
      setError(error);
      console.error('Error deleting attendance record:', error);
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
