import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Announcement, PollOption, TemplateType, PollType } from '@/types/announcements';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

/**
 * Hook para gerenciamento de comunicados/anúncios
 * 
 * Tabela principal: tab_comunicado
 * Colunas:
 * - cod_comunicado (PK): UUID do comunicado
 * - des_titulo: Título do comunicado
 * - des_resumo: Resumo breve
 * - des_conteudo: Conteúdo completo (markdown)
 * - des_tipo_template: Tipo de template ('simple' | 'banner' | 'poll')
 * - des_imagem_url: URL da imagem (para banners)
 * - des_tipo_enquete: Tipo de enquete ('single' | 'multiple')
 * - ind_ativo: Indica se está ativo
 * - ind_fixado: Indica se está fixado no topo
 * - dta_publicacao: Data de publicação
 * - dta_cadastro: Data de criação
 * - dta_atualizacao: Data de atualização
 * 
 * Tabela relacionada: tab_enquete_opcao (opções de enquete)
 * - cod_opcao (PK): UUID da opção
 * - seq_comunicado: FK para tab_comunicado
 * - des_texto_opcao: Texto da opção
 * - dta_cadastro: Data de criação
 * 
 * Tabela relacionada: tab_enquete_voto (votos de enquete)
 * - cod_voto (PK): UUID do voto
 * - seq_opcao: FK para tab_enquete_opcao
 * - seq_usuario: ID do usuário que votou
 * - dta_cadastro: Data do voto
 * 
 * Storage: bucket 'announcements' para imagens de banner
 * 
 * RLS: Admins podem gerenciar, usuários autenticados podem ver ativos
 */
