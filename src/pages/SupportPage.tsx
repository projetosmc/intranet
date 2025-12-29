import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, ExternalLink, MessageCircle, Book, Mail, Phone, FileQuestion } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { RichTextContent } from '@/components/ui/rich-text-editor';
import { supabase } from '@/integrations/supabase/client';

interface FAQ {
  cod_faq: string;
  des_pergunta: string;
  des_resposta: string;
}

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

export default function SupportPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const { data, error } = await supabase
          .from('tab_faq')
          .select('cod_faq, des_pergunta, des_resposta')
          .eq('ind_ativo', true)
          .order('num_ordem');

        if (error) throw error;
        setFaqs(data || []);
      } catch (error) {
        console.error('Error fetching FAQs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFaqs();
  }, []);

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
          {isLoading ? (
            <p className="text-center text-muted-foreground py-4">Carregando...</p>
          ) : faqs.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">Nenhuma FAQ cadastrada</p>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq) => (
                <AccordionItem key={faq.cod_faq} value={faq.cod_faq}>
                  <AccordionTrigger className="text-left hover:no-underline hover:text-primary">
                    {faq.des_pergunta}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    <RichTextContent 
                      html={faq.des_resposta} 
                      className="[&_a]:text-primary [&_a]:underline [&_a:hover]:no-underline"
                    />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </motion.section>
    </div>
  );
}
