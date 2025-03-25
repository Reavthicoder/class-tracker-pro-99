
import { initializeDatabase } from './database-service';
import { toast } from 'sonner';
import { DB_CONFIG } from './constants';

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
    console.log(`Host: ${DB_CONFIG.host}, User: ${DB_CONFIG.user}, Database: ${DB_CONFIG.database}`);
    
    // Set a timeout to prevent endless loading state
    const connectionTimeout = setTimeout(() => {
      toast.error(`MySQL connection timed out. Please check your database credentials and ensure MySQL is running. User: ${DB_CONFIG.user}, Host: ${DB_CONFIG.host}, Database: ${DB_CONFIG.database}`);
    }, 15000);
    
    toast.loading('Connecting to MySQL database...', { duration: 18000 });
    
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
      toast.error(`Failed to connect to MySQL database. Verify MySQL is running and accessible at ${DB_CONFIG.host} with user ${DB_CONFIG.user}. Check if the database ${DB_CONFIG.database} exists and your user has permissions to access it.`);
      return false;
    }
  } catch (error) {
    console.error('MySQL database connection error:', error);
    
    // Provide more specific error messages based on error type
    if (error instanceof Error) {
      if (error.message.includes('Access denied')) {
        toast.error(`MySQL access denied. Check if your username (${DB_CONFIG.user}) and password are correct. You may need to reset the MySQL password or create this user.`);
      } else if (error.message.includes('Unknown database')) {
        toast.error(`Database '${DB_CONFIG.database}' does not exist. Please create it first using: CREATE DATABASE ${DB_CONFIG.database};`);
      } else if (error.message.includes('ECONNREFUSED')) {
        toast.error(`MySQL connection refused. Make sure MySQL server is running on ${DB_CONFIG.host} and accepting connections.`);
      } else {
        toast.error(`MySQL connection failed: ${error.message}. Check your credentials and MySQL server status.`);
      }
    } else {
      toast.error('MySQL connection failed with an unknown error. Please check your MySQL server status and configuration.');
    }
    
    return false;
  }
};
