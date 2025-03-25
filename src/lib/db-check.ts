
import { initializeDatabase } from './database-service';
import { toast } from 'sonner';

/**
 * Checks the database connection on application startup
 * This can be imported and called in the main App component
 */
export const checkDatabaseConnection = async (): Promise<boolean> => {
  // In a browser environment that's not localhost, show a clear message
  if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
    console.log('Running in non-local browser environment, MySQL database is required');
    toast.error('This application requires a Node.js environment with MySQL database. Please run the application locally using "npm run dev" command.');
    return false;
  }
  
  try {
    console.log('Attempting to connect to MySQL database...');
    
    // Set a timeout to prevent endless loading state
    const connectionTimeout = setTimeout(() => {
      toast.error('MySQL connection timed out. Please check your database credentials (user: root, password: Karthikeya#2005) and ensure MySQL is running.');
    }, 10000);
    
    toast.loading('Connecting to MySQL database...', { duration: 12000 });
    
    // Initialize database with explicit credentials
    const isConnected = await initializeDatabase();
    
    // Clear the timeout as we got a response
    clearTimeout(connectionTimeout);
    
    if (isConnected) {
      console.log('Successfully connected to MySQL database');
      toast.success('Connected to MySQL database successfully.');
      return true;
    } else {
      console.warn('Failed to connect to MySQL database');
      toast.error('Failed to connect to MySQL database. Check your MySQL installation and verify your credentials (user: root, password: Karthikeya#2005). Make sure MySQL is running with "mysql.server start" or "systemctl start mysql".');
      return false;
    }
  } catch (error) {
    console.error('MySQL database connection error:', error);
    toast.error('MySQL database connection failed. Make sure MySQL is installed and running, and that your credentials are correct (user: root, password: Karthikeya#2005).');
    return false;
  }
};
