
import { initializeDatabase } from './database-service';
import { toast } from 'sonner';

/**
 * Checks the database connection on application startup
 * This can be imported and called in the main App component
 */
export const checkDatabaseConnection = async (): Promise<boolean> => {
  // Skip in browser environment
  if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
    console.log('Running in non-local browser environment, data storage is not available');
    toast.error('This application requires a Node.js environment with MySQL database. Data storage is not available in this browser environment. Please run the application locally using "npm run dev" command.');
    return false;
  }
  
  try {
    console.log('Attempting to connect to MySQL database...');
    toast.loading('Connecting to MySQL database...');
    
    const isConnected = await initializeDatabase();
    
    if (isConnected) {
      console.log('Successfully connected to MySQL database');
      toast.success('Connected to MySQL database successfully. All data will be stored in MySQL.');
      return true;
    } else {
      console.warn('Failed to connect to MySQL database');
      toast.error('Failed to connect to MySQL database. Please check your database credentials in the .env file and ensure MySQL is running. See README for troubleshooting steps.');
      return false;
    }
  } catch (error) {
    console.error('Database connection error:', error);
    toast.error('Database connection failed. Please check your database settings in the .env file and follow the troubleshooting steps in the README.');
    return false;
  }
};
