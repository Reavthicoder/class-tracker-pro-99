import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useStudents, useAttendanceRecords, generateAttendanceId, getTodayDate } from '@/lib/attendance-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, CheckCircle2, XCircle, Clock, Search, Save, Loader2, Users, AlertCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import DatabaseStatus from '@/components/DatabaseStatus';
import AddStudentDialog from '@/components/AddStudentDialog';
import { cn } from "@/lib/utils";

const AttendancePage = () => {
  const { students, loading: loadingStudents, error: studentsError } = useStudents();
  const { records, saveAttendanceRecord, error: recordsError } = useAttendanceRecords();
  const { toast } = useToast();
  
  const [classTitle, setClassTitle] = useState('');
  const [date, setDate] = useState(getTodayDate());
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  
  const [attendance, setAttendance] = useState<{
    studentId: number;
    status: 'present' | 'absent' | 'late';
  }[]>([]);
  
  useEffect(() => {
    if (students.length > 0) {
      setAttendance(students.map(student => ({
        studentId: student.id,
        status: 'present'
      })));
    }
  }, [students]);
  
  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const updateStatus = (studentId: number, status: 'present' | 'absent' | 'late') => {
    setAttendance(prev => 
      prev.map(item => 
        item.studentId === studentId ? { ...item, status } : item
      )
    );
  };
  
  const markAllPresent = () => {
    setAttendance(prev => 
      prev.map(item => ({ ...item, status: 'present' }))
    );
    
    toast({
      title: "All students marked present",
      description: `All ${students.length} students have been marked as present`,
    });
  };
  
  const saveAttendance = async () => {
    if (!classTitle) {
      toast({
        title: "Class title is required",
        description: "Please enter a title for this class session",
        variant: "destructive"
      });
      return;
    }
    
    setSaving(true);
    
    try {
      const newRecord = {
        id: generateAttendanceId(),
        date,
        classTitle,
        students: attendance
      };
      
      await saveAttendanceRecord(newRecord);
      
      toast({
        title: "Attendance saved successfully",
        description: `Recorded attendance for ${classTitle} on ${new Date(date).toLocaleDateString()}`,
      });
      
      setClassTitle('');
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast({
        title: "Error saving attendance",
        description: "There was a problem saving this attendance record. Using local storage as fallback.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  const stats = {
    present: attendance.filter(a => a.status === 'present').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    late: attendance.filter(a => a.status === 'late').length,
    total: attendance.length
  };

  const error = studentsError || recordsError;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <section className="mb-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Take Attendance</h1>
            <p className="text-muted-foreground mt-2">Record attendance for today's class session</p>
          </div>
          <DatabaseStatus />
        </section>
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error.message}
              <div className="text-xs mt-1">
                Don't worry - the app is using browser storage as a fallback.
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Session Details</CardTitle>
              <CardDescription>Configure class session info</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="classTitle">Class Title</Label>
                <Input
                  id="classTitle"
                  placeholder="e.g. Mathematics 101"
                  value={classTitle}
                  onChange={(e) => setClassTitle(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <div className="relative">
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    max={getTodayDate()}
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                </div>
              </div>
              
              <div className="pt-4 space-y-2">
                <h4 className="font-medium text-sm">Current Status</h4>
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="flex flex-col items-center justify-center bg-blue-50 p-3 rounded-lg">
                    <div className="text-xl font-bold text-primary">{stats.present}</div>
                    <div className="text-xs text-muted-foreground">Present</div>
                  </div>
                  <div className="flex flex-col items-center justify-center bg-red-50 p-3 rounded-lg">
                    <div className="text-xl font-bold text-red-500">{stats.absent}</div>
                    <div className="text-xs text-muted-foreground">Absent</div>
                  </div>
                  <div className="flex flex-col items-center justify-center bg-amber-50 p-3 rounded-lg">
                    <div className="text-xl font-bold text-amber-500">{stats.late}</div>
                    <div className="text-xs text-muted-foreground">Late</div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={saveAttendance}
                className="w-full neo-button"
                disabled={saving || !classTitle}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Attendance
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle>Student Attendance</CardTitle>
              <CardDescription>Mark attendance status for each student</CardDescription>
              <div className="flex items-center justify-between gap-2 mt-4">
                <div className="relative flex-1">
                  <Input
                    placeholder="Search by name or roll number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                </div>
                <div className="flex items-center gap-2">
                  <AddStudentDialog />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={markAllPresent}
                    className="whitespace-nowrap"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Mark All Present
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="border-b divide-y max-h-[500px] overflow-y-auto hide-scrollbar">
                {loadingStudents ? (
                  <div className="flex items-center justify-center p-6">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="text-center p-6 text-muted-foreground">
                    {searchQuery ? 'No students found matching your search.' : 'No students found. Add a student to get started.'}
                  </div>
                ) : (
                  filteredStudents.map(student => {
                    const studentAttendance = attendance.find(a => a.studentId === student.id);
                    const status = studentAttendance?.status || 'present';
                    
                    return (
                      <div 
                        key={student.id} 
                        className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="font-semibold">{student.name.charAt(0)}</span>
                          </div>
                          <div>
                            <h4 className="font-medium">{student.name}</h4>
                            <p className="text-xs text-muted-foreground">{student.rollNumber}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "neo-button", 
                              status === 'present' && "bg-blue-100 text-blue-700 hover:bg-blue-200"
                            )}
                            onClick={() => updateStatus(student.id, 'present')}
                          >
                            <CheckCircle2 size={18} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "neo-button", 
                              status === 'absent' && "bg-red-100 text-red-700 hover:bg-red-200"
                            )}
                            onClick={() => updateStatus(student.id, 'absent')}
                          >
                            <XCircle size={18} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "neo-button", 
                              status === 'late' && "bg-amber-100 text-amber-700 hover:bg-amber-200"
                            )}
                            onClick={() => updateStatus(student.id, 'late')}
                          >
                            <Clock size={18} />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default AttendancePage;
