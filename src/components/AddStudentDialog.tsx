
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useStudents } from '@/lib/attendance-service';

const AddStudentDialog = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { addStudent, students } = useStudents();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter the student's name",
        variant: "destructive",
      });
      return;
    }
    
    if (!rollNumber.trim()) {
      toast({
        title: "Roll number required",
        description: "Please enter a roll number",
        variant: "destructive",
      });
      return;
    }
    
    // Check for duplicate roll numbers
    const isDuplicate = students.some(
      (student) => student.rollNumber.toLowerCase() === rollNumber.toLowerCase()
    );
    
    if (isDuplicate) {
      toast({
        title: "Duplicate roll number",
        description: "This roll number is already in use",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      await addStudent({ name, rollNumber });
      
      toast({
        title: "Student added",
        description: `${name} has been added to the system`,
      });
      
      // Reset form and close dialog
      setName('');
      setRollNumber('');
      setOpen(false);
    } catch (error) {
      toast({
        title: "Failed to add student",
        description: "There was an error adding the student",
        variant: "destructive",
      });
      console.error('Error adding student:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <PlusCircle className="h-4 w-4" />
          Add Student
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
          <DialogDescription>
            Enter the details of the new student to add them to the system.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rollNumber">Roll Number</Label>
              <Input
                id="rollNumber"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="e.g. R001"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Student'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddStudentDialog;
