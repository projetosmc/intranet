-- Remover storage objects primeiro, depois buckets
DELETE FROM storage.objects WHERE bucket_id IN ('knowledge-base', 'kb-attachments', 'faqs');
DELETE FROM storage.buckets WHERE id IN ('knowledge-base', 'kb-attachments', 'faqs');