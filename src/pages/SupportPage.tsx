import { motion } from 'framer-motion';
import { HelpCircle, ExternalLink, MessageCircle, Book, Mail, Phone, FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const supportLinks = [
  {
    name: 'GLPI - Service Desk',
    description: 'Abra chamados de suporte técnico',
    icon: MessageCircle,
    url: 'https://glpi.montecarlo.com.br',
  },
  {
    name: 'Microsoft Teams',
    description: 'Canal de suporte TI',
    icon: MessageCircle,
    url: 'https://teams.microsoft.com',
  },
  {
    name: 'Base de Conhecimento',
    description: 'Documentação e tutoriais',
    icon: Book,
    url: '#',
  },
];

const faqs = [
  {
    question: 'Como solicitar acesso a uma nova ferramenta?',
    answer: 'Para solicitar acesso a uma ferramenta, abra um chamado no GLPI especificando qual ferramenta você precisa acessar e o motivo. Seu gestor receberá uma notificação para aprovação.',
  },
  {
    question: 'Esqueci minha senha, o que fazer?',
    answer: 'Acesse a página de login e clique em "Esqueci minha senha". Um link de redefinição será enviado para seu e-mail corporativo. Caso não receba, entre em contato com o suporte TI.',
  },
  {
    question: 'Como reportar um bug em alguma ferramenta?',
    answer: 'Abra um chamado no GLPI na categoria "Incidente - Sistemas" descrevendo o problema encontrado, incluindo prints de tela se possível e os passos para reproduzir o erro.',
  },
  {
    question: 'Posso acessar as ferramentas fora da empresa?',
    answer: 'Sim, a maioria das ferramentas está disponível via VPN. Configure a VPN corporativa em seu dispositivo seguindo as instruções na Base de Conhecimento.',
  },
  {
    question: 'Como faço para sugerir uma melhoria?',
    answer: 'Envie suas sugestões através do formulário de feedback disponível em cada ferramenta ou abra um chamado no GLPI na categoria "Melhoria".',
  },
];

export default function SupportPage() {
  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <HelpCircle className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Suporte</h1>
        </div>
        <p className="text-muted-foreground">
          Precisa de ajuda? Encontre recursos e entre em contato conosco
        </p>
      </motion.div>

      {/* Quick Actions */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <h2 className="text-lg font-semibold text-foreground mb-4">Links Úteis</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {supportLinks.map((link, index) => {
            const Icon = link.icon;
            return (
              <motion.a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                className="glass-card p-6 hover-lift group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-6 w-6" />
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                  {link.name}
                </h3>
                <p className="text-sm text-muted-foreground">{link.description}</p>
              </motion.a>
            );
          })}
        </div>
      </motion.section>

      {/* Contact Info */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <h2 className="text-lg font-semibold text-foreground mb-4">Contato Direto</h2>
        <div className="glass-card p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">E-mail</p>
                <a href="mailto:suporte@montecarlo.com.br" className="font-medium text-foreground hover:text-primary transition-colors">
                  suporte@montecarlo.com.br
                </a>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ramal</p>
                <p className="font-medium text-foreground">8001</p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* FAQ */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <FileQuestion className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Perguntas Frequentes</h2>
        </div>
        <div className="glass-card p-4">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left hover:no-underline hover:text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </motion.section>
    </div>
  );
}