export function useDbAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tab_comunicado')
        .select('*')
        .order('ind_fixado', { ascending: false })
        .order('dta_publicacao', { ascending: false });

      if (error) throw error;

      // Fetch poll options for poll type announcements
      const announcementsWithPolls: Announcement[] = await Promise.all(
        (data || []).map(async (item) => {
          let pollOptions: PollOption[] = [];

          if (item.des_tipo_template === 'poll') {
            const { data: optionsData } = await supabase
              .from('tab_enquete_opcao')
              .select('cod_opcao, des_texto_opcao')
              .eq('seq_comunicado', item.cod_comunicado);

            if (optionsData) {
              pollOptions = await Promise.all(
                optionsData.map(async (opt) => {
                  const { count } = await supabase
                    .from('tab_enquete_voto')
                    .select('*', { count: 'exact', head: true })
                    .eq('seq_opcao', opt.cod_opcao);

                  let userVoted = false;
                  if (user) {
                    const { data: voteData } = await supabase
                      .from('tab_enquete_voto')
                      .select('cod_voto')
                      .eq('seq_opcao', opt.cod_opcao)
                      .eq('seq_usuario', user.id)
                      .maybeSingle();
                    userVoted = !!voteData;
                  }

                  return {
                    id: opt.cod_opcao,
                    optionText: opt.des_texto_opcao,
                    voteCount: count || 0,
                    userVoted,
                  };
                })
              );
            }
          }

          return {
            id: item.cod_comunicado,
            title: item.des_titulo,
            summary: item.des_resumo,
            content: item.des_conteudo,
            pinned: item.ind_fixado ?? false,
            publishedAt: item.dta_publicacao,
            active: item.ind_ativo ?? true,
            templateType: (item.des_tipo_template as TemplateType) || 'simple',
            imageUrl: item.des_imagem_url || undefined,
            pollType: (item.des_tipo_enquete as PollType) || undefined,
            pollOptions,
          };
        })
      );

      setAnnouncements(announcementsWithPolls);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os comunicados.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, user]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('announcements')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('announcements')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível fazer upload da imagem.',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  const addAnnouncement = useCallback(async (
    announcement: Omit<Announcement, 'id' | 'publishedAt' | 'pollOptions'>,
    pollOptions?: string[]
  ) => {
    try {
      const { data, error } = await supabase
        .from('tab_comunicado')
        .insert({
          des_titulo: announcement.title,
          des_resumo: announcement.summary,
          des_conteudo: announcement.content,
          ind_fixado: announcement.pinned,
          ind_ativo: announcement.active,
          des_tipo_template: announcement.templateType,
          des_imagem_url: announcement.imageUrl,
          des_tipo_enquete: announcement.pollType,
        })
        .select()
        .single();

      if (error) throw error;

      // Add poll options if it's a poll
      if (announcement.templateType === 'poll' && pollOptions?.length) {
        const { error: optionsError } = await supabase
          .from('tab_enquete_opcao')
          .insert(
            pollOptions.map((text) => ({
              seq_comunicado: data.cod_comunicado,
              des_texto_opcao: text,
            }))
          );

        if (optionsError) throw optionsError;
      }

      toast({
        title: 'Sucesso',
        description: 'Comunicado criado com sucesso.',
      });

      await fetchAnnouncements();
      return data;
    } catch (error) {
      console.error('Error adding announcement:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o comunicado.',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast, fetchAnnouncements]);

  const updateAnnouncement = useCallback(async (
    id: string, 
    updates: Partial<Announcement>,
    pollOptions?: string[]
  ) => {
    try {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.title !== undefined) dbUpdates.des_titulo = updates.title;
      if (updates.summary !== undefined) dbUpdates.des_resumo = updates.summary;
      if (updates.content !== undefined) dbUpdates.des_conteudo = updates.content;
      if (updates.pinned !== undefined) dbUpdates.ind_fixado = updates.pinned;
      if (updates.active !== undefined) dbUpdates.ind_ativo = updates.active;
      if (updates.templateType !== undefined) dbUpdates.des_tipo_template = updates.templateType;
      if (updates.imageUrl !== undefined) dbUpdates.des_imagem_url = updates.imageUrl;
      if (updates.pollType !== undefined) dbUpdates.des_tipo_enquete = updates.pollType;

      const { error } = await supabase
        .from('tab_comunicado')
        .update(dbUpdates)
        .eq('cod_comunicado', id);

      if (error) throw error;

      // Update poll options if provided
      if (pollOptions !== undefined) {
        await supabase.from('tab_enquete_opcao').delete().eq('seq_comunicado', id);
        
        if (pollOptions.length > 0) {
          await supabase.from('tab_enquete_opcao').insert(
            pollOptions.map((text) => ({
              seq_comunicado: id,
              des_texto_opcao: text,
            }))
          );
        }
      }

      toast({
        title: 'Sucesso',
        description: 'Comunicado atualizado com sucesso.',
      });

      await fetchAnnouncements();
    } catch (error) {
      console.error('Error updating announcement:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o comunicado.',
        variant: 'destructive',
      });
    }
  }, [toast, fetchAnnouncements]);

  const deleteAnnouncement = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('tab_comunicado')
        .delete()
        .eq('cod_comunicado', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Comunicado excluído com sucesso.',
      });

      await fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o comunicado.',
        variant: 'destructive',
      });
    }
  }, [toast, fetchAnnouncements]);

  const vote = useCallback(async (optionId: string) => {
    if (!user) return;

    try {
      // Check if user already voted
      const { data: existingVote } = await supabase
        .from('tab_enquete_voto')
        .select('cod_voto')
        .eq('seq_opcao', optionId)
        .eq('seq_usuario', user.id)
        .maybeSingle();

      if (existingVote) {
        // Remove vote
        await supabase.from('tab_enquete_voto').delete().eq('cod_voto', existingVote.cod_voto);
      } else {
        // Add vote
        await supabase.from('tab_enquete_voto').insert({
          seq_opcao: optionId,
          seq_usuario: user.id,
        });
      }

      await fetchAnnouncements();
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível registrar seu voto.',
        variant: 'destructive',
      });
    }
  }, [user, toast, fetchAnnouncements]);

  return {
    announcements,
    activeAnnouncements: announcements.filter((a) => a.active),
    bannerAnnouncements: announcements.filter((a) => a.active && a.templateType === 'banner' && a.imageUrl),
    isLoading,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    uploadImage,
    vote,
    refetch: fetchAnnouncements,
  };
}
