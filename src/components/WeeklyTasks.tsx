import { useState, useEffect, FormEvent } from 'react';
import { collection, onSnapshot, query, addDoc, updateDoc, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Plus, Trash2, Calendar as CalendarIcon, CheckCircle2, Layers } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

import { motion, AnimatePresence } from 'motion/react';

export default function WeeklyTasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [newTask, setNewTask] = useState({ title: '', clientId: '', date: format(new Date(), 'yyyy-MM-dd') });
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  useEffect(() => {
    const unsubTasks = onSnapshot(query(collection(db, 'tasks'), orderBy('date', 'asc')), (snap) => {
      setTasks(snap.docs.map(t => ({ id: t.id, ...t.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'tasks'));
    const unsubClients = onSnapshot(collection(db, 'clients'), (snap) => {
      setClients(snap.docs.map(c => ({ id: c.id, ...c.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'clients'));
    return () => {
      unsubTasks();
      unsubClients();
    };
  }, []);

  const handleAddTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTask.title || !newTask.clientId) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'tasks'), {
        ...newTask,
        status: 'pending'
      });
      setNewTask({ ...newTask, title: '' });
      setSuccessMessage('Arte agendada!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'tasks');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTask = async (id: string, currentStatus: string) => {
    try {
      await updateDoc(doc(db, 'tasks', id), {
        status: currentStatus === 'completed' ? 'pending' : 'completed'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${id}`);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `tasks/${id}`);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <AnimatePresence>
        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-black text-white px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] shadow-2xl"
          >
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="glass-card">
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6 font-mono">AGENDAR NOVA ARTE</h3>
        <form onSubmit={handleAddTask} className="flex flex-col lg:flex-row gap-6 items-end">
          <div className="w-full lg:flex-[2.5] space-y-2">
            <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400 ml-1">Título da Arte</label>
            <Input 
              placeholder="Ex: Post de Vendas"
              value={newTask.title}
              onChange={e => setNewTask({...newTask, title: e.target.value})}
              className="bg-zinc-50 border-zinc-100 h-12 rounded-2xl focus:ring-black focus:border-black transition-all text-xs"
            />
          </div>

          <div className="w-full lg:flex-[1.5] space-y-2">
            <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400 ml-1">Cliente</label>
            <Select 
              value={newTask.clientId}
              onValueChange={val => setNewTask({...newTask, clientId: val})}
            >
              <SelectTrigger className="bg-zinc-50 border-zinc-100 h-12 rounded-2xl focus:ring-black focus:border-black transition-all text-xs">
                <SelectValue placeholder="Selecionar..." />
              </SelectTrigger>
              <SelectContent className="glass shadow-2xl border-white/20">
                {clients.length === 0 ? (
                  <div className="p-4 text-[10px] text-center text-zinc-400 font-bold uppercase">Nenhum cliente</div>
                ) : (
                  clients.map(c => (
                    <SelectItem key={c.id} value={c.id} className="text-xs font-medium focus:bg-zinc-900 focus:text-white rounded-lg">{c.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full lg:w-auto bg-zinc-900 text-white hover:bg-black h-12 px-10 rounded-full font-bold uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-black/10 active:scale-95 transition-all flex items-center justify-center">
            {isSubmitting ? 'Agendando...' : 'Agendar'}
          </Button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {days.map((day) => {
          const dayTasks = tasks.filter(t => isSameDay(new Date(t.date + 'T00:00:00'), day));
          const isToday = isSameDay(day, new Date());

          return (
            <div key={day.toString()} className={`flex flex-col gap-3 h-full transition-all duration-500 ${isToday ? 'scale-[1.02] z-10' : 'opacity-80 hover:opacity-100'}`}>
              <div className={`p-4 rounded-2xl glass border-b-4 flex flex-col items-center justify-center ${isToday ? 'bg-black text-white border-black/20 shadow-xl shadow-black/10' : 'bg-white/40 border-white/60 text-zinc-500'}`}>
                <span className="text-[10px] font-bold uppercase tracking-tighter opacity-60">
                  {format(day, 'EEE', { locale: ptBR })}
                </span>
                <span className={`text-xl font-bold ${isToday ? 'text-white' : 'text-zinc-900'}`}>
                  {format(day, 'dd')}
                </span>
              </div>
              
              <div className="flex-1 flex flex-col gap-3">
                {dayTasks.map(task => (
                  <div 
                    key={task.id} 
                    className={`group relative p-4 rounded-2xl glass-card !p-3 border !shadow-none transition-all ${
                      task.status === 'completed' 
                        ? 'opacity-40 grayscale scale-95' 
                        : 'hover:scale-[1.02] hover:-translate-y-1'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <button 
                        onClick={() => toggleTask(task.id, task.status)}
                        className={`mt-1 transition-all ${task.status === 'completed' ? 'text-black scale-110' : 'text-zinc-300 hover:text-black hover:scale-110'}`}
                      >
                        {task.status === 'completed' 
                          ? <CheckCircle2 className="w-4 h-4 fill-black text-white" />
                          : <div className="w-4 h-4 rounded-md border border-zinc-300 transition-all group-hover:border-black" />
                        }
                      </button>
                      <div className="flex-1 min-w-0 pr-4">
                        <p className={`text-[11px] font-bold leading-tight ${task.status === 'completed' ? 'line-through text-zinc-400' : 'text-zinc-900'}`}>
                          {task.title}
                        </p>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mt-1">
                          {clients.find(c => c.id === task.clientId)?.name}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => deleteTask(task.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all text-zinc-300 hover:text-destructive p-1 rounded-lg hover:bg-destructive/10"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {dayTasks.length === 0 && (
                  <div className="flex-1 rounded-2xl border-2 border-dashed border-zinc-200/50 flex items-center justify-center min-h-[100px] opacity-20">
                    <span className="text-[10px] font-bold uppercase tracking-widest rotate-90">Livre</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

