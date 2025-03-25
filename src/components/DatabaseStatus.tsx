
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Database, Server, Loader2, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DB_CONNECTION_STATUS, DB_CONFIG } from '@/lib/constants';
import { initializeDatabase } from '@/lib/database-service';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const DatabaseStatus = () => {
  const [status, setStatus] = useState<typeof DB_CONNECTION_STATUS[keyof typeof DB_CONNECTION_STATUS]>(DB_CONNECTION_STATUS.CHECKING);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  
  useEffect(() => {
    const checkStatus = async () => {
      try {
        // In a browser environment, we can't directly connect to MySQL
        if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
          setStatus(DB_CONNECTION_STATUS.BROWSER);
          return;
        }
        
        // Try to initialize database connection
        console.log('Checking MySQL connection status...');
        console.log(`Host: ${DB_CONFIG.host}, User: ${DB_CONFIG.user}, Database: ${DB_CONFIG.database}`);
        const isConnected = await initializeDatabase();
        setStatus(isConnected ? DB_CONNECTION_STATUS.CONNECTED : DB_CONNECTION_STATUS.DISCONNECTED);
        
        if (!isConnected) {
          setErrorDetail(`Failed to connect to MySQL at ${DB_CONFIG.host} with user ${DB_CONFIG.user} for database ${DB_CONFIG.database}.`);
        }
      } catch (error) {
        console.error('MySQL database connection check failed:', error);
        setStatus(DB_CONNECTION_STATUS.DISCONNECTED);
        
        if (error instanceof Error) {
          setErrorDetail(error.message);
        } else {
          setErrorDetail('Unknown error connecting to MySQL database');
        }
      }
    };
    
    checkStatus();
  }, []);
  
  const statusInfo = {
    [DB_CONNECTION_STATUS.CHECKING]: {
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
      text: 'Checking MySQL...',
      tooltip: 'Checking MySQL database connection status...',
      variant: 'outline' as const
    },
    [DB_CONNECTION_STATUS.BROWSER]: {
      icon: <AlertTriangle className="h-3 w-3" />,
      text: 'MySQL Required',
      tooltip: 'This application requires a Node.js environment with MySQL database. Please run the application locally using "npm run dev" command.',
      variant: 'secondary' as const
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
      tooltip: `Failed to connect to MySQL database. MySQL should be running with user: ${DB_CONFIG.user} and database: ${DB_CONFIG.database}`,
      variant: 'destructive' as const
    }
  };
  
  const currentStatus = statusInfo[status];
  
  return (
    <>
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
            {errorDetail && <p className="text-red-500 mt-1">{errorDetail}</p>}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {status === DB_CONNECTION_STATUS.DISCONNECTED && (
        <Alert variant="destructive" className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Database Connection Failed</AlertTitle>
          <AlertDescription>
            <p>Could not connect to MySQL database. Please verify:</p>
            <ul className="list-disc ml-5 mt-2">
              <li>MySQL service is running (check using <code>mysql.server status</code> or <code>systemctl status mysql</code>)</li>
              <li>User <code>{DB_CONFIG.user}</code> exists and password is correct</li>
              <li>Database <code>{DB_CONFIG.database}</code> exists (create it if not: <code>CREATE DATABASE {DB_CONFIG.database};</code>)</li>
              <li>User has permissions to access the database</li>
              <li>There are no firewall issues blocking port 3306</li>
            </ul>
            {errorDetail && <p className="mt-2 font-mono text-sm bg-gray-800 text-white p-2 rounded">{errorDetail}</p>}
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};

export default DatabaseStatus;
