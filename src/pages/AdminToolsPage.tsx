import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Plus, Pencil, Trash2, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useTools } from '@/hooks/useTools';
import { useUser } from '@/contexts/UserContext';
import { Tool, ToolStatus } from '@/types/tools';
import { areas, statusLabels } from '@/data/tools';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

export default function AdminToolsPage() {
  const navigate = useNavigate();
  const { isAdmin } = useUser();
  const { allTools, addTool, updateTool, deleteTool, setTools } = useTools();
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground mb-4">Você não tem permissão para acessar esta página.</p>
          <Button onClick={() => navigate('/')}>Voltar ao início</Button>
        </div>
      </div>
    );
  }

  const handleSave = (formData: FormData) => {
    const tool = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      url: formData.get('url') as string,
      icon: formData.get('icon') as string || 'Box',
      area: formData.get('area') as string,
      status: formData.get('status') as ToolStatus,
      tags: (formData.get('tags') as string).split(',').map(t => t.trim()).filter(Boolean),
      owner: formData.get('owner') as string,
      embed: formData.get('embed') === 'on',
      active: true,
    };

    if (editingTool) {
      updateTool(editingTool.id, tool);
      toast({ title: 'Ferramenta atualizada!' });
    } else {
      addTool(tool);
      toast({ title: 'Ferramenta criada!' });
    }
    setIsDialogOpen(false);
    setEditingTool(null);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(allTools, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mc-hub-tools.json';
    a.click();
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Admin - Ferramentas</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />Exportar
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={(o) => { setIsDialogOpen(o); if (!o) setEditingTool(null); }}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-2" />Nova Ferramenta</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>{editingTool ? 'Editar' : 'Nova'} Ferramenta</DialogTitle></DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); handleSave(new FormData(e.currentTarget)); }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Nome</Label><Input name="name" defaultValue={editingTool?.name} required /></div>
                    <div><Label>Ícone (Lucide)</Label><Input name="icon" defaultValue={editingTool?.icon || 'Box'} /></div>
                  </div>
                  <div><Label>URL</Label><Input name="url" defaultValue={editingTool?.url} required /></div>
                  <div><Label>Descrição</Label><Textarea name="description" defaultValue={editingTool?.description} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Área</Label>
                      <Select name="area" defaultValue={editingTool?.area || areas[0]}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{areas.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label>Status</Label>
                      <Select name="status" defaultValue={editingTool?.status || 'PRODUCAO'}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PRODUCAO">Em Produção</SelectItem>
                          <SelectItem value="PILOTO">Em Piloto</SelectItem>
                          <SelectItem value="CONSTRUCAO">Em Construção</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div><Label>Tags (separadas por vírgula)</Label><Input name="tags" defaultValue={editingTool?.tags.join(', ')} /></div>
                  <div><Label>Owner</Label><Input name="owner" defaultValue={editingTool?.owner} /></div>
                  <div className="flex items-center gap-2"><Switch name="embed" defaultChecked={editingTool?.embed} /><Label>Permitir embed</Label></div>
                  <Button type="submit" className="w-full">Salvar</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </motion.div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50"><tr>
            <th className="text-left p-3">Nome</th><th className="text-left p-3">Área</th><th className="text-left p-3">Status</th><th className="text-left p-3">Ações</th>
          </tr></thead>
          <tbody>
            {allTools.map(tool => (
              <tr key={tool.id} className="border-t border-border hover:bg-muted/30">
                <td className="p-3 font-medium">{tool.name}</td>
                <td className="p-3">{tool.area}</td>
                <td className="p-3"><Badge variant={tool.status === 'PRODUCAO' ? 'production' : tool.status === 'PILOTO' ? 'pilot' : 'construction'}>{statusLabels[tool.status]}</Badge></td>
                <td className="p-3">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => { setEditingTool(tool); setIsDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => { deleteTool(tool.id); toast({ title: 'Ferramenta removida' }); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
