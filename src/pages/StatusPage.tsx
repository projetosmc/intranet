import { motion } from 'framer-motion';
import { Activity, CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SystemStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  lastCheck: string;
}

const systems: SystemStatus[] = [
  { name: 'Portal Requisição de Despesas', status: 'operational', lastCheck: 'Há 2 min' },
  { name: 'Portal Regra de Preço', status: 'operational', lastCheck: 'Há 2 min' },
  { name: 'Portal Cliente', status: 'operational', lastCheck: 'Há 2 min' },
  { name: 'Pré-fatura', status: 'operational', lastCheck: 'Há 2 min' },
  { name: 'Auditoria Preço x Bomba', status: 'degraded', lastCheck: 'Há 5 min' },
  { name: 'SAC - Atendimento', status: 'operational', lastCheck: 'Há 2 min' },
  { name: 'RH - Portal do Colaborador', status: 'operational', lastCheck: 'Há 2 min' },
  { name: 'Banco de Dados Principal', status: 'operational', lastCheck: 'Há 1 min' },
];

const statusConfig = {
  operational: {
    label: 'Operacional',
    icon: CheckCircle,
    variant: 'success' as const,
    color: 'text-success',
  },
  degraded: {
    label: 'Degradado',
    icon: AlertTriangle,
    variant: 'warning' as const,
    color: 'text-warning',
  },
  down: {
    label: 'Indisponível',
    icon: XCircle,
    variant: 'destructive' as const,
    color: 'text-destructive',
  },
};

export default function StatusPage() {
  const allOperational = systems.every(s => s.status === 'operational');
  const hasIssues = systems.some(s => s.status !== 'operational');

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Status dos Sistemas</h1>
          </div>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
        <p className="text-muted-foreground">
          Monitore o status de todos os sistemas Monte Carlo
        </p>
      </motion.div>

      {/* Overall Status Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className={`glass-card p-6 border-l-4 ${allOperational ? 'border-l-success' : 'border-l-warning'}`}
      >
        <div className="flex items-center gap-4">
          {allOperational ? (
            <>
              <CheckCircle className="h-8 w-8 text-success" />
              <div>
                <h2 className="text-lg font-semibold text-foreground">Todos os sistemas operacionais</h2>
                <p className="text-sm text-muted-foreground">Última verificação há menos de 5 minutos</p>
              </div>
            </>
          ) : (
            <>
              <AlertTriangle className="h-8 w-8 text-warning" />
              <div>
                <h2 className="text-lg font-semibold text-foreground">Alguns sistemas com problemas</h2>
                <p className="text-sm text-muted-foreground">Estamos trabalhando para resolver</p>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Systems List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="glass-card divide-y divide-border"
      >
        {systems.map((system, index) => {
          const config = statusConfig[system.status];
          const Icon = config.icon;

          return (
            <motion.div
              key={system.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: 0.1 + index * 0.03 }}
              className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-5 w-5 ${config.color}`} />
                <span className="font-medium text-foreground">{system.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">{system.lastCheck}</span>
                <Badge variant={config.variant}>{config.label}</Badge>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Incident History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <h2 className="text-lg font-semibold text-foreground mb-4">Histórico de Incidentes</h2>
        <div className="glass-card p-8 text-center">
          <CheckCircle className="h-10 w-10 text-success mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhum incidente nos últimos 30 dias</p>
        </div>
      </motion.div>
    </div>
  );
}
