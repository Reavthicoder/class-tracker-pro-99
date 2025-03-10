
import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAttendanceRecords, useStudents } from '@/lib/attendance-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon, Download, Search, List, Calendar, UserCheck } from 'lucide-react';

const ReportsPage = () => {
  const { records } = useAttendanceRecords();
  const { students } = useStudents();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter records based on time range
  const today = new Date();
  const filteredRecords = records.filter(record => {
    const recordDate = new Date(record.date);
    if (timeRange === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      return recordDate >= weekAgo;
    } else if (timeRange === 'month') {
      const monthAgo = new Date(today);
      monthAgo.setMonth(today.getMonth() - 1);
      return recordDate >= monthAgo;
    }
    return true; // 'all' time range
  });
  
  // Prepare data for the weekly line chart
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  
  // Prepare line chart data
  const lineChartData = days.map(day => {
    const dayRecords = filteredRecords.filter(r => r.date === day);
    
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
      date: new Date(day).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      percentage,
      present: presentCount,
      total: totalCount
    };
  });
  
  // Prepare pie chart data
  const allStatuses = filteredRecords.flatMap(record => record.students.map(s => s.status));
  const presentCount = allStatuses.filter(s => s === 'present').length;
  const absentCount = allStatuses.filter(s => s === 'absent').length;
  const lateCount = allStatuses.filter(s => s === 'late').length;
  const totalCount = allStatuses.length;
  
  const pieChartData = [
    { name: 'Present', value: presentCount, color: '#3B82F6' },
    { name: 'Absent', value: absentCount, color: '#EF4444' },
    { name: 'Late', value: lateCount, color: '#F59E0B' }
  ];
  
  // Prepare bar chart data
  const classSessions = [...new Set(filteredRecords.map(r => r.classTitle))];
  
  const barChartData = classSessions.map(className => {
    const classRecords = filteredRecords.filter(r => r.classTitle === className);
    
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let totalCount = 0;
    
    classRecords.forEach(record => {
      record.students.forEach(student => {
        totalCount++;
        if (student.status === 'present') presentCount++;
        if (student.status === 'absent') absentCount++;
        if (student.status === 'late') lateCount++;
      });
    });
    
    return {
      name: className,
      present: Math.round((presentCount / totalCount) * 100) || 0,
      absent: Math.round((absentCount / totalCount) * 100) || 0,
      late: Math.round((lateCount / totalCount) * 100) || 0
    };
  });
  
  // Recent attendance sessions for list
  const recentSessions = [...filteredRecords]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);
  
  // Filter students based on search
  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Calculate attendance percentage for each student
  const studentAttendance = filteredStudents.map(student => {
    const studentRecords = filteredRecords.flatMap(record => 
      record.students.filter(s => s.studentId === student.id)
    );
    
    const totalClasses = studentRecords.length;
    const presentClasses = studentRecords.filter(r => r.status === 'present').length;
    const absentClasses = studentRecords.filter(r => r.status === 'absent').length;
    const lateClasses = studentRecords.filter(r => r.status === 'late').length;
    
    const attendancePercentage = totalClasses > 0 
      ? Math.round((presentClasses / totalClasses) * 100) 
      : 0;
    
    return {
      ...student,
      attendancePercentage,
      presentClasses,
      absentClasses,
      lateClasses,
      totalClasses
    };
  }).sort((a, b) => b.attendancePercentage - a.attendancePercentage);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <section className="mb-8" data-aos="fade-up">
          <h1 className="text-3xl font-bold">Attendance Reports</h1>
          <p className="text-muted-foreground mt-2">Analyze attendance data and trends</p>
        </section>
        
        <div className="flex flex-col md:flex-row gap-6 mb-8 justify-between items-start">
          <div className="flex items-center gap-4" data-aos="fade-up">
            <Select value={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" className="neo-button">
              <Download size={16} className="mr-2" />
              Export Data
            </Button>
          </div>
          
          <div className="relative w-full md:w-auto" data-aos="fade-up">
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 md:w-64"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          </div>
        </div>
        
        <Tabs defaultValue="overview">
          <TabsList className="mb-8" data-aos="fade-up">
            <TabsTrigger value="overview" className="neo-button">
              <BarChart3 size={16} className="mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="students" className="neo-button">
              <UserCheck size={16} className="mr-2" />
              By Student
            </TabsTrigger>
            <TabsTrigger value="sessions" className="neo-button">
              <Calendar size={16} className="mr-2" />
              Sessions
            </TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
              <Card data-aos="fade-up">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Present Rate</CardTitle>
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserCheck size={14} className="text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {presentCount} out of {totalCount} attendances
                  </p>
                </CardContent>
              </Card>
              
              <Card data-aos="fade-up" data-aos-delay="100">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Average Absence</CardTitle>
                  <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                    <UserCheck size={14} className="text-red-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {totalCount > 0 ? Math.round((absentCount / totalCount) * 100) : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {absentCount} out of {totalCount} attendances
                  </p>
                </CardContent>
              </Card>
              
              <Card data-aos="fade-up" data-aos-delay="200">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Sessions Recorded</CardTitle>
                  <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <Calendar size={14} className="text-amber-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{filteredRecords.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Total class sessions
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <Card data-aos="fade-up">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Weekly Trend</CardTitle>
                    <LineChartIcon size={18} className="text-muted-foreground" />
                  </div>
                  <CardDescription>Attendance percentage over time</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={lineChartData}
                      margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis 
                        dataKey="date" 
                        angle={-30}
                        textAnchor="end"
                        height={70}
                        tick={{ fontSize: 12 }}
                      />
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
                  <div className="flex items-center justify-between">
                    <CardTitle>Attendance Distribution</CardTitle>
                    <PieChartIcon size={18} className="text-muted-foreground" />
                  </div>
                  <CardDescription>Overall attendance status</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                        animationDuration={1500}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {pieChartData.map((entry, index) => (
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
                        formatter={(value) => [`${value} attendances`, '']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
            
            <Card data-aos="fade-up">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Attendance by Class</CardTitle>
                  <BarChart3 size={18} className="text-muted-foreground" />
                </div>
                <CardDescription>Present rate for each class</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barChartData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis 
                      dataKey="name"
                      angle={-30}
                      textAnchor="end"
                      height={70}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis unit="%" domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        borderRadius: '0.5rem',
                        border: '1px solid rgba(0,0,0,0.05)',
                        boxShadow: '0px 4px 12px rgba(0,0,0,0.05)'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="present" fill="#3B82F6" name="Present" />
                    <Bar dataKey="absent" fill="#EF4444" name="Absent" />
                    <Bar dataKey="late" fill="#F59E0B" name="Late" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Students Tab */}
          <TabsContent value="students">
            <Card data-aos="fade-up">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Student Attendance Rankings</CardTitle>
                  <UserCheck size={18} className="text-muted-foreground" />
                </div>
                <CardDescription>Attendance rates for all students</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/40">
                        <th className="text-left p-3 text-sm font-medium">Rank</th>
                        <th className="text-left p-3 text-sm font-medium">Student</th>
                        <th className="text-center p-3 text-sm font-medium">Present</th>
                        <th className="text-center p-3 text-sm font-medium">Absent</th>
                        <th className="text-center p-3 text-sm font-medium">Late</th>
                        <th className="text-center p-3 text-sm font-medium">Attendance %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {studentAttendance.map((student, index) => (
                        <tr 
                          key={student.id} 
                          className="hover:bg-muted/20 transition-colors"
                          data-aos="fade-up"
                          data-aos-delay={30 * (index % 10)}
                        >
                          <td className="p-3">
                            <div className="flex justify-center items-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium">
                              {index + 1}
                            </div>
                          </td>
                          <td className="p-3">
                            <div>
                              <div className="font-medium">{student.name}</div>
                              <div className="text-xs text-muted-foreground">{student.rollNumber}</div>
                            </div>
                          </td>
                          <td className="p-3 text-center text-primary">{student.presentClasses}</td>
                          <td className="p-3 text-center text-red-500">{student.absentClasses}</td>
                          <td className="p-3 text-center text-amber-500">{student.lateClasses}</td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-full max-w-24 bg-muted rounded-full h-1.5">
                                <div 
                                  className="h-1.5 rounded-full bg-primary"
                                  style={{ width: `${student.attendancePercentage}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium">{student.attendancePercentage}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Sessions Tab */}
          <TabsContent value="sessions">
            <Card data-aos="fade-up">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Sessions</CardTitle>
                  <List size={18} className="text-muted-foreground" />
                </div>
                <CardDescription>Past attendance sessions and details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/40">
                        <th className="text-left p-3 text-sm font-medium">Date</th>
                        <th className="text-left p-3 text-sm font-medium">Class</th>
                        <th className="text-center p-3 text-sm font-medium">Present</th>
                        <th className="text-center p-3 text-sm font-medium">Absent</th>
                        <th className="text-center p-3 text-sm font-medium">Late</th>
                        <th className="text-center p-3 text-sm font-medium">Attendance %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {recentSessions.map((session, index) => {
                        const totalStudents = session.students.length;
                        const presentCount = session.students.filter(s => s.status === 'present').length;
                        const absentCount = session.students.filter(s => s.status === 'absent').length;
                        const lateCount = session.students.filter(s => s.status === 'late').length;
                        const percentage = Math.round((presentCount / totalStudents) * 100);
                        
                        return (
                          <tr 
                            key={session.id} 
                            className="hover:bg-muted/20 transition-colors"
                            data-aos="fade-up"
                            data-aos-delay={30 * (index % 10)}
                          >
                            <td className="p-3">
                              {new Date(session.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </td>
                            <td className="p-3 font-medium">{session.classTitle}</td>
                            <td className="p-3 text-center text-primary">{presentCount}</td>
                            <td className="p-3 text-center text-red-500">{absentCount}</td>
                            <td className="p-3 text-center text-amber-500">{lateCount}</td>
                            <td className="p-3">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-full max-w-24 bg-muted rounded-full h-1.5">
                                  <div 
                                    className="h-1.5 rounded-full bg-primary"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium">{percentage}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ReportsPage;
