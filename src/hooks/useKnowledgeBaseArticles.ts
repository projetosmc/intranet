import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLoadingState } from '@/hooks/useLoadingState';

export interface KBCategory {
  id: string;
  name: string;
  description: string | null;
  order: number;
}

export interface KBTag {
  id: string;
  name: string;
  order: number;
}

export interface KBArticle {
  id: string;
  title: string;
  summary: string;
  type: 'FAQ' | 'HOWTO' | 'TROUBLESHOOT' | 'RUNBOOK' | 'POLITICA' | 'POSTMORTEM';
  categoryId: string | null;
  categoryName?: string;
  system: string | null;
  audience: string;
  contentMd: string;
  synonyms: string[];
  prerequisites: string[];
  estimatedTime: string | null;
  toolLink: string | null;
  status: 'RASCUNHO' | 'EM_REVISAO' | 'PUBLICADO' | 'ARQUIVADO';
  ownerId: string | null;
  reviewerId: string | null;
  version: number;
  isCritical: boolean;
  helpfulUp: number;
  helpfulDown: number;
  views: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  tags?: KBTag[];
  isFavorite?: boolean;
}

export interface KBArticleVersion {
  id: string;
  articleId: string;
  version: number;
  title: string;
  summary: string;
  contentMd: string;
  userId: string;
  userName: string;
  changes: string | null;
  createdAt: string;
}

export type ArticleType = KBArticle['type'];
export type ArticleStatus = KBArticle['status'];

