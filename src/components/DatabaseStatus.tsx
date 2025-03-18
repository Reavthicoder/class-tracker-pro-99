
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Database, Server, Loader2, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DB_CONNECTION_STATUS } from '@/lib/constants';
import { initializeDatabase } from '@/lib/database-service';

const DatabaseStatus = () => {
  const [status, setStatus] = useState<typeof DB_CONNECTION_STATUS[keyof typeof DB_CONNECTION_STATUS]>(DB_CONNECTION_STATUS.CHECKING);
  
  useEffect(() => {
    const checkStatus = async () => {
      try {
        // In a browser environment, we can't use MySQL directly
        if (typeof window !== 'undefined') {
          setStatus(DB_CONNECTION_STATUS.BROWSER);
          return;
        }
        
        // Try to initialize database connection
        const isConnected = await initializeDatabase();
        setStatus(isConnected ? DB_CONNECTION_STATUS.CONNECTED : DB_CONNECTION_STATUS.DISCONNECTED);
      } catch (error) {
        console.error('Database connection check failed:', error);
        setStatus(DB_CONNECTION_STATUS.DISCONNECTED);
      }
    };
    
    checkStatus();
  }, []);
  
  const statusInfo = {
    [DB_CONNECTION_STATUS.CHECKING]: {
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
      text: 'Checking DB...',
      tooltip: 'Checking database connection status...',
      variant: 'outline' as const
    },
    [DB_CONNECTION_STATUS.BROWSER]: {
      icon: <AlertTriangle className="h-3 w-3" />,
      text: 'Browser Mode (No DB)',
      tooltip: 'Running in browser environment. For full database functionality, please run the application with "npm run dev" in a Node.js environment.',
      variant: 'secondary' as const // Changed from 'warning' to 'secondary'
    },
    [DB_CONNECTION_STATUS.CONNECTED]: {
      icon: <Server className="h-3 w-3" />,
      text: 'MySQL Connected',
      tooltip: 'Successfully connected to MySQL database.',
      variant: 'success' as const
    },
    [DB_CONNECTION_STATUS.DISCONNECTED]: {
      icon: <Server className="h-3 w-3" />,
      text: 'MySQL Disconnected',
      tooltip: 'Failed to connect to MySQL database. Please check your database credentials in the .env file and ensure MySQL is running. See README for troubleshooting steps.',
      variant: 'destructive' as const
    }
  };
  
  const currentStatus = statusInfo[status];
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={currentStatus.variant} className="gap-1">
            {currentStatus.icon}
            <span>{currentStatus.text}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{currentStatus.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default DatabaseStatus;
