import { useState, useEffect, FormEvent } from 'react';
import { collection, onSnapshot, query, addDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, Trash2, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Clients() {
  const [clients, setClients] = useState<any[]>([]);
  const [niches, setNiches] = useState<any[]>([]);
  const [newClient, setNewClient] = useState({ name: '', instagram: '', phone: '', nicheId: '' });
  const [newNiche, setNewNiche] = useState({ name: '', description: '' });

  useEffect(() => {
    console.log("Setting up client and niche listeners...");
    const qClients = query(collection(db, 'clients'));
    const unsubClients = onSnapshot(qClients, (snap) => {
      console.log("Clients updated. Snap size:", snap.size);
      const clientData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort in memory to avoid index requirements
      clientData.sort((a: any, b: any) => {
        const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
        const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
        return dateB - dateA;
      });
      console.log("Sorted clients:", clientData.length);
      setClients(clientData);
    }, (err) => {
      console.error("Client listener error details:", err);
      handleFirestoreError(err, OperationType.LIST, 'clients');
    });

    const qNiches = query(collection(db, 'niches'));
    const unsubNiches = onSnapshot(qNiches, (snap) => {
      console.log("Niches updated. Snap size:", snap.size);
      setNiches(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'niches');
    });

    return () => {
      unsubClients();
      unsubNiches();
    };
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleAddClient = async (e: FormEvent) => {
    e.preventDefault();
    if (!newClient.name || !newClient.nicheId) return;
    
    setIsSubmitting(true);
    try {
      // Check if niche exists, if not, could create it here but for now we follow the existing pattern
      await addDoc(collection(db, 'clients'), {
        ...newClient,
        createdAt: serverTimestamp()
      });
      setNewClient({ name: '', instagram: '', phone: '', nicheId: '' });
      setSuccessMessage('Cliente cadastrado com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'clients');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNiche = async (e: FormEvent) => {
    e.preventDefault();
    if (!newNiche.name) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'niches'), newNiche);
      setNewNiche({ name: '', description: '' });
      setSuccessMessage('Nicho adicionado!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'niches');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'clients', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `clients/${id}`);
    }
  };

  const handleDeleteNiche = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'niches', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `niches/${id}`);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Niches Section */}
        <div className="glass-card">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6">Nichos de Mercado</h3>
          <div className="space-y-6">
            <form onSubmit={handleAddNiche} className="flex gap-2">
              <Input 
                placeholder="Novo Nicho (ex: Moda)" 
                value={newNiche.name}
                onChange={e => setNewNiche({...newNiche, name: e.target.value})}
                className="bg-white/50 border-white/20 h-12 rounded-xl focus:ring-black/5"
              />
              <Button type="submit" variant="outline" className="shrink-0 aspect-square h-12 rounded-xl border-zinc-200 hover:bg-black hover:text-white transition-all">
                <Plus className="w-4 h-4" />
              </Button>
            </form>
            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {niches.map(niche => (
                  <motion.div 
                    key={niche.id}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="flex items-center gap-2 glass border border-zinc-200 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest group hover:bg-black hover:text-white transition-all"
                  >
                    <span>{niche.name}</span>
                    <button onClick={() => handleDeleteNiche(niche.id)} className="text-zinc-300 group-hover:text-white/50 transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* New Client Form */}
        <div className="glass-card">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6">Cadastro de Cliente</h3>
          <form onSubmit={handleAddClient} className="space-y-4">
            <Input 
              placeholder="Nome do Cliente" 
              required
              value={newClient.name}
              onChange={e => setNewClient({...newClient, name: e.target.value})}
              className="bg-white/50 border-white/20 h-12 rounded-xl"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input 
                placeholder="Instagram" 
                value={newClient.instagram}
                onChange={e => setNewClient({...newClient, instagram: e.target.value})}
                className="bg-white/50 border-white/20 h-12 rounded-xl"
              />
              <Input 
                placeholder="Telefone" 
                value={newClient.phone}
                onChange={e => setNewClient({...newClient, phone: e.target.value})}
                className="bg-white/50 border-white/20 h-12 rounded-xl"
              />
            </div>
            <div className="relative">
              <Input 
                list="niche-options"
                placeholder="Selecione ou Digite o Nicho" 
                required
                value={newClient.nicheId}
                onChange={e => setNewClient({...newClient, nicheId: e.target.value})}
                className="bg-white/50 border-white/20 h-12 rounded-xl"
              />
              <datalist id="niche-options">
                {niches.map(n => (
                  <option key={n.id} value={n.name} />
                ))}
              </datalist>
            </div>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-zinc-900 text-white hover:bg-black h-12 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Cadastrando...' : <><Plus className="w-4 h-4 mr-2" /> Cadastrar Cliente</>}
            </Button>
          </form>
        </div>
      </div>

      <div className="glass-card">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Base de Clientes</h3>
          <div className="flex items-center gap-2 text-zinc-300">
            <Users className="w-4 h-4" />
            <span className="text-xs font-medium">{clients.length} Total</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b-zinc-100/50 hover:bg-transparent">
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Nome</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Nicho</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Contato</TableHead>
                <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest text-zinc-400">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map(client => (
                <TableRow key={client.id} className="border-b-zinc-100/50 hover:bg-zinc-50/50 transition-colors group">
                  <TableCell className="font-bold text-sm tracking-tight">{client.name}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center justify-center text-[9px] font-bold uppercase tracking-widest bg-zinc-100 px-3 py-1 rounded-full truncate max-w-[100px] border border-zinc-200/50">
                      {niches.find(n => n.id === client.nicheId || n.name === client.nicheId)?.name || client.nicheId || 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell className="text-zinc-500 text-[11px] font-medium">
                    {client.instagram || client.email} {client.phone && `• ${client.phone}`}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDeleteClient(client.id)}
                      className="text-zinc-200 hover:text-black hover:bg-transparent transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {clients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-20">
                     <p className="text-xs font-bold uppercase tracking-widest text-zinc-300">Nenhum cliente cadastrado.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

