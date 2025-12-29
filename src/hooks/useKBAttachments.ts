import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface KBAttachment {
  id: string;
  articleId: string;
  name: string;
  type: string | null;
  url: string;
  sizeBytes: number | null;
  createdAt: string;
}

export function useKBAttachments(articleId?: string) {
  const [attachments, setAttachments] = useState<KBAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fetchAttachments = useCallback(async () => {
    if (!articleId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tab_kb_anexo')
        .select('*')
        .eq('cod_artigo', articleId)
        .order('dta_cadastro', { ascending: false });

      if (error) throw error;

      setAttachments((data || []).map((a: any) => ({
        id: a.cod_anexo,
        articleId: a.cod_artigo,
        name: a.des_nome,
        type: a.des_tipo,
        url: a.des_url,
        sizeBytes: a.num_tamanho_bytes,
        createdAt: a.dta_cadastro,
      })));
    } catch (error) {
      console.error('Error fetching attachments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [articleId]);

  const getFileType = (file: File): string => {
    if (file.type.startsWith('image/')) return 'imagem';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type === 'application/pdf') return 'pdf';
    if (file.type.includes('spreadsheet') || file.type.includes('excel')) return 'planilha';
    if (file.type.includes('document') || file.type.includes('word')) return 'documento';
    if (file.type.includes('presentation') || file.type.includes('powerpoint')) return 'apresentacao';
    return 'arquivo';
  };

  const uploadAttachment = async (file: File, targetArticleId: string): Promise<KBAttachment | null> => {
    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${targetArticleId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('kb-attachments')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('kb-attachments')
        .getPublicUrl(fileName);

      // Save attachment record
      const { data, error } = await supabase
        .from('tab_kb_anexo')
        .insert({
          cod_artigo: targetArticleId,
          des_nome: file.name,
          des_tipo: getFileType(file),
          des_url: urlData.publicUrl,
          num_tamanho_bytes: file.size,
          seq_usuario: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      const newAttachment: KBAttachment = {
        id: data.cod_anexo,
        articleId: data.cod_artigo,
        name: data.des_nome,
        type: data.des_tipo,
        url: data.des_url,
        sizeBytes: data.num_tamanho_bytes,
        createdAt: data.dta_cadastro,
      };

      setAttachments(prev => [newAttachment, ...prev]);
      toast.success(`Arquivo "${file.name}" enviado com sucesso`);
      
      return newAttachment;
    } catch (error) {
      console.error('Error uploading attachment:', error);
      toast.error('Erro ao enviar arquivo');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteAttachment = async (attachmentId: string): Promise<boolean> => {
    try {
      const attachment = attachments.find(a => a.id === attachmentId);
      if (!attachment) return false;

      // Extract file path from URL
      const urlParts = attachment.url.split('/kb-attachments/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from('kb-attachments').remove([filePath]);
      }

      // Delete database record
      const { error } = await supabase
        .from('tab_kb_anexo')
        .delete()
        .eq('cod_anexo', attachmentId);

      if (error) throw error;

      setAttachments(prev => prev.filter(a => a.id !== attachmentId));
      toast.success('Anexo removido');
      return true;
    } catch (error) {
      console.error('Error deleting attachment:', error);
      toast.error('Erro ao remover anexo');
      return false;
    }
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return {
    attachments,
    isLoading,
    isUploading,
    fetchAttachments,
    uploadAttachment,
    deleteAttachment,
    formatFileSize,
  };
}
