import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

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
};

interface BreadcrumbsProps {
  className?: string;
}

export function Breadcrumbs({ className }: BreadcrumbsProps) {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  // Não mostrar breadcrumbs na página inicial
  if (pathSegments.length === 0) {
    return null;
  }

  const breadcrumbs = pathSegments.map((segment, index) => {
    const path = '/' + pathSegments.slice(0, index + 1).join('/');
    const name = routeNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    const isLast = index === pathSegments.length - 1;

    return { path, name, isLast };
  });

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("flex items-center gap-1 text-sm mb-6", className)}
      aria-label="Breadcrumbs"
    >
      <Link
        to="/"
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
        <span className="hidden sm:inline">Início</span>
      </Link>

      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.path} className="flex items-center gap-1">
          <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
          {crumb.isLast ? (
            <span className="font-medium text-foreground">{crumb.name}</span>
          ) : (
            <Link
              to={crumb.path}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {crumb.name}
            </Link>
          )}
        </div>
      ))}
    </motion.nav>
  );
}
