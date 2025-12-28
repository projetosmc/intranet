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
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  unit?: string;
  department?: string;
  job_title?: string;
  phone?: string;
  is_active: boolean;
  ad_object_id?: string;
  ad_synced_at?: string;
  created_at: string;
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
        .from('profiles')
        .select('*')
        .order('full_name');

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const usersWithRoles = (profiles || []).map(profile => ({
        ...profile,
        is_active: profile.is_active ?? true,
        roles: (roles || [])
          .filter(r => r.user_id === profile.id)
          .map(r => r.role)
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
        .from('profiles')
        .update({ is_active: !isActive })
        .eq('id', userId);

      if (error) throw error;

      // Log audit
      await logAudit({
        action: isActive ? 'user_deactivated' : 'user_activated',
        entity_type: 'profile',
        entity_id: userId,
        target_user_id: userId,
        old_value: { is_active: isActive },
        new_value: { is_active: !isActive },
      });

      setUsers(users.map(u => 
        u.id === userId ? { ...u, is_active: !isActive } : u
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
          .from('user_roles')
          .insert({ user_id: userId, role });
        if (error) throw error;

        // Log audit
        await logAudit({
          action: 'role_added',
          entity_type: 'user_role',
          entity_id: `${userId}-${role}`,
          target_user_id: userId,
          new_value: { role },
        });
      } else {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', role);
        if (error) throw error;

        // Log audit
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
    const currentUser = users.find(u => u.id === userId);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          unit: data.unit,
          department: data.department,
          job_title: data.job_title,
          phone: data.phone,
        })
        .eq('id', userId);

      if (error) throw error;

      // Log audit
      await logAudit({
        action: 'profile_updated',
        entity_type: 'profile',
        entity_id: userId,
        target_user_id: userId,
        old_value: {
          unit: currentUser?.unit,
          department: currentUser?.department,
          job_title: currentUser?.job_title,
          phone: currentUser?.phone,
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
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.unit?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'active' && user.is_active) ||
      (filterStatus === 'inactive' && !user.is_active);

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

        {/* AD Integration Status */}
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

        {/* Filters */}
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

        {/* Users Table */}
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
                  <tr key={user.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(user.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.full_name || 'Sem nome'}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">{user.unit || '-'}</td>
                    <td className="p-4 text-muted-foreground">{user.department || '-'}</td>
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
                      <Badge variant={user.is_active ? 'default' : 'destructive'} className="text-xs">
                        {user.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      {user.ad_object_id ? (
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
                          onClick={() => handleToggleActive(user.id, user.is_active)}
                          title={user.is_active ? 'Desativar' : 'Ativar'}
                        >
                          {user.is_active ? (
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

      {/* Edit User Dialog */}
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
                    <AvatarImage src={selectedUser.avatar_url} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(selectedUser.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedUser.full_name}</p>
                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  </div>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleUpdateProfile(selectedUser.id, {
                    unit: formData.get('unit') as string,
                    department: formData.get('department') as string,
                    job_title: formData.get('job_title') as string,
                    phone: formData.get('phone') as string,
                  });
                }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Unidade</Label>
                      <Input name="unit" defaultValue={selectedUser.unit || ''} />
                    </div>
                    <div>
                      <Label>Departamento</Label>
                      <Input name="department" defaultValue={selectedUser.department || ''} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Cargo</Label>
                      <Input name="job_title" defaultValue={selectedUser.job_title || ''} />
                    </div>
                    <div>
                      <Label>Telefone</Label>
                      <Input name="phone" defaultValue={selectedUser.phone || ''} />
                    </div>
                  </div>
                  <Button type="submit" className="w-full">Salvar Alterações</Button>
                </form>
              </TabsContent>

              <TabsContent value="permissions" className="space-y-4 mt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">Administrador</p>
                      <p className="text-xs text-muted-foreground">Acesso total ao sistema</p>
                    </div>
                    <Switch
                      checked={selectedUser.roles.includes('admin')}
                      onCheckedChange={(checked) => handleUpdateRole(selectedUser.id, 'admin', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">Moderador</p>
                      <p className="text-xs text-muted-foreground">Gerencia comunicados e conteúdo</p>
                    </div>
                    <Switch
                      checked={selectedUser.roles.includes('moderator')}
                      onCheckedChange={(checked) => handleUpdateRole(selectedUser.id, 'moderator', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">Usuário</p>
                      <p className="text-xs text-muted-foreground">Acesso padrão</p>
                    </div>
                    <Switch
                      checked={selectedUser.roles.includes('user')}
                      onCheckedChange={(checked) => handleUpdateRole(selectedUser.id, 'user', checked)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <p className="font-medium">Status do Usuário</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedUser.is_active ? 'Usuário pode acessar o sistema' : 'Usuário bloqueado'}
                    </p>
                  </div>
                  <Switch
                    checked={selectedUser.is_active}
                    onCheckedChange={() => handleToggleActive(selectedUser.id, selectedUser.is_active)}
                  />
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
