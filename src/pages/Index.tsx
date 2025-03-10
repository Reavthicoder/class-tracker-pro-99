
import { useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAttendanceRecords } from '@/lib/attendance-service';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CalendarCheck, Users, BarChart, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';

const Index = () => {
  const { records, loading } = useAttendanceRecords();

  // Weekly statistics
  const totalSessions = records.length;
  const totalStudents = 50;
  
  // Calculate overall attendance percentage
  const overallStats = {
    present: 0,
    absent: 0,
    late: 0,
    total: 0
  };
  
  records.forEach(record => {
    record.students.forEach(student => {
      overallStats.total++;
      if (student.status === 'present') overallStats.present++;
      if (student.status === 'absent') overallStats.absent++;
      if (student.status === 'late') overallStats.late++; 
    });
  });
  
  const attendancePercentage = Math.round((overallStats.present / overallStats.total) * 100) || 0;
  
  // Get last 7 days of records for the chart
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7Days.push(d.toISOString().split('T')[0]);
  }
  
  // Format data for line chart
  const chartData = last7Days.map(date => {
    const dayRecords = records.filter(r => r.date === date);
    let present = 0, absent = 0, late = 0, total = 0;
    
    dayRecords.forEach(record => {
      record.students.forEach(student => {
        total++;
        if (student.status === 'present') present++;
        if (student.status === 'absent') absent++;
        if (student.status === 'late') late++;
      });
    });
    
    // If no records for this day, set present percentage to 0
    const presentPercentage = total > 0 ? Math.round((present / total) * 100) : 0;
    
    return {
      date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      present: presentPercentage,
      absent: Math.round((absent / (total || 1)) * 100),
      late: Math.round((late / (total || 1)) * 100)
    };
  });
  
  // Data for pie chart
  const pieData = [
    { name: 'Present', value: overallStats.present, color: '#3B82F6' },
    { name: 'Absent', value: overallStats.absent, color: '#EF4444' },
    { name: 'Late', value: overallStats.late, color: '#F59E0B' }
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto text-center" data-aos="fade-up">
          <div className="mb-6 inline-flex items-center justify-center p-2 bg-primary/10 rounded-full">
            <CalendarCheck size={22} className="text-primary animate-pulse-subtle" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-balance">
            Student Attendance Tracking
            <span className="text-primary"> Simplified</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-balance">
            Track, analyze and optimize your classroom attendance with our elegant and efficient attendance management system.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" asChild className="neo-button">
              <Link to="/attendance">
                Take Attendance
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="neo-button">
              <Link to="/reports">
                View Reports
              </Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Stats Overview */}
      <section className="py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Students */}
          <Card data-aos="fade-up" data-aos-delay="0">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users size={16} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStudents}</div>
              <p className="text-xs text-muted-foreground">Registered in system</p>
            </CardContent>
          </Card>
          
          {/* Attendance Rate */}
          <Card data-aos="fade-up" data-aos-delay="100">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <Award size={16} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{attendancePercentage}%</div>
              <p className="text-xs text-muted-foreground">Overall present rate</p>
            </CardContent>
          </Card>
          
          {/* Total Sessions */}
          <Card data-aos="fade-up" data-aos-delay="200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <CalendarCheck size={16} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSessions}</div>
              <p className="text-xs text-muted-foreground">Classes recorded</p>
            </CardContent>
          </Card>
          
          {/* Last 7 Days */}
          <Card data-aos="fade-up" data-aos-delay="300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Last 7 Days</CardTitle>
              <BarChart size={16} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {chartData[chartData.length - 1].present}%
              </div>
              <p className="text-xs text-muted-foreground">Today's attendance</p>
            </CardContent>
          </Card>
        </div>
      </section>
      
      {/* Charts */}
      <section className="py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Weekly Line Chart */}
          <Card className="col-span-2" data-aos="fade-up">
            <CardHeader>
              <CardTitle>Weekly Attendance Trend</CardTitle>
              <CardDescription>Attendance percentage over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
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
                  />
                  <Line 
                    type="monotone" 
                    dataKey="present" 
                    stroke="#3B82F6" 
                    strokeWidth={2.5}
                    dot={{ strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                    animationDuration={1500}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="absent" 
                    stroke="#EF4444" 
                    strokeWidth={2} 
                    dot={{ strokeWidth: 2 }}
                    animationDuration={1500}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="late" 
                    stroke="#F59E0B" 
                    strokeWidth={2} 
                    dot={{ strokeWidth: 2 }}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          {/* Pie Chart */}
          <Card data-aos="fade-up" data-aos-delay="100">
            <CardHeader>
              <CardTitle>Overall Attendance</CardTitle>
              <CardDescription>Distribution of attendance statuses</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    animationDuration={1500}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      borderRadius: '0.5rem',
                      border: '1px solid rgba(0,0,0,0.05)',
                      boxShadow: '0px 4px 12px rgba(0,0,0,0.05)'
                    }}
                    formatter={(value) => [`${value} students`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </section>
      
      {/* CTA */}
      <section className="py-12" data-aos="fade-up">
        <div className="bg-primary/5 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to take attendance?</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Start tracking attendance for your next class session with just a few clicks.
          </p>
          <Button size="lg" asChild className="neo-button">
            <Link to="/attendance">
              Take Attendance Now
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
