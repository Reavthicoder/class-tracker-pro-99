
import { initializeDatabase } from './database-service';
import { toast } from 'sonner';

/**
 * Checks the database connection on application startup
 * This can be imported and called in the main App component
 */
export const checkDatabaseConnection = async (): Promise<boolean> => {
  // Skip in browser environment
  if (typeof window !== 'undefined') {
    console.log('Running in browser environment, using localStorage for data storage');
    return false;
  }
  
  try {
    console.log('Attempting to connect to MySQL database...');
    const isConnected = await initializeDatabase();
    
    if (isConnected) {
      console.log('Successfully connected to MySQL database');
      toast.success('Connected to MySQL database');
      return true;
    } else {
      console.warn('Failed to connect to MySQL database, using localStorage fallback');
      toast.warning('Using localStorage (database connection failed)');
      return false;
    }
  } catch (error) {
    console.error('Database connection error:', error);
    toast.error('Database connection failed, using localStorage fallback');
    return false;
  }
};
