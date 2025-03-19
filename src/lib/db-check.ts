
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
    toast.error('This application requires a Node.js environment with MySQL database. Please run the application locally using "npm run dev" command.');
    return false;
  }
  
  try {
    console.log('Attempting to connect to MySQL database...');
    
    // Set a timeout to prevent endless loading state
    const connectionTimeout = setTimeout(() => {
      toast.error('MySQL connection timed out. Please check your database credentials and ensure MySQL is running.');
    }, 8000); // Increased timeout to 8 seconds
    
    toast.loading('Connecting to MySQL database...', { duration: 10000 });
    
    // Explicitly pass credentials to ensure they're being used
    const isConnected = await initializeDatabase();
    
    // Clear the timeout as we got a response
    clearTimeout(connectionTimeout);
    
    if (isConnected) {
      console.log('Successfully connected to MySQL database');
      toast.success('Connected to MySQL database successfully. All data will be stored in MySQL.');
      return true;
    } else {
      console.warn('Failed to connect to MySQL database');
      toast.error('Failed to connect to MySQL database. Check your MySQL installation and verify your credentials (user: root, password: Karthikeya#2005). Make sure MySQL is running with "mysql.server start" or "systemctl start mysql".');
      return false;
    }
  } catch (error) {
    console.error('Database connection error:', error);
    toast.error('Database connection failed. Make sure MySQL is installed and running, and that your credentials are correct. Try running MySQL with: mysql -u root -p"Karthikeya#2005"');
    return false;
  }
};
