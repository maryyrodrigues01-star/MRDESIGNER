import { useState, useEffect, FormEvent } from 'react';
import { collection, onSnapshot, query, where, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Calendar } from './ui/calendar';
import { COMMON_DATES_2026, CalendarDate, NICHE_DATES_SAMPLES } from '../lib/calendar';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Info, ShoppingBag, PartyPopper, CalendarDays, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function CalendarView() {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth()); // 0-11
  const [niches, setNiches] = useState<any[]>([]);
  const [customDates, setCustomDates] = useState<any[]>([]);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const unsubNiches = onSnapshot(collection(db, 'niches'), (snap) => {
      setNiches(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'niches'));

    const unsubCustom = onSnapshot(collection(db, 'nicheDates'), (snap) => {
      setCustomDates(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'nicheDates'));

    return () => {
      unsubNiches();
      unsubCustom();
    };
  }, []);

  const monthDate = new Date(2026, selectedMonth, 1);

  // Merge all dates
  const allDates: CalendarDate[] = [
    ...COMMON_DATES_2026,
    ...customDates.map(d => ({ ...d, date: new Date(d.date + 'T00:00:00') })),
    // Auto-generate some for niches if they exist in samples
    ...niches.flatMap(niche => {
      const samples = NICHE_DATES_SAMPLES[niche.name] || [];
      return samples.map(s => ({ ...s, nicheId: niche.id }));
    })
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  const currentMonthDates = allDates.filter(d => 
    isSameMonth(d.date, monthDate)
  );

  const getDayIcon = (type: string) => {
    switch (type) {
      case 'commercial': return <ShoppingBag className="w-4 h-4" />;
      case 'commemorative': return <PartyPopper className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const [newCustomDate, setNewCustomDate] = useState({ title: '', date: format(new Date(2026, selectedMonth, 1), 'yyyy-MM-dd'), type: 'important', nicheId: '' });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddCustomDate = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCustomDate.title || !newCustomDate.date || !newCustomDate.nicheId) return;
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'nicheDates'), newCustomDate);
      setNewCustomDate({ ...newCustomDate, title: '' });
      setSuccessMessage('Data salva!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'nicheDates');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
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
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Sidebar Controls */}
        <div className="md:col-span-4 space-y-6">
          <div className="glass-card">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-4">Escolha o Mês</h3>
            <Select 
              value={(selectedMonth + 1).toString()} 
              onValueChange={val => setSelectedMonth(parseInt(val) - 1)}
            >
              <SelectTrigger className="bg-white/50 border-white/20 h-14 rounded-2xl text-2xl font-bold text-zinc-900 w-20">
                <span>{selectedMonth + 1}</span>
              </SelectTrigger>
              <SelectContent className="glass">
                {months.map((m, i) => (
                  <SelectItem key={i} value={(i + 1).toString()} className="font-bold uppercase text-[10px] tracking-widest">{i + 1} - {m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="glass-card">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-6 font-mono">CADASTRAR DATA</h3>
            <form onSubmit={handleAddCustomDate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Título</label>
                <Input 
                  placeholder="Ex: Lançamento Verão"
                  required
                  value={newCustomDate.title}
                  onChange={e => setNewCustomDate({...newCustomDate, title: e.target.value})}
                  className="bg-zinc-50 border-zinc-100 h-11 rounded-xl text-xs font-medium focus:ring-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Data</label>
                  <Input 
                    type="date"
                    required
                    value={newCustomDate.date}
                    onChange={e => setNewCustomDate({...newCustomDate, date: e.target.value})}
                    className="bg-zinc-50 border-zinc-100 h-11 rounded-xl text-[10px] font-bold uppercase focus:ring-black"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Tipo</label>
                  <Select 
                    value={newCustomDate.type}
                    onValueChange={val => setNewCustomDate({...newCustomDate, type: val})}
                  >
                    <SelectTrigger className="bg-zinc-50 border-zinc-100 h-11 rounded-xl text-[9px] font-bold uppercase focus:ring-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass">
                      <SelectItem value="commercial" className="text-[9px] font-bold uppercase">Comercial</SelectItem>
                      <SelectItem value="commemorative" className="text-[9px] font-bold uppercase">Comemorativa</SelectItem>
                      <SelectItem value="important" className="text-[9px] font-bold uppercase">Estratégica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Nicho</label>
                <div className="relative">
                  <Input 
                    list="niche-options-cal"
                    placeholder="Selecione o Nicho" 
                    required
                    value={newCustomDate.nicheId}
                    onChange={e => setNewCustomDate({...newCustomDate, nicheId: e.target.value})}
                    className="bg-zinc-50 border-zinc-100 h-11 rounded-xl text-xs font-medium focus:ring-black"
                  />
                  <datalist id="niche-options-cal">
                    {niches.map(n => (
                      <option key={n.id} value={n.name} />
                    ))}
                  </datalist>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-zinc-900 text-white hover:bg-black h-12 rounded-full font-bold uppercase tracking-[0.2em] text-[9px] transition-all disabled:opacity-50 flex items-center justify-center shadow-xl shadow-black/10"
              >
                {isSubmitting ? 'Salvando...' : 'Salvar Data'}
              </Button>
            </form>
          </div>
        </div>

        {/* Dynamic Event List */}
        <div className="md:col-span-8">
          <div className="glass-card min-h-[600px] flex flex-col p-0 overflow-hidden">
            <div className="p-10 border-b border-white/20 bg-white/30 flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-bold uppercase tracking-tighter text-zinc-900">{months[selectedMonth]}</h2>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400 mt-2">Cronograma Estratégico 2026</p>
              </div>
              <div className="flex gap-4">
                 <div className="w-16 h-16 bg-zinc-900 flex flex-col items-center justify-center rounded-2xl text-white">
                    <span className="text-xl font-light">{currentMonthDates.length}</span>
                    <span className="text-[8px] font-bold uppercase opacity-50">Datas</span>
                 </div>
              </div>
            </div>

            <div className="p-8">
              {currentMonthDates.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {currentMonthDates.map((d, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="group p-6 glass-card !p-6 border border-white/40 hover:bg-black hover:text-white hover:border-black hover:scale-[1.02] transition-all duration-500 cursor-default"
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-14 h-14 bg-zinc-50 rounded-[1.2rem] flex flex-col items-center justify-center group-hover:bg-white/10 transition-colors text-zinc-900">
                          <span className="text-xl font-bold leading-none">{format(d.date, 'dd')}</span>
                          <span className="text-[8px] font-bold uppercase tracking-tighter opacity-40">{format(d.date, 'EEE', { locale: ptBR })}</span>
                        </div>
                        <div className="p-2 glass rounded-xl opacity-20 group-hover:opacity-100 group-hover:bg-white/10 transition-all">
                          {getDayIcon(d.type)}
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <h4 className="font-bold text-sm uppercase tracking-tight leading-tight group-hover:translate-x-1 transition-transform">{d.title}</h4>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-wider border-zinc-200 px-3 py-1.5 rounded-full group-hover:border-white/30 group-hover:text-white/70 w-fit">
                            {d.type === 'commercial' ? 'Comercial' : d.type === 'commemorative' ? 'Comemorativa' : 'Estratégica'}
                          </Badge>
                          {d.nicheId && (
                            <span className="text-[8px] font-bold uppercase text-zinc-400 group-hover:text-zinc-300">
                               {niches.find(n => n.id === d.nicheId)?.name || d.nicheId}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-400 group-hover:text-zinc-500 font-medium">Inicie artes de varejo {format(new Date(d.date.getTime() - 7 * 24 * 60 * 60 * 1000), 'dd/MM')}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-40 text-center opacity-10 space-y-6">
                  <CalendarDays className="w-24 h-24 stroke-[0.5px]" />
                  <p className="text-sm font-bold uppercase tracking-[0.5em]">Sem eventos no radar</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
