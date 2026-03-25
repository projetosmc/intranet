import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, User, LogOut, CheckCheck, Trash2, RefreshCw, Menu, AlertTriangle, WifiOff, Settings, Home, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Skeleton } from '@/components/ui/skeleton';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { LogoutConfirmDialog } from './LogoutConfirmDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useUser } from '@/contexts/UserContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useNotificationsSystem } from '@/hooks/useNotificationsSystem';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TopbarProps {
  onMobileMenuToggle?: () => void;
}

// Mapeamento de rotas para nomes legíveis
const routeNames: Record<string, string> = {
  '': 'Início',
  'comunicados': 'Comunicados',
  'status': 'Status dos Sistemas',
  'suporte': 'Suporte',
  'reserva-salas': 'Reserva de Salas',
  'base-conhecimento': 'Base de Conhecimento',
  'perfil': 'Meu Perfil',
  'admin': 'Administração',
  'configuracoes': 'Configurações',
  'usuarios': 'Usuários',
  'auditoria': 'Auditoria',
  'sistemas': 'Sistemas',
  'perfis': 'Perfis',
  'faqs': 'FAQs',
  'trilha-vendas': 'Trilha de Vendas',
};

export function Topbar({ onMobileMenuToggle }: TopbarProps) {
  const { user, signOut } = useUser();
  const { isRevalidating, isSessionExpired, session, refreshSession } = useAuthContext();
  const { profile, isLoading: isProfileLoading } = useUserProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotificationsSystem();

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
      setNotificationsOpen(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleRelogin = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };

  const handleRefreshSession = async () => {
    await refreshSession();
  };

  const userName = profile?.fullName || user?.name || 'Usuário';
  const userEmail = profile?.email || user?.email || '';

  // Session expiry warning (5 minutes before)
  const sessionExpiresAt = session?.expires_at ? new Date(session.expires_at * 1000) : null;
  const now = new Date();
  const fiveMinutes = 5 * 60 * 1000;
  const isSessionExpiringSoon = sessionExpiresAt && 
    (sessionExpiresAt.getTime() - now.getTime()) < fiveMinutes && 
    (sessionExpiresAt.getTime() - now.getTime()) > 0;

  return (
    <>
      {/* Session Status Banners */}
      <AnimatePresence>
        {isSessionExpired && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Alert variant="destructive" className="rounded-none border-x-0 border-t-0">
              <WifiOff className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Sua sessão expirou. Faça login novamente para continuar.</span>
                <Button size="sm" variant="outline" onClick={handleRelogin} className="ml-4">
                  Entrar novamente
                </Button>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
        {!isSessionExpired && isSessionExpiringSoon && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Alert className="rounded-none border-x-0 border-t-0 border-yellow-500 bg-yellow-500/10">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="flex items-center justify-between text-yellow-700">
                <span>Sua sessão expira em breve. Salve seu trabalho.</span>
                <Button size="sm" variant="outline" onClick={handleRefreshSession} className="ml-4">
                  Renovar sessão
                </Button>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-20 h-16 lg:h-[65px] border-b border-border bg-background"
      >
        <div className="flex h-full items-center justify-between px-3 sm:px-4 lg:px-6">
          {/* Left side - Mobile menu button + Breadcrumbs */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {onMobileMenuToggle && (
              <button
                onClick={onMobileMenuToggle}
                className="lg:hidden p-2 rounded-lg hover:bg-muted text-foreground flex-shrink-0"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}

            {/* Dynamic Breadcrumbs */}
            {pathSegments.length > 0 && (
              <nav className="flex items-center gap-1 text-sm min-w-0 overflow-hidden" aria-label="Breadcrumbs">
                <Link
                  to="/"
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                >
                  <Home className="h-4 w-4" />
                  <span className="hidden sm:inline">Início</span>
                </Link>
                {pathSegments.map((segment, index) => {
                  const path = '/' + pathSegments.slice(0, index + 1).join('/');
                  const name = routeNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
                  const isLast = index === pathSegments.length - 1;
                  return (
                    <div key={path} className="flex items-center gap-1 min-w-0">
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
                      {isLast ? (
                        <span className="font-medium text-foreground truncate">{name}</span>
                      ) : (
                        <Link
                          to={path}
                          className="text-muted-foreground hover:text-foreground transition-colors truncate"
                        >
                          {name}
                        </Link>
                      )}
                    </div>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-2">
            {/* Revalidating Indicator */}
            <AnimatePresence>
              {isRevalidating && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="p-2">
                          <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Atualizando dados...</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </motion.div>
              )}
            </AnimatePresence>


            {/* Notifications Bell */}
            <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <h3 className="font-semibold">Notificações</h3>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={markAllAsRead}
                    >
                      <CheckCheck className="h-3 w-3 mr-1" />
                      Marcar todas como lidas
                    </Button>
                  )}
                </div>
                <ScrollArea className="h-80">
                  {isLoading ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      Carregando...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Nenhuma notificação
                      </p>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {notifications.map((notification) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className={cn(
                            "flex gap-3 p-4 border-b border-border/50 cursor-pointer hover:bg-muted/50 transition-colors",
                            !notification.read && "bg-primary/5"
                          )}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <UserAvatar
                            size="sm"
                            src={notification.originUser?.avatarUrl}
                            name={notification.originUser?.name}
                            className="flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium line-clamp-1">
                                {notification.title}
                              </p>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {!notification.read && (
                                  <span className="h-2 w-2 rounded-full bg-primary" />
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notification.id);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground/70 mt-1">
                              {formatDistanceToNow(new Date(notification.createdAt), { 
                                addSuffix: true, 
                                locale: ptBR 
                              })}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>

            {/* User Dropdown */}
            {isProfileLoading ? (
              <div className="flex items-center gap-2 py-2 px-2">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="hidden sm:flex flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 h-auto py-1.5 px-2 hover:bg-muted"
                  >
                    <UserAvatar
                      size="sm"
                      src={profile?.avatarUrl || user?.avatar}
                      name={userName}
                    />
                    <div className="hidden sm:flex flex-col items-start max-w-[120px] sm:max-w-none">
                      <span className="text-sm font-medium leading-tight truncate w-full">{userName}</span>
                      <span className="text-[10px] sm:text-xs text-muted-foreground leading-tight truncate w-full">
                        {userEmail}
                      </span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/perfil')}>
                    <User className="mr-2 h-4 w-4" />
                    Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/admin/configuracoes')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Configurações
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogoutClick}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Desktop Logout Button */}
            <Button
              variant="destructive"
              size="sm"
              onClick={handleLogoutClick}
              className="hidden lg:flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Logout Confirmation Dialog */}
      <LogoutConfirmDialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        onConfirm={handleLogout}
      />
    </>
  );
}
