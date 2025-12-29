import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/contexts/UserContext';
import { useLoadingState } from '@/hooks/useLoadingState';

export interface KnowledgeItem {
  id: string;
  title: string;
  description: string | null;
  type: 'imagem' | 'video' | 'documento';
  fileUrl: string;
  fileName: string;
  fileSize: number | null;
  version: number;
  createdBy: string;
  updatedBy: string;
  updatedByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeVersion {
  id: string;
  itemId: string;
  version: number;
  fileUrl: string;
  fileName: string;
  fileSize: number | null;
  userId: string;
  userName: string;
  createdAt: string;
}

export function useKnowledgeBase() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const { isLoading, isLoadingKey, withLoading } = useLoadingState(true);
  const { toast } = useToast();
  const { user } = useUser();

  const fetchItemsAsync = async () => {
    const { data, error } = await supabase
      .from('tab_base_conhecimento')
      .select('*')
      .eq('ind_ativo', true)
      .order('dta_atualizacao', { ascending: false });

    if (error) throw error;

    const mapped: KnowledgeItem[] = (data || []).map((item: any) => ({
      id: item.cod_item,
      title: item.des_titulo,
      description: item.des_descricao,
      type: item.des_tipo,
      fileUrl: item.des_arquivo_url,
      fileName: item.des_arquivo_nome,
      fileSize: item.num_tamanho_bytes,
      version: item.num_versao,
      createdBy: item.seq_usuario_criacao,
      updatedBy: item.seq_usuario_atualizacao,
      updatedByName: item.des_nome_usuario_atualizacao,
      createdAt: item.dta_cadastro,
      updatedAt: item.dta_atualizacao,
    }));

    setItems(mapped);
  };

  const fetchItems = useCallback(async () => {
    try {
      await withLoading(fetchItemsAsync, 'fetch');
    } catch (error) {
      console.error('Error fetching knowledge base:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar base de conhecimento',
        variant: 'destructive',
      });
    }
  }, [toast, withLoading]);

  const fetchVersions = async (itemId: string): Promise<KnowledgeVersion[]> => {
    try {
      const { data, error } = await supabase
        .from('tab_base_conhecimento_versao')
        .select('*')
        .eq('seq_item', itemId)
        .order('num_versao', { ascending: false });

      if (error) throw error;

      return (data || []).map((v: any) => ({
        id: v.cod_versao,
        itemId: v.seq_item,
        version: v.num_versao,
        fileUrl: v.des_arquivo_url,
        fileName: v.des_arquivo_nome,
        fileSize: v.num_tamanho_bytes,
        userId: v.seq_usuario,
        userName: v.des_nome_usuario,
        createdAt: v.dta_cadastro,
      }));
    } catch (error) {
      console.error('Error fetching versions:', error);
      return [];
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('knowledge-base')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('knowledge-base')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao fazer upload do arquivo',
        variant: 'destructive',
      });
      return null;
    }
  };

  const getFileType = (file: File): 'imagem' | 'video' | 'documento' => {
    if (file.type.startsWith('image/')) return 'imagem';
    if (file.type.startsWith('video/')) return 'video';
    return 'documento';
  };

  const addItem = async (file: File, title: string, description?: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const fileUrl = await uploadFile(file);
      if (!fileUrl) return false;

      const userName = user.user_metadata?.full_name || user.email || 'Usuário';

      const { data, error } = await supabase
        .from('tab_base_conhecimento')
        .insert({
          des_titulo: title,
          des_descricao: description || null,
          des_tipo: getFileType(file),
          des_arquivo_url: fileUrl,
          des_arquivo_nome: file.name,
          num_tamanho_bytes: file.size,
          seq_usuario_criacao: user.id,
          seq_usuario_atualizacao: user.id,
          des_nome_usuario_atualizacao: userName,
        })
        .select()
        .single();

      if (error) throw error;

      // Registrar versão inicial
      await supabase.from('tab_base_conhecimento_versao').insert({
        seq_item: data.cod_item,
        num_versao: 1,
        des_arquivo_url: fileUrl,
        des_arquivo_nome: file.name,
        num_tamanho_bytes: file.size,
        seq_usuario: user.id,
        des_nome_usuario: userName,
      });

      toast({
        title: 'Sucesso',
        description: 'Arquivo adicionado com sucesso',
      });

      await fetchItems();
      return true;
    } catch (error) {
      console.error('Error adding item:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao adicionar arquivo',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateItem = async (
    itemId: string,
    updates: { title?: string; description?: string; file?: File }
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const userName = user.user_metadata?.full_name || user.email || 'Usuário';

      // Buscar item atual para pegar a versão
      const { data: currentItem, error: fetchError } = await supabase
        .from('tab_base_conhecimento')
        .select('*')
        .eq('cod_item', itemId)
        .single();

      if (fetchError) throw fetchError;

      const updateData: any = {
        seq_usuario_atualizacao: user.id,
        des_nome_usuario_atualizacao: userName,
      };

      if (updates.title) updateData.des_titulo = updates.title;
      if (updates.description !== undefined) updateData.des_descricao = updates.description;

      // Se há novo arquivo, fazer upload e incrementar versão
      if (updates.file) {
        const fileUrl = await uploadFile(updates.file);
        if (!fileUrl) return false;

        const newVersion = currentItem.num_versao + 1;

        updateData.des_arquivo_url = fileUrl;
        updateData.des_arquivo_nome = updates.file.name;
        updateData.num_tamanho_bytes = updates.file.size;
        updateData.des_tipo = getFileType(updates.file);
        updateData.num_versao = newVersion;

        // Registrar nova versão no histórico
        await supabase.from('tab_base_conhecimento_versao').insert({
          seq_item: itemId,
          num_versao: newVersion,
          des_arquivo_url: fileUrl,
          des_arquivo_nome: updates.file.name,
          num_tamanho_bytes: updates.file.size,
          seq_usuario: user.id,
          des_nome_usuario: userName,
        });
      }

      const { error } = await supabase
        .from('tab_base_conhecimento')
        .update(updateData)
        .eq('cod_item', itemId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: updates.file ? 'Nova versão salva com sucesso' : 'Item atualizado com sucesso',
      });

      await fetchItems();
      return true;
    } catch (error) {
      console.error('Error updating item:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar item',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteItem = async (itemId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('tab_base_conhecimento')
        .update({ ind_ativo: false })
        .eq('cod_item', itemId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Item removido com sucesso',
      });

      await fetchItems();
      return true;
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao remover item',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return {
    items,
    isLoading,
    addItem,
    updateItem,
    deleteItem,
    fetchVersions,
    refetch: fetchItems,
  };
}
