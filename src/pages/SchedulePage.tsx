
import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAttendanceRecords, getWeeklyAttendanceData } from '@/lib/attendance-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, Clock, ChevronLeft, ChevronRight, UserCheck, UserX } from 'lucide-react';
import { cn } from '@/lib/utils';

const SchedulePage = () => {
  const { records } = useAttendanceRecords();
  const [currentWeek, setCurrentWeek] = useState(0); // 0 = current week
  
  // Function to get monday of the current week
  const getMondayOfWeek = (weekOffset: number) => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1) + (weekOffset * 7);
    const monday = new Date(today.setDate(diff));
    return monday;
  };
  
  // Get start and end of the week
  const startOfWeek = getMondayOfWeek(currentWeek);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  
  // Format date range for display
  const formatDateRange = () => {
    return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };
  
  // Generate days of the week for the view
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    weekDays.push({
      date,
      dateString: date.toISOString().split('T')[0],
      dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' }),
      dayOfMonth: date.getDate(),
      isToday: new Date().toDateString() === date.toDateString()
    });
  }
  
  // Get sessions for each day
  const weekSessions = weekDays.map(day => {
    const daySessions = records.filter(record => record.date === day.dateString);
    return {
      ...day,
      sessions: daySessions.map(session => {
        const presentCount = session.students.filter(s => s.status === 'present').length;
        const totalCount = session.students.length;
        const percentage = Math.round((presentCount / totalCount) * 100);
        
        return {
          ...session,
          presentCount,
          totalCount,
          percentage
        };
      })
    };
  });
  
  // Prepare data for weekly trend chart
  const chartData = weekDays.map(day => {
    const dayRecords = records.filter(r => r.date === day.dateString);
    let presentCount = 0;
    let totalCount = 0;
    
    dayRecords.forEach(record => {
      record.students.forEach(student => {
        totalCount++;
        if (student.status === 'present') {
          presentCount++;
        }
      });
    });
    
    const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
    
    return {
      date: day.date.toLocaleDateString('en-US', { weekday: 'short' }),
      percentage,
      present: presentCount,
      total: totalCount
    };
  });
  
  // Calculate weekly stats
  const weeklyStats = {
    totalSessions: weekSessions.reduce((acc, day) => acc + day.sessions.length, 0),
    averageAttendance: chartData.reduce((acc, day) => acc + day.percentage, 0) / chartData.filter(day => day.total > 0).length || 0
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <section className="mb-8" data-aos="fade-up">
          <h1 className="text-3xl font-bold">Weekly Schedule</h1>
          <p className="text-muted-foreground mt-2">View and manage weekly attendance sessions</p>
        </section>
        
        <div className="flex flex-col md:flex-row gap-6 mb-8 justify-between items-center">
          <div className="flex items-center gap-4" data-aos="fade-up">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setCurrentWeek(prev => prev - 1)}
              className="neo-button"
            >
              <ChevronLeft size={16} />
            </Button>
            
            <div className="text-lg font-medium">{formatDateRange()}</div>
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setCurrentWeek(prev => prev + 1)}
              className="neo-button"
              disabled={currentWeek >= 0}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
          
          <Button onClick={() => setCurrentWeek(0)} variant="outline" className="neo-button">
            Today
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Card data-aos="fade-up">
            <CardHeader>
              <CardTitle>Week Overview</CardTitle>
              <CardDescription>Attendance statistics for the selected week</CardDescription>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="date" />
                  <YAxis unit="%" domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      borderRadius: '0.5rem',
                      border: '1px solid rgba(0,0,0,0.05)',
                      boxShadow: '0px 4px 12px rgba(0,0,0,0.05)'
                    }}
                    formatter={(value) => [`${value}%`, 'Attendance']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="percentage" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    dot={{ strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7 }}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card data-aos="fade-up" data-aos-delay="100">
            <CardHeader>
              <CardTitle>Weekly Stats</CardTitle>
              <CardDescription>Attendance statistics summary</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col items-center justify-center p-6 bg-primary/5 rounded-lg">
                  <Calendar className="h-8 w-8 text-primary mb-2" />
                  <div className="text-3xl font-bold">{weeklyStats.totalSessions}</div>
                  <div className="text-sm text-muted-foreground">Sessions</div>
                </div>
                
                <div className="flex flex-col items-center justify-center p-6 bg-primary/5 rounded-lg">
                  <UserCheck className="h-8 w-8 text-primary mb-2" />
                  <div className="text-3xl font-bold">{Math.round(weeklyStats.averageAttendance)}%</div>
                  <div className="text-sm text-muted-foreground">Avg. Attendance</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card data-aos="fade-up">
          <CardHeader>
            <CardTitle>Daily Sessions</CardTitle>
            <CardDescription>View attendance sessions for each day</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={weekDays[0].dayOfWeek.toLowerCase()}>
              <TabsList className="grid grid-cols-7">
                {weekDays.map((day) => (
                  <TabsTrigger 
                    key={day.dateString} 
                    value={day.dayOfWeek.toLowerCase()}
                    className={cn(
                      "flex flex-col items-center py-2 gap-1 neo-button",
                      day.isToday && "bg-primary/10"
                    )}
                  >
                    <span className="text-xs">{day.dayOfWeek.substring(0, 3)}</span>
                    <span className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center font-semibold",
                      day.isToday && "bg-primary text-white"
                    )}>
                      {day.dayOfMonth}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {weekDays.map((day) => {
                const dayData = weekSessions.find(d => d.dateString === day.dateString);
                
                return (
                  <TabsContent 
                    key={day.dateString} 
                    value={day.dayOfWeek.toLowerCase()}
                    className="pt-6"
                  >
                    {dayData && dayData.sessions.length > 0 ? (
                      <div className="space-y-4">
                        {dayData.sessions.map((session) => (
                          <div 
                            key={session.id} 
                            className="border rounded-lg p-4 hover:bg-muted/20 transition-colors"
                            data-aos="fade-up"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="font-medium text-lg">{session.classTitle}</h3>
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Clock size={14} className="mr-1" />
                                  <span>
                                    {new Date(day.date).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </span>
                                </div>
                              </div>
                              <Badge className={cn(
                                "text-white",
                                session.percentage >= 80 ? "bg-green-500" : 
                                session.percentage >= 60 ? "bg-amber-500" : "bg-red-500"
                              )}>
                                {session.percentage}% Attendance
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4">
                              <div className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-lg">
                                <UserCheck size={16} className="text-primary mb-1" />
                                <div className="text-sm font-semibold text-primary">
                                  {session.presentCount} Present
                                </div>
                              </div>
                              
                              <div className="flex flex-col items-center justify-center p-3 bg-red-50 rounded-lg">
                                <UserX size={16} className="text-red-500 mb-1" />
                                <div className="text-sm font-semibold text-red-500">
                                  {session.totalCount - session.presentCount} Absent
                                </div>
                              </div>
                              
                              <div className="flex flex-col items-center justify-center p-3 bg-green-50 rounded-lg">
                                <Calendar size={16} className="text-green-500 mb-1" />
                                <div className="text-sm font-semibold text-green-500">
                                  {session.totalCount} Total
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center" data-aos="fade-up">
                        <Calendar className="h-16 w-16 text-muted-foreground/50 mb-4" />
                        <h3 className="font-medium text-lg mb-2">No sessions recorded</h3>
                        <p className="text-muted-foreground mb-6">
                          There are no attendance records for this day
                        </p>
                        
                        {day.date <= new Date() && (
                          <Button asChild className="neo-button">
                            <a href="/attendance">Take Attendance</a>
                          </Button>
                        )}
                      </div>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default SchedulePage;
