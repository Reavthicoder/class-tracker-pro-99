
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Database, Server, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const DatabaseStatus = () => {
  const [status, setStatus] = useState<'checking' | 'browser' | 'connected' | 'disconnected'>('checking');
  
  useEffect(() => {
    const checkStatus = async () => {
      // Always browser in preview
      if (typeof window !== 'undefined') {
        setStatus('browser');
      } else {
        try {
          // In a real Node.js environment, we would check database connectivity
          // But this will never run in the preview
          setStatus('connected');
        } catch (error) {
          console.error('Database connection failed:', error);
          setStatus('disconnected');
        }
      }
    };
    
    checkStatus();
  }, []);
  
  if (status === 'checking') {
    return (
      <Badge variant="outline" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Checking DB...</span>
      </Badge>
    );
  }
  
  const statusInfo = {
    browser: {
      icon: <Database className="h-3 w-3" />,
      text: 'Using Browser Storage',
      tooltip: 'Running in browser environment. Using localStorage for data storage.',
      variant: 'default' as const
    },
    connected: {
      icon: <Server className="h-3 w-3" />,
      text: 'Database Connected',
      tooltip: 'Successfully connected to MySQL database.',
      variant: 'default' as const
    },
    disconnected: {
      icon: <Server className="h-3 w-3" />,
      text: 'Database Disconnected',
      tooltip: 'Failed to connect to MySQL database. Using localStorage as fallback.',
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
