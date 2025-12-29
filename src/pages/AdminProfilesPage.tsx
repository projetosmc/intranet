import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Shield, Pencil, Check, Search, X, RefreshCw, Users, Lock, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser } from '@/contexts/UserContext';
import { useFeaturePermission } from '@/hooks/useFeaturePermission';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ScreenPermissionsTab } from '@/components/admin/ScreenPermissionsTab';
import { RoleTypesTab } from '@/components/admin/RoleTypesTab';

interface UserWithRole {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
}

interface RoleType {
  des_codigo: string;
  des_nome: string;
  des_descricao: string | null;
  des_cor: string;
}

export default function AdminProfilesPage() {
  const navigate = useNavigate();
  const { isAdmin } = useUser();
  const { canAccessUsersTab, canAccessRoleTypesTab, canAccessPermissionsTab } = useFeaturePermission();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [roleTypes, setRoleTypes] = useState<RoleType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Buscar tipos de perfil
      const { data: rolesData, error: rolesError } = await supabase
        .from('tab_perfil_tipo')
        .select('des_codigo, des_nome, des_descricao, des_cor')
        .eq('ind_ativo', true)
        .order('num_ordem');

      if (rolesError) throw rolesError;
      setRoleTypes((rolesData || []) as RoleType[]);

      // Buscar perfis de usuário
      const { data: profiles, error: profilesError } = await supabase
        .from('tab_perfil_usuario')
        .select('cod_usuario, des_email, des_nome_completo')
        .eq('ind_ativo', true)
        .order('des_nome_completo');

      if (profilesError) throw profilesError;

      // Buscar roles dos usuários
      const { data: userRoles, error: userRolesError } = await supabase
        .from('tab_usuario_role')
        .select('seq_usuario, des_role');

      if (userRolesError) throw userRolesError;

      // Combinar dados
      const usersWithRoles: UserWithRole[] = (profiles || []).map(profile => ({
        id: profile.cod_usuario,
        email: profile.des_email || '',
        fullName: profile.des_nome_completo || 'Sem nome',
        roles: (userRoles || [])
          .filter(r => r.seq_usuario === profile.cod_usuario)
          .map(r => r.des_role),
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: 'Erro ao carregar dados', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditRoles = (user: UserWithRole) => {
    setEditingUser(user);
    setSelectedRoles(user.roles);
    setIsDialogOpen(true);
  };

  const handleSaveRoles = async () => {
    if (!editingUser) return;

    try {
      // Remover roles antigas
      await supabase
        .from('tab_usuario_role')
        .delete()
        .eq('seq_usuario', editingUser.id);

      // Adicionar novas roles
      if (selectedRoles.length > 0) {
        const newRoles = selectedRoles.map(role => ({
          seq_usuario: editingUser.id,
          des_role: role as 'admin' | 'moderator' | 'user',
        }));

        const { error } = await supabase
          .from('tab_usuario_role')
          .insert(newRoles);

        if (error) throw error;
      }

      toast({ title: 'Perfil atualizado!' });
      setIsDialogOpen(false);
      setEditingUser(null);
      await fetchData();
    } catch (error) {
      console.error('Error updating roles:', error);
      toast({ title: 'Erro ao atualizar perfil', variant: 'destructive' });
    }
  };

  const toggleRole = (role: string) => {
    setSelectedRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  // Memoized filtered users for better performance
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    const lowerSearch = searchTerm.toLowerCase();
    return users.filter(user =>
      user.fullName.toLowerCase().includes(lowerSearch) ||
      user.email.toLowerCase().includes(lowerSearch) ||
      user.roles.some(role => role.toLowerCase().includes(lowerSearch))
    );
  }, [users, searchTerm]);

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  const getRoleLabel = useCallback((roleCode: string) => {
    const role = roleTypes.find(r => r.des_codigo === roleCode);
    return role?.des_nome || roleCode;
  }, [roleTypes]);

  const getRoleColor = useCallback((roleCode: string) => {
    const role = roleTypes.find(r => r.des_codigo === roleCode);
    return role?.des_cor || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }, [roleTypes]);

  // Verificar se tem acesso a pelo menos uma aba
  const hasAnyAccess = isAdmin || canAccessUsersTab || canAccessRoleTypesTab || canAccessPermissionsTab;

  if (!hasAnyAccess) {
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

  // Determinar qual aba mostrar por padrão
  const defaultTab = canAccessUsersTab || isAdmin ? 'usuarios' : 
                     canAccessRoleTypesTab ? 'tipos' : 
                     canAccessPermissionsTab ? 'permissoes' : 'usuarios';

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-6">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Gerenciamento de Perfis</h1>
        </div>

        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList>
            {(canAccessUsersTab || isAdmin) && (
              <TabsTrigger value="usuarios" className="gap-2">
                <Users className="h-4 w-4" />
                Usuários
              </TabsTrigger>
            )}
            {(canAccessRoleTypesTab || isAdmin) && (
              <TabsTrigger value="tipos" className="gap-2">
                <UserCog className="h-4 w-4" />
                Tipos de Perfil
              </TabsTrigger>
            )}
            {(canAccessPermissionsTab || isAdmin) && (
              <TabsTrigger value="permissoes" className="gap-2">
                <Lock className="h-4 w-4" />
                Permissões por Perfil
              </TabsTrigger>
            )}
          </TabsList>

          {/* Aba de Usuários */}
          <TabsContent value="usuarios">
            <div className="glass-card p-6 rounded-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-lg font-semibold">Usuários e Permissões</h2>
                  <p className="text-sm text-muted-foreground">
                    Gerencie os perfis de acesso dos usuários do sistema
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome, email ou perfil..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-9 w-full sm:w-80"
                    />
                    {searchTerm && (
                      <button
                        onClick={handleClearSearch}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={fetchData}
                    disabled={isLoading}
                    title="Atualizar lista"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
              
              {/* Results count */}
              {searchTerm && (
                <p className="text-sm text-muted-foreground mb-3">
                  {filteredUsers.length} usuário{filteredUsers.length !== 1 ? 's' : ''} encontrado{filteredUsers.length !== 1 ? 's' : ''}
                </p>
              )}

              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Perfis</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          Carregando...
                        </TableCell>
                      </TableRow>
                    ) : filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          Nenhum usuário encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.fullName}</TableCell>
                          <TableCell className="text-muted-foreground">{user.email}</TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {user.roles.length === 0 ? (
                                <Badge variant="outline" className="text-muted-foreground">
                                  Sem perfil
                                </Badge>
                              ) : (
                                user.roles.map((role) => (
                                  <Badge key={role} className={getRoleColor(role)}>
                                    {getRoleLabel(role)}
                                  </Badge>
                                ))
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditRoles(user)}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar Perfil
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          {/* Aba de Tipos de Perfil */}
          <TabsContent value="tipos">
            <div className="glass-card p-6 rounded-xl">
              <RoleTypesTab />
            </div>
          </TabsContent>

          {/* Aba de Permissões por Perfil */}
          <TabsContent value="permissoes">
            <div className="glass-card p-6 rounded-xl">
              <ScreenPermissionsTab />
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Edit Roles Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Perfil de Acesso</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">{editingUser.fullName}</p>
                <p className="text-sm text-muted-foreground">{editingUser.email}</p>
              </div>

              <div className="space-y-3">
                <Label>Perfis de Acesso</Label>
                {roleTypes.map((role) => (
                  <div
                    key={role.des_codigo}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedRoles.includes(role.des_codigo)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => toggleRole(role.des_codigo)}
                  >
                    <Checkbox
                      checked={selectedRoles.includes(role.des_codigo)}
                      onCheckedChange={() => toggleRole(role.des_codigo)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge className={role.des_cor}>{role.des_nome}</Badge>
                      </div>
                      {role.des_descricao && (
                        <p className="text-sm text-muted-foreground mt-1">{role.des_descricao}</p>
                      )}
                    </div>
                    {selectedRoles.includes(role.des_codigo) && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                ))}
              </div>

              <Button onClick={handleSaveRoles} className="w-full">
                Salvar Alterações
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
