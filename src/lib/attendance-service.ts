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

// Initialize database
let dbInitialized = false;
const initDb = async () => {
  if (!dbInitialized) {
    try {
      const success = await db.initializeDatabase();
      
      if (success) {
        // Check if we have students in the database
        const students = await db.getStudents();
        
        if (students.length === 0) {
          // Seed the database with initial data
          console.log('Seeding database with initial students...');
          for (const student of initialStudents) {
            await db.addStudent({ name: student.name, rollNumber: student.rollNumber });
          }
          
          // Seed with initial attendance records
          console.log('Seeding database with initial attendance records...');
          const records = generateInitialAttendanceRecords();
          for (const record of records) {
            await db.saveAttendanceRecord(record);
          }
        }
        
        dbInitialized = true;
      }
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }
};

// Call initDb when the file is imported
initDb();

// Hooks for accessing data
export const useStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      await initDb(); // Ensure DB is initialized
      const data = await db.getStudents();
      setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
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
      const newStudent = await db.addStudent(student);
      await fetchStudents(); // Refresh list
      return newStudent;
    } catch (error) {
      console.error('Error adding student:', error);
      throw error;
    }
  };
  
  const updateStudent = async (student: Student): Promise<Student> => {
    try {
      const updatedStudent = await db.updateStudent(student);
      await fetchStudents(); // Refresh list
      return updatedStudent;
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  };
  
  const deleteStudent = async (id: number): Promise<boolean> => {
    try {
      await db.deleteStudent(id);
      await fetchStudents(); // Refresh list
      return true;
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
  };
  
  return { 
    students, 
    loading, 
    addStudent,
    updateStudent,
    deleteStudent,
    refreshStudents: fetchStudents
  };
};

export const useAttendanceRecords = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      await initDb(); // Ensure DB is initialized
      const data = await db.getAttendanceRecords();
      setRecords(data);
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      // Fallback to localStorage if DB fails
      const storedRecords = localStorage.getItem('attentrack-attendance');
      if (storedRecords) {
        setRecords(JSON.parse(storedRecords));
      } else {
        const initialRecords = generateInitialAttendanceRecords();
        setRecords(initialRecords);
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
      await db.saveAttendanceRecord(record);
      await fetchRecords(); // Refresh records
      return record;
    } catch (error) {
      console.error('Error saving attendance record:', error);
      
      // Fallback to localStorage if DB fails
      const existingIndex = records.findIndex(r => r.id === record.id);
      
      let newRecords: AttendanceRecord[];
      
      if (existingIndex >= 0) {
        newRecords = [...records];
        newRecords[existingIndex] = record;
      } else {
        newRecords = [record, ...records];
      }
      
      newRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecords(newRecords);
      localStorage.setItem('attentrack-attendance', JSON.stringify(newRecords));
      
      return record;
    }
  };
  
  const deleteAttendanceRecord = async (id: string): Promise<boolean> => {
    try {
      await db.deleteAttendanceRecord(id);
      await fetchRecords(); // Refresh records
      return true;
    } catch (error) {
      console.error('Error deleting attendance record:', error);
      throw error;
    }
  };
  
  return { 
    records, 
    loading, 
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
