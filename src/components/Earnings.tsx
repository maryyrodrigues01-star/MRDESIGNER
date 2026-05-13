import { useState, useEffect, FormEvent } from 'react';
import { collection, onSnapshot, query, addDoc, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { format, startOfMonth, endOfMonth, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DollarSign, Plus, Trash2, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

export default function Earnings() {
  const [earnings, setEarnings] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [newEarning, setNewEarning] = useState({ artName: '', value: '', date: format(new Date(), 'yyyy-MM-dd'), clientId: '' });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsubEarnings = onSnapshot(query(collection(db, 'earnings'), orderBy('date', 'desc')), (snap) => {
      setEarnings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'earnings'));
    const unsubClients = onSnapshot(collection(db, 'clients'), (snap) => {
      setClients(snap.docs.map(c => ({ id: c.id, ...c.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'clients'));
    return () => {
      unsubEarnings();
      unsubClients();
    };
  }, []);

  const handleAddEarning = async (e: FormEvent) => {
    e.preventDefault();
    if (!newEarning.artName || !newEarning.value || !newEarning.date) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'earnings'), {
        ...newEarning,
        value: parseFloat(newEarning.value)
      });
      setNewEarning({ ...newEarning, artName: '', value: '' });
      setSuccessMessage('Venda registrada!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'earnings');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEarning = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'earnings', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `earnings/${id}`);
    }
  };

  const monthlyTotal = earnings
    .filter(e => isSameMonth(new Date(e.date + 'T00:00:00'), currentMonth))
    .reduce((acc, curr) => acc + curr.value, 0);

  const chartData = earnings
    .filter(e => isSameMonth(new Date(e.date + 'T00:00:00'), currentMonth))
    .reduce((acc: any[], curr) => {
      const date = format(new Date(curr.date + 'T00:00:00'), 'dd');
      const existing = acc.find(a => a.date === date);
      if (existing) {
        existing.value += curr.value;
      } else {
        acc.push({ date, value: curr.value });
      }
      return acc;
    }, [])
    .sort((a, b) => parseInt(a.date) - parseInt(b.date));

  return (
    <div className="space-y-10 animate-in fade-in zoom-in-95 duration-1000">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 glass-card flex flex-col justify-between overflow-hidden relative group !bg-zinc-900 !text-white border-none shadow-2xl shadow-black/20">
           <div className="absolute -right-10 -top-10 w-40 h-40 bg-white rounded-full opacity-[0.03] group-hover:scale-110 transition-transform duration-1000"></div>
           <div className="relative z-10">
             <h3 className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500 mb-6">Ganhos do Mês</h3>
             <p className="text-4xl font-light tracking-tighter text-white">
               {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthlyTotal)}
             </p>
             <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-2">
                Meta: R$ 10.000,00
             </p>
           </div>
           
           <div className="mt-8 pt-8 border-t border-white/5 relative z-10">
             <div className="flex justify-between items-end mb-2">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Progresso</span>
                <span className="text-xs font-bold text-white">{Math.round((monthlyTotal / 10000) * 100)}%</span>
             </div>
             <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${Math.min((monthlyTotal / 10000) * 100, 100)}%` }}
                   className="h-full bg-white rounded-full transition-all duration-1000"
                />
             </div>
           </div>
        </div>

        <div className="md:col-span-2 glass-card">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6 font-mono">REGISTRAR NOVA VENDA</h3>
          <form onSubmit={handleAddEarning} className="flex flex-col xl:flex-row gap-4 items-end justify-between">
            <div className="w-full xl:flex-[2.5] space-y-2">
              <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400 ml-1">Nome da Arte</label>
              <Input 
                placeholder="Ex: Identidade Visual"
                value={newEarning.artName}
                onChange={e => setNewEarning({...newEarning, artName: e.target.value})}
                className="bg-zinc-50 border-zinc-100 h-12 rounded-2xl focus:ring-black focus:border-black transition-all text-xs"
              />
            </div>
            
            <div className="w-full xl:w-28 space-y-2">
              <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400 ml-1">Valor</label>
              <Input 
                placeholder="R$ 0,00"
                type="number"
                step="0.01"
                value={newEarning.value}
                onChange={e => setNewEarning({...newEarning, value: e.target.value})}
                className="bg-zinc-50 border-zinc-100 h-12 rounded-2xl focus:ring-black focus:border-black transition-all text-xs font-mono"
              />
            </div>

            <div className="w-full xl:w-36 space-y-2">
              <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400 ml-1">Data</label>
              <Input 
                type="date"
                value={newEarning.date}
                onChange={e => setNewEarning({...newEarning, date: e.target.value})}
                className="bg-zinc-50 border-zinc-100 h-12 rounded-2xl focus:ring-black focus:border-black transition-all uppercase text-[10px] font-bold"
              />
            </div>

            <div className="w-full xl:w-48 space-y-2">
              <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400 ml-1">Cliente</label>
              <Select 
                value={newEarning.clientId}
                onValueChange={val => setNewEarning({...newEarning, clientId: val})}
              >
                <SelectTrigger className="bg-zinc-50 border-zinc-100 h-12 rounded-2xl focus:ring-black focus:border-black transition-all text-xs">
                  <SelectValue placeholder="Selecionar..." />
                </SelectTrigger>
                <SelectContent className="glass shadow-2xl border-white/20">
                  {clients.length === 0 ? (
                    <div className="p-4 text-[10px] text-center text-zinc-400 font-bold uppercase">Nenhum cliente cadastrado</div>
                  ) : (
                    clients.map(c => (
                      <SelectItem key={c.id} value={c.id} className="text-xs font-medium focus:bg-zinc-900 focus:text-white rounded-lg">{c.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full xl:w-auto bg-zinc-900 text-white hover:bg-black h-12 px-10 rounded-full font-bold uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-black/10 active:scale-95 transition-all flex items-center justify-center">
               {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-8">Fluxo Semanal</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" opacity={0.5} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#A1A1AA', fontWeight: 'bold' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#A1A1AA', fontWeight: 'bold' }}
                  tickFormatter={val => `R$${val}`}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)' }}
                />
                <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={20}>
                  {chartData.map((_entry:any, index:number) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#18181b' : '#d4d4d8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-8">Relatório Detalhado</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b-zinc-100/50 hover:bg-transparent">
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Data</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Arte</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Cliente</TableHead>
                  <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest text-zinc-400">Valor</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {earnings
                  .filter(e => isSameMonth(new Date(e.date + 'T00:00:00'), currentMonth))
                  .map(earning => (
                  <TableRow key={earning.id} className="border-b-zinc-100/50 hover:bg-zinc-50/50 transition-colors group">
                    <TableCell className="text-[10px] font-bold text-zinc-400">
                      {format(new Date(earning.date + 'T00:00:00'), 'dd/MM')}
                    </TableCell>
                    <TableCell className="font-bold text-sm text-zinc-900 tracking-tight">{earning.artName}</TableCell>
                    <TableCell>
                       <span className="text-[9px] font-bold uppercase tracking-widest bg-zinc-100 px-3 py-1 rounded-full text-zinc-500 truncate max-w-[100px] border border-zinc-200/50 inline-flex items-center justify-center">
                        {clients.find(c => c.id === earning.clientId)?.name}
                       </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-bold">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(earning.value)}
                    </TableCell>
                    <TableCell className="text-right">
                      <button 
                        onClick={() => handleDeleteEarning(earning.id)}
                        className="text-zinc-200 hover:text-black transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}

