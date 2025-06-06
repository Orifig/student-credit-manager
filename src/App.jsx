import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, Users, BookOpen, Edit3, Save, X, Upload, User, Search, MoreVertical, Award, TrendingUp, Eye, Trash2, Settings } from 'lucide-react';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Only create Supabase client if credentials exist
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export default function StudentCreditManager() {
  // Initial mock data for demo/fallback
  const initialStudents = [
    { id: 1, name: "Alice Johnson", class: "Computer Science", credits: 24, created_at: "2024-09-01", status: "active" },
    { id: 2, name: "Bob Smith", class: "Mathematics", credits: 18, created_at: "2024-09-01", status: "active" },
    { id: 3, name: "Carol Davis", class: "Physics", credits: 21, created_at: "2024-09-01", status: "active" },
    { id: 4, name: "David Wilson", class: "Computer Science", credits: 27, created_at: "2024-09-01", status: "active" },
    { id: 5, name: "Emma Brown", class: "Biology", credits: 15, created_at: "2024-09-01", status: "active" },
    { id: 6, name: "Frank Miller", class: "Chemistry", credits: 30, created_at: "2024-09-01", status: "active" }
  ];

  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [creditChange, setCreditChange] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [editingStudent, setEditingStudent] = useState(null);
  const [editName, setEditName] = useState('');
  const [editClass, setEditClass] = useState('');
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

  // Load students on mount
  useEffect(() => {
    loadStudents();
  }, []);

  // Filter students
  useEffect(() => {
    let filtered = [...students];

    if (searchQuery) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.class.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedClass) {
      filtered = filtered.filter(student => student.class === selectedClass);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'credits':
          return b.credits - a.credits;
        case 'class':
          return a.class.localeCompare(b.class);
        default:
          return 0;
      }
    });

    setFilteredStudents(filtered);
  }, [students, searchQuery, selectedClass, sortBy]);

  // Load students from Supabase or use mock data
  const loadStudents = async () => {
    setLoading(true);
    try {
      if (supabase) {
        const { data, error } = await supabase.from('students').select('*');
        if (!error && data) {
          setStudents(data);
          setIsSupabaseConnected(true);
          console.log('✅ Supabase connected successfully');
        } else {
          console.log('⚠️ Supabase error, using mock data:', error?.message);
          setStudents(initialStudents);
          setIsSupabaseConnected(false);
        }
      } else {
        console.log('⚠️ Supabase not configured, using mock data');
        setStudents(initialStudents);
        setIsSupabaseConnected(false);
      }
    } catch (err) {
      console.log('⚠️ Supabase connection failed, using mock data:', err.message);
      setStudents(initialStudents);
      setIsSupabaseConnected(false);
    }
    setLoading(false);
  };

  // Helper functions
  const generateId = () => Date.now() + Math.random();

  const handleBulkAdd = async () => {
    if (!bulkText.trim()) return;
    
    setLoading(true);
    const lines = bulkText.trim().split('\n');
    const newStudents = [];
    
    lines.forEach(line => {
      const [name, className] = line.split(',').map(s => s.trim());
      if (name && className) {
        newStudents.push({
          id: generateId(),
          name,
          class: className,
          credits: 0,
          status: 'active',
          created_at: new Date().toISOString()
        });
      }
    });
    
    if (newStudents.length > 0) {
      try {
        if (supabase && isSupabaseConnected) {
          const { error } = await supabase.from('students').insert(newStudents.map(s => ({ ...s, id: undefined })));
          if (!error) {
            await loadStudents();
            console.log('✅ Students added to Supabase');
          } else {
            setStudents(prev => [...prev, ...newStudents]);
            console.log('⚠️ Supabase insert failed, added locally:', error.message);
          }
        } else {
          setStudents(prev => [...prev, ...newStudents]);
          console.log('📝 Students added locally (Supabase not connected)');
        }
      } catch (err) {
        setStudents(prev => [...prev, ...newStudents]);
        console.log('⚠️ Database error, added locally:', err.message);
      }
      setBulkText('');
      setShowBulkAdd(false);
    }
    setLoading(false);
  };

  const updateCredits = async (studentId, change) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    
    const newCredits = Math.max(0, student.credits + change);
    
    try {
      if (supabase && isSupabaseConnected) {
        const { error } = await supabase
          .from('students')
          .update({ credits: newCredits })
          .eq('id', studentId);
        
        if (!error) {
          await loadStudents();
          console.log('✅ Credits updated in Supabase');
        } else {
          updateStudentsLocally(studentId, { credits: newCredits });
          console.log('⚠️ Supabase update failed, updated locally:', error.message);
        }
      } else {
        updateStudentsLocally(studentId, { credits: newCredits });
        console.log('📝 Credits updated locally');
      }
    } catch (err) {
      updateStudentsLocally(studentId, { credits: newCredits });
      console.log('⚠️ Database error, updated locally:', err.message);
    }
    
    if (selectedStudent?.id === studentId) {
      setSelectedStudent(prev => ({ ...prev, credits: newCredits }));
    }
  };

  const updateStudentsLocally = (studentId, updates) => {
    setStudents(prev => prev.map(student => 
      student.id === studentId ? { ...student, ...updates } : student
    ));
  };

  const deleteStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    
    try {
      if (supabase && isSupabaseConnected) {
        const { error } = await supabase.from('students').delete().eq('id', studentId);
        if (!error) {
          await loadStudents();
          console.log('✅ Student deleted from Supabase');
        } else {
          setStudents(prev => prev.filter(s => s.id !== studentId));
          console.log('⚠️ Supabase delete failed, deleted locally:', error.message);
        }
      } else {
        setStudents(prev => prev.filter(s => s.id !== studentId));
        console.log('📝 Student deleted locally');
      }
    } catch (err) {
      setStudents(prev => prev.filter(s => s.id !== studentId));
      console.log('⚠️ Database error, deleted locally:', err.message);
    }
    
    if (selectedStudent?.id === studentId) {
      setCurrentView('dashboard');
      setSelectedStudent(null);
    }
  };

  const handleEditStudent = async (studentId, newName, newClass) => {
    try {
      if (supabase && isSupabaseConnected) {
        const { error } = await supabase
          .from('students')
          .update({ name: newName, class: newClass })
         .eq('id', studentId);
       
       if (!error) {
         await loadStudents();
         console.log('✅ Student updated in Supabase');
       } else {
         updateStudentsLocally(studentId, { name: newName, class: newClass });
         console.log('⚠️ Supabase update failed, updated locally:', error.message);
       }
     } else {
       updateStudentsLocally(studentId, { name: newName, class: newClass });
       console.log('📝 Student updated locally');
     }
   } catch (err) {
     updateStudentsLocally(studentId, { name: newName, class: newClass });
     console.log('⚠️ Database error, updated locally:', err.message);
   }
   
   if (selectedStudent?.id === studentId) {
     setSelectedStudent(prev => ({ ...prev, name: newName, class: newClass }));
   }
 };

 const startEditing = (student) => {
   setEditingStudent(student.id);
   setEditName(student.name);
   setEditClass(student.class);
 };

 const saveEdit = () => {
   if (editingStudent && editName.trim() && editClass.trim()) {
     handleEditStudent(editingStudent, editName.trim(), editClass.trim());
     setEditingStudent(null);
     setEditName('');
     setEditClass('');
   }
 };

 const cancelEdit = () => {
   setEditingStudent(null);
   setEditName('');
   setEditClass('');
 };

 const handleCreditSubmit = () => {
   if (!selectedStudent || !creditChange) return;
   const change = parseInt(creditChange);
   if (!isNaN(change)) {
     updateCredits(selectedStudent.id, change);
     setCreditChange('');
   }
 };

 const getUniqueClasses = () => {
   return [...new Set(students.map(s => s.class))];
 };

 const getStats = () => {
   const totalStudents = students.length;
   const totalCredits = students.reduce((sum, s) => sum + s.credits, 0);
   const averageCredits = totalStudents ? Math.round(totalCredits / totalStudents) : 0;
   const topPerformer = students.reduce((top, student) => 
     student.credits > (top?.credits || 0) ? student : top, null
   );

   return { totalStudents, totalCredits, averageCredits, topPerformer };
 };

 const stats = getStats();

 // Clean Student Card Component
 const StudentCard = ({ student }) => (
   <div className="glass-card rounded-2xl p-8 card-hover relative">
     {editingStudent === student.id ? (
       <div className="space-y-6">
         <input
           type="text"
           value={editName}
           onChange={(e) => setEditName(e.target.value)}
           className="w-full"
           placeholder="Student name"
         />
         <input
           type="text"
           value={editClass}
           onChange={(e) => setEditClass(e.target.value)}
           className="w-full"
           placeholder="Class name"
         />
         <div className="flex space-x-4">
           <button
             onClick={saveEdit}
             className="flex-1 bg-green-600 text-white py-3 px-6 rounded-xl hover:bg-green-700 flex items-center justify-center space-x-2"
           >
             <Save className="w-4 h-4" />
             <span>Save</span>
           </button>
           <button
             onClick={cancelEdit}
             className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-xl hover:bg-gray-700"
           >
             Cancel
           </button>
         </div>
       </div>
     ) : (
       <div className="flex items-center justify-between">
         <div 
           className="flex items-center space-x-6 cursor-pointer flex-1"
           onClick={() => {
             setSelectedStudent(student);
             setCurrentView('student');
           }}
         >
           <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
             <User className="w-8 h-8 text-white" />
           </div>
           <div className="min-w-0 flex-1">
             <h3 className="text-xl font-bold text-white mb-2 truncate hover:text-blue-600 transition-colors">
               {student.name}
             </h3>
             <p className="text-gray-400 truncate">{student.class}</p>
           </div>
         </div>
         
         <div className="flex items-center space-x-6">
           <div className="text-right">
             <div className="text-3xl font-bold text-blue-600">{student.credits}</div>
             <div className="text-sm text-gray-400">credits</div>
           </div>
           
           <div className="relative">
             <button
               onClick={(e) => {
                 e.stopPropagation();
                 // Close all other dropdowns first
                 document.querySelectorAll('.dropdown-menu').forEach(menu => menu.classList.add('hidden'));
                 // Toggle current dropdown
                 const menu = e.currentTarget.nextElementSibling;
                 menu.classList.toggle('hidden');
               }}
               className="p-3 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-all"
             >
               <MoreVertical className="w-5 h-5" />
             </button>
             <div className="dropdown-menu hidden absolute right-0 mt-2 w-56 glass-card rounded-xl shadow-xl z-20 overflow-hidden">
               <button
                 onClick={(e) => {
                   e.stopPropagation();
                   startEditing(student);
                   e.currentTarget.closest('.dropdown-menu').classList.add('hidden');
                 }}
                 className="w-full text-left px-6 py-4 text-sm hover:bg-white/10 flex items-center space-x-3 transition-all text-white"
               >
                 <Edit3 className="w-4 h-4" />
                 <span>Edit Student</span>
               </button>
               <button
                 onClick={(e) => {
                   e.stopPropagation();
                   setSelectedStudent(student);
                   setCurrentView('student');
                   e.currentTarget.closest('.dropdown-menu').classList.add('hidden');
                 }}
                 className="w-full text-left px-6 py-4 text-sm hover:bg-white/10 flex items-center space-x-3 transition-all text-white"
               >
                 <Eye className="w-4 h-4" />
                 <span>View Details</span>
               </button>
               <button
                 onClick={(e) => {
                   e.stopPropagation();
                   deleteStudent(student.id);
                   e.currentTarget.closest('.dropdown-menu').classList.add('hidden');
                 }}
                 className="w-full text-left px-6 py-4 text-sm text-red-400 hover:bg-red-500/10 flex items-center space-x-3 transition-all"
               >
                 <Trash2 className="w-4 h-4" />
                 <span>Delete Student</span>
               </button>
             </div>
           </div>
         </div>
       </div>
     )}
   </div>
 );

 // Student Detail View
 if (currentView === 'student' && selectedStudent) {
   return (
     <div className="min-h-screen">
       <div className="container mx-auto px-8 py-12">
         <div className="space-y-12">
           {/* Header */}
           <div className="flex items-center space-x-8">
             <button
               onClick={() => {
                 setCurrentView('dashboard');
                 setSelectedStudent(null);
               }}
               className="glass-card p-4 rounded-xl hover:shadow-lg transition-all text-white"
             >
               ← Back
             </button>
             <div className="flex items-center space-x-6">
               <div className="w-24 h-24 bg-blue-600 rounded-2xl flex items-center justify-center">
                 <User className="w-12 h-12 text-white" />
               </div>
               <div>
                 <h1 className="text-4xl font-bold text-white mb-2">{selectedStudent.name}</h1>
                 <p className="text-xl text-gray-400">{selectedStudent.class}</p>
               </div>
             </div>
           </div>

           {/* Credit Management */}
           <div className="glass-card-dark rounded-2xl p-12">
             <div className="text-center mb-12">
               <div className="text-8xl font-bold gradient-text mb-6">
                 {selectedStudent.credits}
               </div>
               <div className="text-xl text-gray-400">Total Credits</div>
             </div>

             {/* Quick Actions */}
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
               <button
                 onClick={() => updateCredits(selectedStudent.id, 1)}
                 className="bg-green-50 py-6 px-8 rounded-2xl font-bold transition-all hover:scale-105 border-2"
               >
                 +1 Credit
               </button>
               <button
                 onClick={() => updateCredits(selectedStudent.id, 5)}
                 className="bg-blue-50 py-6 px-8 rounded-2xl font-bold transition-all hover:scale-105 border-2"
               >
                 +5 Credits
               </button>
               <button
                 onClick={() => updateCredits(selectedStudent.id, 10)}
                 className="bg-purple-50 py-6 px-8 rounded-2xl font-bold transition-all hover:scale-105 border-2"
               >
                 +10 Credits
               </button>
               <button
                 onClick={() => updateCredits(selectedStudent.id, -1)}
                 className="bg-red-50 py-6 px-8 rounded-2xl font-bold transition-all hover:scale-105 border-2"
               >
                 -1 Credit
               </button>
             </div>

             {/* Custom Credit Change */}
             <div className="border-t border-white/20 pt-8">
               <h3 className="text-xl font-bold text-white mb-6">Custom Credit Adjustment</h3>
               <div className="flex space-x-6">
                 <input
                   type="number"
                   value={creditChange}
                   onChange={(e) => setCreditChange(e.target.value)}
                   placeholder="Enter amount (+/-)"
                   className="flex-1"
                 />
                 <button
                   onClick={handleCreditSubmit}
                   className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center space-x-3"
                 >
                   <Save className="w-5 h-5" />
                   <span>Apply</span>
                 </button>
               </div>
             </div>
           </div>
         </div>
       </div>
     </div>
   );
 }

 // Main Dashboard
 return (
   <div className="min-h-screen">
     <div className="container mx-auto px-8 py-12">
       <div className="space-y-12">
         {/* Header with Supabase status */}
         <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
           <div>
             <h1 className="text-4xl lg:text-6xl font-bold gradient-text mb-4">Student Dashboard</h1>
             <div className="flex items-center space-x-4">
               <p className="text-xl text-gray-400">Manage and track student progress</p>
               <div className="flex items-center space-x-2">
                 <div className={`w-3 h-3 rounded-full ${isSupabaseConnected ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}></div>
                 <span className="text-sm text-gray-400">
                   {isSupabaseConnected ? 'Database Connected' : 'Demo Mode'}
                 </span>
               </div>
             </div>
           </div>
           <div className="flex items-center space-x-6">
             <button
               onClick={() => setShowBulkAdd(true)}
               className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 transition-all hover:scale-105 flex items-center space-x-3"
             >
               <Plus className="w-5 h-5" />
               <span>Add Students</span>
             </button>
             <button className="glass-card p-4 rounded-xl transition-all text-white">
               <Settings className="w-6 h-6" />
             </button>
           </div>
         </div>

         {/* Stats */}
         <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
           <div className="glass-card rounded-2xl p-8 card-hover">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm font-bold text-gray-400 mb-2 uppercase">Total Students</p>
                 <p className="text-3xl font-bold text-white">{stats.totalStudents}</p>
               </div>
               <Users className="w-8 h-8 text-blue-600" />
             </div>
           </div>
           
           <div className="glass-card rounded-2xl p-8 card-hover">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm font-bold text-gray-400 mb-2 uppercase">Total Credits</p>
                 <p className="text-3xl font-bold text-white">{stats.totalCredits}</p>
               </div>
               <BookOpen className="w-8 h-8 text-green-600" />
             </div>
           </div>
           
           <div className="glass-card rounded-2xl p-8 card-hover">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm font-bold text-gray-400 mb-2 uppercase">Average</p>
                 <p className="text-3xl font-bold text-white">{stats.averageCredits}</p>
               </div>
               <TrendingUp className="w-8 h-8 text-purple-600" />
             </div>
           </div>
           
           <div className="glass-card rounded-2xl p-8 card-hover">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm font-bold text-gray-400 mb-2 uppercase">Top Performer</p>
                 <p className="text-3xl font-bold text-white">{stats.topPerformer?.name?.split(' ')[0] || 'N/A'}</p>
               </div>
               <Award className="w-8 h-8 text-yellow-600" />
             </div>
           </div>
         </div>

         {/* Search */}
         <div className="glass-card rounded-2xl p-8">
           <div className="flex flex-col lg:flex-row lg:items-center space-y-6 lg:space-y-0 lg:space-x-6">
             <div className="flex-1 relative">
               <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
               <input
                 type="text"
                 placeholder="Search students..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="pl-16"
               />
             </div>
             <div className="flex space-x-4">
               <select
                 value={selectedClass}
                 onChange={(e) => setSelectedClass(e.target.value)}
                 className="min-w-[200px]"
               >
                 <option value="">All Classes</option>
                 {getUniqueClasses().map(cls => (
                   <option key={cls} value={cls}>{cls}</option>
                 ))}
               </select>
               <select
                 value={sortBy}
                 onChange={(e) => setSortBy(e.target.value)}
                 className="min-w-[200px]"
               >
                 <option value="name">Sort by Name</option>
                 <option value="credits">Sort by Credits</option>
                 <option value="class">Sort by Class</option>
               </select>
             </div>
           </div>
         </div>

         {/* Students Grid */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {filteredStudents.map(student => (
             <StudentCard key={student.id} student={student} />
           ))}
         </div>

         {filteredStudents.length === 0 && (
           <div className="text-center py-20">
             <div className="glass-card w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8">
               <Users className="w-12 h-12 text-gray-400" />
             </div>
             <h3 className="text-2xl font-bold text-white mb-4">No students found</h3>
             <p className="text-gray-400 mb-8">Try adjusting your search or add some students</p>
           </div>
         )}
       </div>

       {/* Bulk Add Modal */}
       {showBulkAdd && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
           <div className="glass-card-dark rounded-2xl p-8 max-w-3xl w-full">
             <div className="flex justify-between items-center mb-8">
               <div>
                 <h2 className="text-3xl font-bold text-white mb-2">Add Students</h2>
                 <p className="text-gray-400">Bulk import students to your system</p>
               </div>
               <button
                 onClick={() => setShowBulkAdd(false)}
                 className="p-3 hover:bg-white/10 rounded-xl transition-all text-gray-400"
               >
                 <X className="w-6 h-6" />
               </button>
             </div>
             
             <div className="space-y-8">
               <div>
                 <label className="block text-lg font-bold text-white mb-4">
                   Student Information
                 </label>
                 <div className="mb-6 p-6 bg-blue-500/10 rounded-xl border border-blue-500/20">
                   <p className="text-blue-400 mb-2">Format: Student Name, Class Name</p>
                   <p className="text-sm text-gray-400">Example: John Doe, Computer Science</p>
                 </div>
                 <textarea
                   value={bulkText}
                   onChange={(e) => setBulkText(e.target.value)}
                   placeholder="John Doe, Computer Science&#10;Jane Smith, Mathematics"
                   className="h-48 resize-none font-mono"
                 />
                 <div className="mt-3 text-gray-400">
                   {bulkText.trim().split('\n').filter(line => line.includes(',')).length} students ready to import
                 </div>
               </div>
               
               <div className="flex space-x-6">
                 <button
                   onClick={() => setShowBulkAdd(false)}
                   className="flex-1 px-8 py-4 border-2 border-gray-600 text-gray-400 rounded-xl hover:bg-gray-600/20 transition-all font-bold"
                 >
                   Cancel
                 </button>
                 <button
                   onClick={handleBulkAdd}
                   disabled={!bulkText.trim() || loading}
                   className="flex-1 bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition-all font-bold disabled:opacity-50 flex items-center justify-center space-x-3"
                 >
                   {loading ? (
                     <>
                       <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                       <span>Adding...</span>
                     </>
                   ) : (
                     <>
                       <Upload className="w-5 h-5" />
                       <span>Add Students</span>
                     </>
                   )}
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}
     </div>
   </div>
 );
}