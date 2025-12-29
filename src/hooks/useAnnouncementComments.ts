import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AnnouncementComment, AnnouncementAuthor } from '@/types/announcements';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export function useAnnouncementComments(announcementId: string) {
  const [comments, setComments] = useState<AnnouncementComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchComments = useCallback(async () => {
    if (!announcementId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tab_comunicado_comentario')
        .select('*')
        .eq('seq_comunicado', announcementId)
        .order('dta_cadastro', { ascending: true });

      if (error) throw error;

      // Fetch authors for all comments
      const userIds = [...new Set((data || []).map((c: any) => c.seq_usuario))];
      const { data: profiles } = await supabase
        .from('tab_perfil_usuario')
        .select('cod_usuario, des_nome_completo, des_avatar_url')
        .in('cod_usuario', userIds);

      const profileMap = new Map(
        (profiles || []).map((p: any) => [p.cod_usuario, {
          id: p.cod_usuario,
          name: p.des_nome_completo || 'Usuário',
          avatarUrl: p.des_avatar_url || undefined,
        }])
      );

      const commentsWithAuthors: AnnouncementComment[] = (data || []).map((item: any) => ({
        id: item.cod_comentario,
        announcementId: item.seq_comunicado,
        userId: item.seq_usuario,
        parentId: item.seq_comentario_pai || undefined,
        content: item.des_conteudo,
        edited: item.ind_editado || false,
        createdAt: item.dta_cadastro,
        updatedAt: item.dta_atualizacao,
        author: profileMap.get(item.seq_usuario) || { id: item.seq_usuario, name: 'Usuário' },
      }));

      // Organize into tree structure
      const rootComments: AnnouncementComment[] = [];
      const repliesMap = new Map<string, AnnouncementComment[]>();

      commentsWithAuthors.forEach((comment) => {
        if (comment.parentId) {
          const replies = repliesMap.get(comment.parentId) || [];
          replies.push(comment);
          repliesMap.set(comment.parentId, replies);
        } else {
          rootComments.push(comment);
        }
      });

      // Attach replies to parent comments
      rootComments.forEach((comment) => {
        comment.replies = repliesMap.get(comment.id) || [];
      });

      setComments(rootComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os comentários.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [announcementId, toast]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const addComment = useCallback(async (content: string, parentId?: string) => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para comentar.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('tab_comunicado_comentario')
        .insert({
          seq_comunicado: announcementId,
          seq_usuario: user.id,
          seq_comentario_pai: parentId || null,
          des_conteudo: content,
        });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Comentário adicionado.',
      });

      await fetchComments();
      return true;
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o comentário.',
        variant: 'destructive',
      });
      return false;
    }
  }, [announcementId, user, toast, fetchComments]);

  const updateComment = useCallback(async (commentId: string, content: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('tab_comunicado_comentario')
        .update({
          des_conteudo: content,
          ind_editado: true,
        })
        .eq('cod_comentario', commentId)
        .eq('seq_usuario', user.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Comentário atualizado.',
      });

      await fetchComments();
      return true;
    } catch (error) {
      console.error('Error updating comment:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o comentário.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast, fetchComments]);

  const deleteComment = useCallback(async (commentId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('tab_comunicado_comentario')
        .delete()
        .eq('cod_comentario', commentId)
        .eq('seq_usuario', user.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Comentário excluído.',
      });

      await fetchComments();
      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o comentário.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, toast, fetchComments]);

  return {
    comments,
    isLoading,
    addComment,
    updateComment,
    deleteComment,
    refetch: fetchComments,
  };
}
