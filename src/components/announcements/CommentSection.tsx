import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, Pencil, Trash2, Reply, X, CornerDownRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAnnouncementComments } from '@/hooks/useAnnouncementComments';
import { useAuth } from '@/hooks/useAuth';
import { AnnouncementComment } from '@/types/announcements';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

interface UserSuggestion {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface CommentSectionProps {
  announcementId: string;
}

export function CommentSection({ announcementId }: CommentSectionProps) {
  const { comments, isLoading, addComment, updateComment, deleteComment } = useAnnouncementComments(announcementId);
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [mentionSearch, setMentionSearch] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // Fetch user suggestions for mentions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (mentionSearch.length < 2) {
        setSuggestions([]);
        return;
      }

      const { data } = await supabase
        .from('tab_perfil_usuario')
        .select('cod_usuario, des_nome_completo, des_avatar_url')
        .ilike('des_nome_completo', `%${mentionSearch}%`)
        .limit(5);

      setSuggestions(
        (data || []).map((p: any) => ({
          id: p.cod_usuario,
          name: p.des_nome_completo || 'Usuário',
          avatarUrl: p.des_avatar_url || undefined,
        }))
      );
    };

    if (showSuggestions) {
      fetchSuggestions();
    }
  }, [mentionSearch, showSuggestions]);

  const handleInputChange = (value: string, setter: (v: string) => void) => {
    setter(value);

    // Check for @ mentions
    const cursorPos = textareaRef.current?.selectionStart || value.length;
    const textBeforeCursor = value.substring(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      setShowSuggestions(true);
      setMentionSearch(mentionMatch[1]);
    } else {
      setShowSuggestions(false);
      setMentionSearch('');
    }
  };

  const insertMention = (userName: string, setter: (v: string) => void, currentValue: string) => {
    const cursorPos = textareaRef.current?.selectionStart || currentValue.length;
    const textBeforeCursor = currentValue.substring(0, cursorPos);
    const textAfterCursor = currentValue.substring(cursorPos);
    const newText = textBeforeCursor.replace(/@\w*$/, `@${userName} `) + textAfterCursor;
    setter(newText);
    setShowSuggestions(false);
    setMentionSearch('');
  };

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    const success = await addComment(newComment.trim(), replyingTo || undefined);
    if (success) {
      setNewComment('');
      setReplyingTo(null);
    }
    setIsSubmitting(false);
  };

  const handleUpdate = async (commentId: string) => {
    if (!editContent.trim()) return;

    setIsSubmitting(true);
    const success = await updateComment(commentId, editContent.trim());
    if (success) {
      setEditingId(null);
      setEditContent('');
    }
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    await deleteComment(deleteId);
    setDeleteId(null);
  };

  const startEdit = (comment: AnnouncementComment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const renderComment = (comment: AnnouncementComment, isReply = false) => {
    const isOwner = user?.id === comment.userId;
    const isEditing = editingId === comment.id;

    return (
      <motion.div
        key={comment.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${isReply ? 'ml-12 mt-3' : ''}`}
      >
        <div className="flex gap-3">
          <Avatar className="h-8 w-8 flex-shrink-0">
            {comment.author.avatarUrl ? (
              <AvatarImage src={comment.author.avatarUrl} alt={comment.author.name} />
            ) : null}
            <AvatarFallback className="text-xs">
              {getInitials(comment.author.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{comment.author.name}</span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: ptBR })}
              </span>
              {comment.edited && (
                <Badge variant="outline" className="text-xs py-0 px-1">
                  editado
                </Badge>
              )}
            </div>

            {isEditing ? (
              <div className="mt-2 space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[60px] text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleUpdate(comment.id)} disabled={isSubmitting}>
                    Salvar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm mt-1 whitespace-pre-wrap break-words">
                  {comment.content.split(/(@\w+)/g).map((part, i) => 
                    part.startsWith('@') ? (
                      <span key={i} className="text-primary font-medium">{part}</span>
                    ) : part
                  )}
                </p>

                <div className="flex items-center gap-2 mt-2">
                  {!isReply && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground"
                      onClick={() => setReplyingTo(comment.id)}
                    >
                      <Reply className="h-3 w-3 mr-1" />
                      Responder
                    </Button>
                  )}
                  {isOwner && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground"
                        onClick={() => startEdit(comment)}
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-destructive"
                        onClick={() => setDeleteId(comment.id)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Excluir
                      </Button>
                    </>
                  )}
                </div>
              </>
            )}

            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-3 space-y-3">
                {comment.replies.map((reply) => renderComment(reply, true))}
              </div>
            )}

            {/* Reply input */}
            {replyingTo === comment.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 flex items-start gap-2"
              >
                <CornerDownRight className="h-4 w-4 text-muted-foreground mt-2" />
                <div className="flex-1 space-y-2">
                  <Textarea
                    ref={textareaRef}
                    value={newComment}
                    onChange={(e) => handleInputChange(e.target.value, setNewComment)}
                    placeholder={`Responder a ${comment.author.name}...`}
                    className="min-h-[60px] text-sm"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSubmit} disabled={isSubmitting || !newComment.trim()}>
                      <Send className="h-3 w-3 mr-1" />
                      Responder
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => {
                      setReplyingTo(null);
                      setNewComment('');
                    }}>
                      <X className="h-3 w-3 mr-1" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const totalComments = comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);

  return (
    <div className="mt-8 pt-6 border-t border-border">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Comentários ({totalComments})</h3>
      </div>

      {/* New comment form */}
      {user && !replyingTo && (
        <div className="mb-6 relative">
          <div className="flex gap-3">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarFallback className="text-xs">
                {user.email?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                ref={textareaRef}
                value={newComment}
                onChange={(e) => handleInputChange(e.target.value, setNewComment)}
                placeholder="Escreva um comentário... Use @ para mencionar usuários"
                className="min-h-[80px]"
              />
              <Button onClick={handleSubmit} disabled={isSubmitting || !newComment.trim()}>
                <Send className="h-4 w-4 mr-2" />
                Comentar
              </Button>
            </div>
          </div>

          {/* Mention suggestions */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute left-11 top-20 z-10 bg-popover border border-border rounded-lg shadow-lg p-2 min-w-[200px]"
              >
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    className="w-full flex items-center gap-2 p-2 hover:bg-muted rounded-md transition-colors"
                    onClick={() => insertMention(s.name.replace(/\s+/g, ''), setNewComment, newComment)}
                  >
                    <Avatar className="h-6 w-6">
                      {s.avatarUrl ? <AvatarImage src={s.avatarUrl} /> : null}
                      <AvatarFallback className="text-xs">{getInitials(s.name)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{s.name}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {!user && (
        <p className="text-sm text-muted-foreground mb-6">
          Faça login para comentar.
        </p>
      )}

      {/* Comments list */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="h-8 w-8 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-12 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhum comentário ainda. Seja o primeiro a comentar!
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => renderComment(comment))}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir comentário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
