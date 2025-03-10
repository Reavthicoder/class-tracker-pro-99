
import { useState, useEffect } from 'react';

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

// Local storage keys
const STORAGE_KEYS = {
  STUDENTS: 'attentrack-students',
  ATTENDANCE: 'attentrack-attendance'
};

// Hooks for accessing data
export const useStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Try to load from localStorage first
    const storedStudents = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    
    if (storedStudents) {
      setStudents(JSON.parse(storedStudents));
    } else {
      // Use initial sample data if nothing in localStorage
      setStudents(initialStudents);
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(initialStudents));
    }
    
    setLoading(false);
  }, []);
  
  return { students, loading };
};

export const useAttendanceRecords = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Load records
  useEffect(() => {
    const storedRecords = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    
    if (storedRecords) {
      setRecords(JSON.parse(storedRecords));
    } else {
      // Use initial sample data
      const initialRecords = generateInitialAttendanceRecords();
      setRecords(initialRecords);
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(initialRecords));
    }
    
    setLoading(false);
  }, []);
  
  // Save records function
  const saveAttendanceRecord = (record: AttendanceRecord) => {
    // Check if record with this ID already exists
    const existingIndex = records.findIndex(r => r.id === record.id);
    
    let newRecords: AttendanceRecord[];
    
    if (existingIndex >= 0) {
      // Update existing record
      newRecords = [...records];
      newRecords[existingIndex] = record;
    } else {
      // Add new record
      newRecords = [record, ...records];
    }
    
    // Sort records by date (newest first)
    newRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Update state
    setRecords(newRecords);
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(newRecords));
    
    return record;
  };
  
  return { records, loading, saveAttendanceRecord };
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