export const ARTICLE_TYPES: { value: ArticleType; label: string; color: string }[] = [
  { value: 'FAQ', label: 'FAQ', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  { value: 'HOWTO', label: 'How-to', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  { value: 'TROUBLESHOOT', label: 'Troubleshooting', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  { value: 'RUNBOOK', label: 'Runbook', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  { value: 'POLITICA', label: 'Política', color: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200' },
  { value: 'POSTMORTEM', label: 'Pós-incidente', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
];

export const ARTICLE_STATUS: { value: ArticleStatus; label: string; color: string }[] = [
  { value: 'RASCUNHO', label: 'Rascunho', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
  { value: 'EM_REVISAO', label: 'Em Revisão', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  { value: 'PUBLICADO', label: 'Publicado', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  { value: 'ARQUIVADO', label: 'Arquivado', color: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200' },
];

export function useKnowledgeBaseArticles() {
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [categories, setCategories] = useState<KBCategory[]>([]);
  const [tags, setTags] = useState<KBTag[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const { isLoading, withLoading } = useLoadingState(true);
  const { toast } = useToast();

  const fetchCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from('tab_kb_categoria')
      .select('*')
      .eq('ind_ativo', true)
      .order('num_ordem');

    if (error) {
      console.error('Error fetching categories:', error);
      return;
    }

    setCategories((data || []).map((c: any) => ({
      id: c.cod_categoria,
      name: c.des_nome,
      description: c.des_descricao,
      order: c.num_ordem,
    })));
  }, []);

  const fetchTags = useCallback(async () => {
    const { data, error } = await supabase
      .from('tab_kb_tag')
      .select('*')
      .eq('ind_ativo', true)
      .order('num_ordem');

    if (error) {
      console.error('Error fetching tags:', error);
      return;
    }

    setTags((data || []).map((t: any) => ({
      id: t.cod_tag,
      name: t.des_nome,
      order: t.num_ordem,
    })));
  }, []);

  const fetchFavorites = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('tab_kb_favorito')
      .select('cod_artigo')
      .eq('seq_usuario', user.id);

    if (error) {
      console.error('Error fetching favorites:', error);
      return;
    }

    setFavorites((data || []).map((f: any) => f.cod_artigo));
  }, []);

  const fetchArticles = useCallback(async () => {
    try {
      await withLoading(async () => {
        const { data, error } = await supabase
          .from('tab_kb_artigo')
          .select(`
            *,
            tab_kb_categoria(des_nome),
            tab_kb_artigo_tag(
              tab_kb_tag(cod_tag, des_nome, num_ordem)
            )
          `)
          .eq('ind_ativo', true)
          .order('dta_atualizacao', { ascending: false });

        if (error) throw error;

        const mapped: KBArticle[] = (data || []).map((a: any) => ({
          id: a.cod_artigo,
          title: a.des_titulo,
          summary: a.des_resumo,
          type: a.des_tipo,
          categoryId: a.cod_categoria,
          categoryName: a.tab_kb_categoria?.des_nome,
          system: a.des_sistema,
          audience: a.des_publico,
          contentMd: a.des_conteudo_md,
          synonyms: a.arr_sinonimos || [],
          prerequisites: a.arr_pre_requisitos || [],
          estimatedTime: a.des_tempo_estimado,
          toolLink: a.des_link_ferramenta,
          status: a.ind_status,
          ownerId: a.cod_owner,
          reviewerId: a.cod_revisor,
          version: a.num_versao,
          isCritical: a.ind_critico,
          helpfulUp: a.num_helpful_up,
          helpfulDown: a.num_helpful_down,
          views: a.num_views,
          createdAt: a.dta_criacao,
          updatedAt: a.dta_atualizacao,
          publishedAt: a.dta_publicacao,
          tags: (a.tab_kb_artigo_tag || []).map((at: any) => ({
            id: at.tab_kb_tag?.cod_tag,
            name: at.tab_kb_tag?.des_nome,
            order: at.tab_kb_tag?.num_ordem,
          })).filter((t: any) => t.id),
          isFavorite: favorites.includes(a.cod_artigo),
        }));

        setArticles(mapped);
      }, 'articles');
    } catch (error) {
      console.error('Error fetching articles:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar artigos',
        variant: 'destructive',
      });
    }
  }, [withLoading, toast, favorites]);

  const getArticleById = useCallback(async (id: string): Promise<KBArticle | null> => {
    try {
      const { data, error } = await supabase
        .from('tab_kb_artigo')
        .select(`
          *,
          tab_kb_categoria(des_nome),
          tab_kb_artigo_tag(
            tab_kb_tag(cod_tag, des_nome, num_ordem)
          )
        `)
        .eq('cod_artigo', id)
        .single();

      if (error) throw error;

      return {
        id: data.cod_artigo,
        title: data.des_titulo,
        summary: data.des_resumo,
        type: data.des_tipo as ArticleType,
        categoryId: data.cod_categoria,
        categoryName: data.tab_kb_categoria?.des_nome,
        system: data.des_sistema,
        audience: data.des_publico,
        contentMd: data.des_conteudo_md,
        synonyms: data.arr_sinonimos || [],
        prerequisites: data.arr_pre_requisitos || [],
        estimatedTime: data.des_tempo_estimado,
        toolLink: data.des_link_ferramenta,
        status: data.ind_status as ArticleStatus,
        ownerId: data.cod_owner,
        reviewerId: data.cod_revisor,
        version: data.num_versao,
        isCritical: data.ind_critico,
        helpfulUp: data.num_helpful_up,
        helpfulDown: data.num_helpful_down,
        views: data.num_views,
        createdAt: data.dta_criacao,
        updatedAt: data.dta_atualizacao,
        publishedAt: data.dta_publicacao,
        tags: (data.tab_kb_artigo_tag || []).map((at: any) => ({
          id: at.tab_kb_tag?.cod_tag,
          name: at.tab_kb_tag?.des_nome,
          order: at.tab_kb_tag?.num_ordem,
        })).filter((t: any) => t.id),
        isFavorite: favorites.includes(data.cod_artigo),
      };
    } catch (error) {
      console.error('Error fetching article:', error);
      return null;
    }
  }, [favorites]);

  const createArticle = async (article: Partial<KBArticle>, tagIds: string[]): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const userName = user.user_metadata?.full_name || user.email || 'Usuário';

      const { data, error } = await supabase
        .from('tab_kb_artigo')
        .insert({
          des_titulo: article.title,
          des_resumo: article.summary,
          des_tipo: article.type,
          cod_categoria: article.categoryId,
          des_sistema: article.system,
          des_publico: article.audience || 'TODOS',
          des_conteudo_md: article.contentMd,
          arr_sinonimos: article.synonyms || [],
          arr_pre_requisitos: article.prerequisites || [],
          des_tempo_estimado: article.estimatedTime,
          des_link_ferramenta: article.toolLink,
          ind_status: article.status || 'RASCUNHO',
          cod_owner: user.id,
          ind_critico: article.isCritical || false,
          dta_publicacao: article.status === 'PUBLICADO' ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) throw error;

      // Inserir tags
      if (tagIds.length > 0) {
        const tagInserts = tagIds.map(tagId => ({
          cod_artigo: data.cod_artigo,
          cod_tag: tagId,
        }));
        await supabase.from('tab_kb_artigo_tag').insert(tagInserts);
      }

      // Criar versão inicial
      await supabase.from('tab_kb_artigo_versao').insert({
        cod_artigo: data.cod_artigo,
        num_versao: 1,
        des_titulo: article.title,
        des_resumo: article.summary,
        des_conteudo_md: article.contentMd,
        seq_usuario: user.id,
        des_nome_usuario: userName,
        des_mudancas: 'Versão inicial',
      });

      toast({
        title: 'Sucesso',
        description: 'Artigo criado com sucesso',
      });

      await fetchArticles();
      return data.cod_artigo;
    } catch (error) {
      console.error('Error creating article:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar artigo',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateArticle = async (
    articleId: string,
    updates: Partial<KBArticle>,
    tagIds?: string[],
    changes?: string
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const userName = user.user_metadata?.full_name || user.email || 'Usuário';

      // Buscar versão atual
      const { data: currentArticle } = await supabase
        .from('tab_kb_artigo')
        .select('num_versao, des_titulo, des_resumo, des_conteudo_md')
        .eq('cod_artigo', articleId)
        .single();

      const newVersion = (currentArticle?.num_versao || 0) + 1;

      const updateData: any = {
        dta_atualizacao: new Date().toISOString(),
        num_versao: newVersion,
      };

      if (updates.title) updateData.des_titulo = updates.title;
      if (updates.summary) updateData.des_resumo = updates.summary;
      if (updates.type) updateData.des_tipo = updates.type as string;
      if (updates.categoryId !== undefined) updateData.cod_categoria = updates.categoryId;
      if (updates.system !== undefined) updateData.des_sistema = updates.system;
      if (updates.audience) updateData.des_publico = updates.audience;
      if (updates.contentMd) updateData.des_conteudo_md = updates.contentMd;
      if (updates.synonyms) updateData.arr_sinonimos = updates.synonyms;
      if (updates.prerequisites) updateData.arr_pre_requisitos = updates.prerequisites;
      if (updates.estimatedTime !== undefined) updateData.des_tempo_estimado = updates.estimatedTime;
      if (updates.toolLink !== undefined) updateData.des_link_ferramenta = updates.toolLink;
      if (updates.status) {
        updateData.ind_status = updates.status as string;
        if (updates.status === 'PUBLICADO') {
          updateData.dta_publicacao = new Date().toISOString();
        }
      }
      if (updates.reviewerId !== undefined) updateData.cod_revisor = updates.reviewerId;
      if (updates.isCritical !== undefined) updateData.ind_critico = updates.isCritical;

      const { error } = await supabase
        .from('tab_kb_artigo')
        .update(updateData)
        .eq('cod_artigo', articleId);

      if (error) throw error;

      // Atualizar tags se fornecidas
      if (tagIds !== undefined) {
        await supabase.from('tab_kb_artigo_tag').delete().eq('cod_artigo', articleId);
        if (tagIds.length > 0) {
          const tagInserts = tagIds.map(tagId => ({
            cod_artigo: articleId,
            cod_tag: tagId,
          }));
          await supabase.from('tab_kb_artigo_tag').insert(tagInserts);
        }
      }

      // Criar registro de versão
      await supabase.from('tab_kb_artigo_versao').insert({
        cod_artigo: articleId,
        num_versao: newVersion,
        des_titulo: updates.title || currentArticle?.des_titulo,
        des_resumo: updates.summary || currentArticle?.des_resumo,
        des_conteudo_md: updates.contentMd || currentArticle?.des_conteudo_md,
        seq_usuario: user.id,
        des_nome_usuario: userName,
        des_mudancas: changes || 'Atualização',
      });

      toast({
        title: 'Sucesso',
        description: 'Artigo atualizado com sucesso',
      });

      await fetchArticles();
      return true;
    } catch (error) {
      console.error('Error updating article:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar artigo',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteArticle = async (articleId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('tab_kb_artigo')
        .update({ ind_ativo: false })
        .eq('cod_artigo', articleId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Artigo removido com sucesso',
      });

      await fetchArticles();
      return true;
    } catch (error) {
      console.error('Error deleting article:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao remover artigo',
        variant: 'destructive',
      });
      return false;
    }
  };

  const toggleFavorite = async (articleId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const isFav = favorites.includes(articleId);

      if (isFav) {
        await supabase
          .from('tab_kb_favorito')
          .delete()
          .eq('cod_artigo', articleId)
          .eq('seq_usuario', user.id);
        setFavorites(prev => prev.filter(id => id !== articleId));
      } else {
        await supabase
          .from('tab_kb_favorito')
          .insert({ cod_artigo: articleId, seq_usuario: user.id });
        setFavorites(prev => [...prev, articleId]);
      }

      return true;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      return false;
    }
  };

  const registerView = async (articleId: string): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('tab_kb_visualizacao').insert({
        cod_artigo: articleId,
        seq_usuario: user.id,
      });
    } catch (error) {
      console.error('Error registering view:', error);
    }
  };

  const submitFeedback = async (
    articleId: string,
    helpful: boolean,
    comment?: string
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      await supabase
        .from('tab_kb_feedback')
        .upsert({
          cod_artigo: articleId,
          seq_usuario: user.id,
          ind_helpful: helpful,
          des_comentario: comment,
        }, { onConflict: 'cod_artigo,seq_usuario' });

      toast({
        title: 'Obrigado!',
        description: 'Seu feedback foi registrado',
      });

      return true;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao enviar feedback',
        variant: 'destructive',
      });
      return false;
    }
  };

  const fetchVersions = async (articleId: string): Promise<KBArticleVersion[]> => {
    try {
      const { data, error } = await supabase
        .from('tab_kb_artigo_versao')
        .select('*')
        .eq('cod_artigo', articleId)
        .order('num_versao', { ascending: false });

      if (error) throw error;

      return (data || []).map((v: any) => ({
        id: v.cod_versao,
        articleId: v.cod_artigo,
        version: v.num_versao,
        title: v.des_titulo,
        summary: v.des_resumo,
        contentMd: v.des_conteudo_md,
        userId: v.seq_usuario,
        userName: v.des_nome_usuario,
        changes: v.des_mudancas,
        createdAt: v.dta_cadastro,
      }));
    } catch (error) {
      console.error('Error fetching versions:', error);
      return [];
    }
  };

  const searchArticles = useCallback((
    query: string,
    filters: {
      categoryId?: string;
      type?: ArticleType;
      system?: string;
      audience?: string;
      status?: ArticleStatus;
    }
  ): KBArticle[] => {
    const searchLower = query.toLowerCase();

    return articles.filter(article => {
      // Filtros
      if (filters.categoryId && article.categoryId !== filters.categoryId) return false;
      if (filters.type && article.type !== filters.type) return false;
      if (filters.system && article.system !== filters.system) return false;
      if (filters.audience && article.audience !== filters.audience) return false;
      if (filters.status && article.status !== filters.status) return false;

      // Busca
      if (!query) return true;

      const matchTitle = article.title.toLowerCase().includes(searchLower);
      const matchSummary = article.summary.toLowerCase().includes(searchLower);
      const matchContent = article.contentMd.toLowerCase().includes(searchLower);
      const matchSynonyms = article.synonyms.some(s => s.toLowerCase().includes(searchLower));
      const matchTags = article.tags?.some(t => t.name.toLowerCase().includes(searchLower));
      const matchSystem = article.system?.toLowerCase().includes(searchLower);
      const matchCategory = article.categoryName?.toLowerCase().includes(searchLower);

      return matchTitle || matchSummary || matchContent || matchSynonyms || matchTags || matchSystem || matchCategory;
    });
  }, [articles]);

  const getMostViewed = useCallback((limit = 5): KBArticle[] => {
    return [...articles]
      .filter(a => a.status === 'PUBLICADO')
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);
  }, [articles]);

  const getMostHelpful = useCallback((limit = 5): KBArticle[] => {
    return [...articles]
      .filter(a => a.status === 'PUBLICADO')
      .sort((a, b) => (b.helpfulUp - b.helpfulDown) - (a.helpfulUp - a.helpfulDown))
      .slice(0, limit);
  }, [articles]);

  const getRecent = useCallback((limit = 5): KBArticle[] => {
    return [...articles]
      .filter(a => a.status === 'PUBLICADO')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
  }, [articles]);

  const getFavorites = useCallback((): KBArticle[] => {
    return articles.filter(a => favorites.includes(a.id));
  }, [articles, favorites]);

  const getUniqueSystems = useCallback((): string[] => {
    const systems = new Set<string>();
    articles.forEach(a => {
      if (a.system) systems.add(a.system);
    });
    return Array.from(systems).sort();
  }, [articles]);

  const getUniqueAudiences = useCallback((): string[] => {
    const audiences = new Set<string>();
    articles.forEach(a => {
      if (a.audience) audiences.add(a.audience);
    });
    return Array.from(audiences).sort();
  }, [articles]);

  useEffect(() => {
    fetchCategories();
    fetchTags();
    fetchFavorites();
  }, [fetchCategories, fetchTags, fetchFavorites]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  return {
    articles,
    categories,
    tags,
    favorites,
    isLoading,
    fetchArticles,
    getArticleById,
    createArticle,
    updateArticle,
    deleteArticle,
    toggleFavorite,
    registerView,
    submitFeedback,
    fetchVersions,
    searchArticles,
    getMostViewed,
    getMostHelpful,
    getRecent,
    getFavorites,
    getUniqueSystems,
    getUniqueAudiences,
  };
}
