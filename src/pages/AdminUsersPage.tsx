import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Shield, UserX, UserCheck, Building2, RefreshCw, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser } from '@/contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { logAudit } from '@/hooks/useAuditLog';

interface UserProfile {
  cod_usuario: string;
  des_email: string;
  des_nome_completo: string;
  des_avatar_url?: string;
  des_unidade?: string;
  des_departamento?: string;
  des_cargo?: string;
  des_telefone?: string;
  ind_ativo: boolean;
  des_ad_object_id?: string;
  dta_sincronizacao_ad?: string;
  dta_cadastro: string;
  roles: string[];
}

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const { isAdmin } = useUser();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'moderator' | 'user'>('all');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('tab_perfil_usuario')
        .select('*')
        .order('des_nome_completo');

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('tab_usuario_role')
        .select('seq_usuario, des_role');

      if (rolesError) throw rolesError;

      const usersWithRoles = (profiles || []).map(profile => ({
        ...profile,
        ind_ativo: profile.ind_ativo ?? true,
        roles: (roles || [])
          .filter(r => r.seq_usuario === profile.cod_usuario)
          .map(r => r.des_role)
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({ title: 'Erro ao carregar usuários', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('tab_perfil_usuario')
        .update({ ind_ativo: !isActive })
        .eq('cod_usuario', userId);

      if (error) throw error;

      await logAudit({
        action: isActive ? 'user_deactivated' : 'user_activated',
        entity_type: 'profile',
        entity_id: userId,
        target_user_id: userId,
        old_value: { ind_ativo: isActive },
        new_value: { ind_ativo: !isActive },
      });

      setUsers(users.map(u => 
        u.cod_usuario === userId ? { ...u, ind_ativo: !isActive } : u
      ));

      toast({ title: isActive ? 'Usuário desativado' : 'Usuário ativado' });
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' });
    }
  };

  const handleUpdateRole = async (userId: string, role: 'admin' | 'moderator' | 'user', add: boolean) => {
    try {
      if (add) {
        const { error } = await supabase
          .from('tab_usuario_role')
          .insert({ seq_usuario: userId, des_role: role });
        if (error) throw error;

        await logAudit({
          action: 'role_added',
          entity_type: 'user_role',
          entity_id: `${userId}-${role}`,
          target_user_id: userId,
          new_value: { role },
        });
      } else {
        const { error } = await supabase
          .from('tab_usuario_role')
          .delete()
          .eq('seq_usuario', userId)
          .eq('des_role', role);
        if (error) throw error;

        await logAudit({
          action: 'role_removed',
          entity_type: 'user_role',
          entity_id: `${userId}-${role}`,
          target_user_id: userId,
          old_value: { role },
        });
      }

      await fetchUsers();
      toast({ title: 'Permissões atualizadas' });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({ title: 'Erro ao atualizar permissões', variant: 'destructive' });
    }
  };

  const handleUpdateProfile = async (userId: string, data: Partial<UserProfile>) => {
    const currentUser = users.find(u => u.cod_usuario === userId);
    
    try {
      const { error } = await supabase
        .from('tab_perfil_usuario')
        .update({
          des_unidade: data.des_unidade,
          des_departamento: data.des_departamento,
          des_cargo: data.des_cargo,
          des_telefone: data.des_telefone,
        })
        .eq('cod_usuario', userId);

      if (error) throw error;

      await logAudit({
        action: 'profile_updated',
        entity_type: 'profile',
        entity_id: userId,
        target_user_id: userId,
        old_value: {
          des_unidade: currentUser?.des_unidade,
          des_departamento: currentUser?.des_departamento,
          des_cargo: currentUser?.des_cargo,
          des_telefone: currentUser?.des_telefone,
        },
        new_value: data,
      });

      await fetchUsers();
      setIsEditDialogOpen(false);
      toast({ title: 'Perfil atualizado' });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({ title: 'Erro ao atualizar perfil', variant: 'destructive' });
    }
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '??';
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.des_nome_completo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.des_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.des_unidade?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'active' && user.ind_ativo) ||
      (filterStatus === 'inactive' && !user.ind_ativo);

    const matchesRole = 
      filterRole === 'all' ||
      user.roles.includes(filterRole);

    return matchesSearch && matchesStatus && matchesRole;
  });

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

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Gerenciamento de Usuários</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchUsers} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        <div className="bg-muted/50 border border-border rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Integração Active Directory</p>
              <p className="text-sm text-muted-foreground">
                Preparado para sincronização com AD. Configure o endpoint de integração quando disponível.
              </p>
            </div>
            <Badge variant="outline" className="ml-auto">Pendente</Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou unidade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={(v: 'all' | 'active' | 'inactive') => setFilterStatus(v)}>
            <SelectTrigger className="w-[150px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterRole} onValueChange={(v: 'all' | 'admin' | 'moderator' | 'user') => setFilterRole(v)}>
            <SelectTrigger className="w-[150px]">
              <Shield className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Perfil" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
              <SelectItem value="moderator">Moderador</SelectItem>
              <SelectItem value="user">Usuário</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left p-4 font-medium">Usuário</th>
                  <th className="text-left p-4 font-medium">Unidade</th>
                  <th className="text-left p-4 font-medium">Departamento</th>
                  <th className="text-left p-4 font-medium">Perfis</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">AD Sync</th>
                  <th className="text-left p-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.cod_usuario} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.des_avatar_url} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(user.des_nome_completo)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.des_nome_completo || 'Sem nome'}</p>
                          <p className="text-xs text-muted-foreground">{user.des_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">{user.des_unidade || '-'}</td>
                    <td className="p-4 text-muted-foreground">{user.des_departamento || '-'}</td>
                    <td className="p-4">
                      <div className="flex gap-1 flex-wrap">
                        {user.roles.length > 0 ? (
                          user.roles.map(role => (
                            <Badge key={role} variant={role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                              {role === 'admin' ? 'Admin' : role === 'moderator' ? 'Mod' : 'User'}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-xs">Nenhum</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant={user.ind_ativo ? 'default' : 'destructive'} className="text-xs">
                        {user.ind_ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      {user.des_ad_object_id ? (
                        <Badge variant="outline" className="text-xs">Sincronizado</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsEditDialogOpen(true);
                          }}
                          title="Editar"
                        >
                          <Shield className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleToggleActive(user.cod_usuario, user.ind_ativo)}
                          title={user.ind_ativo ? 'Desativar' : 'Ativar'}
                        >
                          {user.ind_ativo ? (
                            <UserX className="h-4 w-4 text-destructive" />
                          ) : (
                            <UserCheck className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      {isLoading ? 'Carregando...' : 'Nenhum usuário encontrado'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Gerenciar Usuário</DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <Tabs defaultValue="profile">
              <TabsList className="w-full">
                <TabsTrigger value="profile" className="flex-1">Perfil</TabsTrigger>
                <TabsTrigger value="permissions" className="flex-1">Permissões</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4 mt-4">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedUser.des_avatar_url} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(selectedUser.des_nome_completo)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedUser.des_nome_completo}</p>
                    <p className="text-sm text-muted-foreground">{selectedUser.des_email}</p>
                  </div>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleUpdateProfile(selectedUser.cod_usuario, {
                    des_unidade: formData.get('unit') as string,
                    des_departamento: formData.get('department') as string,
                    des_cargo: formData.get('job_title') as string,
                    des_telefone: formData.get('phone') as string,
                  });
                }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Unidade</Label>
                      <Input name="unit" defaultValue={selectedUser.des_unidade || ''} />
                    </div>
                    <div>
                      <Label>Departamento</Label>
                      <Input name="department" defaultValue={selectedUser.des_departamento || ''} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Cargo</Label>
                      <Input name="job_title" defaultValue={selectedUser.des_cargo || ''} />
                    </div>
                    <div>
                      <Label>Telefone</Label>
                      <Input name="phone" defaultValue={selectedUser.des_telefone || ''} />
                    </div>
                  </div>
                  <Button type="submit" className="w-full">Salvar Perfil</Button>
                </form>
              </TabsContent>

              <TabsContent value="permissions" className="space-y-4 mt-4">
                <div className="space-y-3">
                  {(['admin', 'moderator', 'user'] as const).map(role => (
                    <div key={role} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium capitalize">
                          {role === 'admin' ? 'Administrador' : role === 'moderator' ? 'Moderador' : 'Usuário'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {role === 'admin' 
                            ? 'Acesso total ao sistema' 
                            : role === 'moderator' 
                            ? 'Pode moderar conteúdo' 
                            : 'Acesso básico'}
                        </p>
                      </div>
                      <Switch
                        checked={selectedUser.roles.includes(role)}
                        onCheckedChange={(checked) => handleUpdateRole(selectedUser.cod_usuario, role, checked)}
                      />
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
