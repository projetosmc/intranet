import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Image, 
  Video, 
  FileText, 
  Search, 
  Grid3X3, 
  List, 
  Trash2, 
  Edit2, 
  History, 
  Download,
  X,
  Plus,
  Clock,
  User,
  FileUp,
  Filter
} from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useKnowledgeBase, KnowledgeItem, KnowledgeVersion } from '@/hooks/useKnowledgeBase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const typeIcons = {
  imagem: Image,
  video: Video,
  documento: FileText,
};

const typeLabels = {
  imagem: 'Imagem',
  video: 'Vídeo',
  documento: 'Documento',
};

const typeColors = {
  imagem: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  video: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  documento: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
};

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function KnowledgeBasePage() {
  const { items, isLoading, addItem, updateItem, deleteItem, fetchVersions } = useKnowledgeBase();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isVersionsOpen, setIsVersionsOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);
  const [versions, setVersions] = useState<KnowledgeVersion[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const filteredItems = items.filter((item) => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setUploadFile(files[0]);
      setUploadTitle(files[0].name.replace(/\.[^/.]+$/, ''));
      setIsUploadOpen(true);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
      setIsUploadOpen(true);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadTitle.trim()) return;
    
    setIsUploading(true);
    const success = await addItem(uploadFile, uploadTitle.trim(), uploadDescription.trim() || undefined);
    setIsUploading(false);
    
    if (success) {
      setIsUploadOpen(false);
      setUploadFile(null);
      setUploadTitle('');
      setUploadDescription('');
    }
  };

  const handleEdit = (item: KnowledgeItem) => {
    setSelectedItem(item);
    setUploadTitle(item.title);
    setUploadDescription(item.description || '');
    setUploadFile(null);
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedItem || !uploadTitle.trim()) return;
    
    setIsUploading(true);
    const success = await updateItem(selectedItem.id, {
      title: uploadTitle.trim(),
      description: uploadDescription.trim() || undefined,
      file: uploadFile || undefined,
    });
    setIsUploading(false);
    
    if (success) {
      setIsEditOpen(false);
      setSelectedItem(null);
      setUploadFile(null);
      setUploadTitle('');
      setUploadDescription('');
    }
  };

  const handleDelete = (item: KnowledgeItem) => {
    setSelectedItem(item);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedItem) return;
    await deleteItem(selectedItem.id);
    setIsDeleteOpen(false);
    setSelectedItem(null);
  };

  const handleViewVersions = async (item: KnowledgeItem) => {
    setSelectedItem(item);
    const itemVersions = await fetchVersions(item.id);
    setVersions(itemVersions);
    setIsVersionsOpen(true);
  };

  const handlePreview = (item: KnowledgeItem) => {
    setSelectedItem(item);
    setIsPreviewOpen(true);
  };

  const renderPreview = (item: KnowledgeItem, className?: string) => {
    if (item.type === 'imagem') {
      return (
        <img
          src={item.fileUrl}
          alt={item.title}
          className={cn("object-cover", className)}
        />
      );
    }
    if (item.type === 'video') {
      return (
        <video
          src={item.fileUrl}
          className={cn("object-cover", className)}
          controls={false}
          muted
        />
      );
    }
    const Icon = typeIcons[item.type];
    return (
      <div className={cn("flex items-center justify-center bg-muted", className)}>
        <Icon className="h-12 w-12 text-muted-foreground" />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs isLoading={isLoading} />
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold">Base de Conhecimento</h1>
          <p className="text-muted-foreground mt-1">
            Biblioteca de imagens, vídeos e documentos
          </p>
        </div>
        <Button onClick={() => fileInputRef.current?.click()} className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Arquivo
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
          onChange={handleFileSelect}
          className="hidden"
        />
      </motion.div>

      {/* Drop Zone */}
      <motion.div
        ref={dropZoneRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-border hover:border-primary/50"
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <div className={cn(
            "p-4 rounded-full transition-colors",
            isDragging ? "bg-primary/10" : "bg-muted"
          )}>
            <FileUp className={cn(
              "h-8 w-8 transition-colors",
              isDragging ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          <div>
            <p className="font-medium">
              {isDragging ? "Solte o arquivo aqui" : "Arraste e solte arquivos aqui"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              ou clique no botão acima para selecionar
            </p>
          </div>
          <div className="flex gap-2 mt-2">
            <Badge variant="secondary" className="gap-1">
              <Image className="h-3 w-3" /> Imagens
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Video className="h-3 w-3" /> Vídeos
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <FileText className="h-3 w-3" /> Documentos
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="imagem">Imagens</SelectItem>
              <SelectItem value="video">Vídeos</SelectItem>
              <SelectItem value="documento">Documentos</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      {isLoading ? (
        <div className={cn(
          viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            : "space-y-3"
        )}>
          {[...Array(8)].map((_, i) => (
            viewMode === 'grid' ? (
              <div key={i} className="glass-card rounded-xl overflow-hidden">
                <Skeleton className="h-40 w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ) : (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            )
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Nenhum arquivo encontrado</p>
          <p className="text-muted-foreground">
            {searchTerm || filterType !== 'all'
              ? 'Tente ajustar os filtros'
              : 'Comece adicionando seu primeiro arquivo'}
          </p>
        </motion.div>
      ) : viewMode === 'grid' ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, index) => {
              const Icon = typeIcons[item.type];
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card rounded-xl overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handlePreview(item)}
                >
                  <div className="relative h-40 bg-muted">
                    {renderPreview(item, "w-full h-full")}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(item);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewVersions(item);
                          }}
                        >
                          <History className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Badge className={cn("absolute top-2 left-2", typeColors[item.type])}>
                      <Icon className="h-3 w-3 mr-1" />
                      {typeLabels[item.type]}
                    </Badge>
                    <Badge variant="outline" className="absolute top-2 right-2 bg-background/80">
                      v{item.version}
                    </Badge>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium line-clamp-1">{item.title}</h3>
                    {item.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {item.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{format(new Date(item.updatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span className="truncate">{item.updatedByName}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, index) => {
              const Icon = typeIcons[item.type];
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.03 }}
                  className="glass-card rounded-xl p-4 flex items-center gap-4 group hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handlePreview(item)}
                >
                  <div className="h-16 w-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                    {renderPreview(item, "w-full h-full")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">{item.title}</h3>
                      <Badge className={cn("flex-shrink-0", typeColors[item.type])}>
                        <Icon className="h-3 w-3 mr-1" />
                        {typeLabels[item.type]}
                      </Badge>
                      <Badge variant="outline" className="flex-shrink-0">
                        v{item.version}
                      </Badge>
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {item.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(item.updatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {item.updatedByName}
                      </span>
                      <span>{formatFileSize(item.fileSize)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(item);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewVersions(item);
                      }}
                    >
                      <History className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Arquivo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {uploadFile && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                {uploadFile.type.startsWith('image/') ? (
                  <Image className="h-8 w-8 text-blue-500" />
                ) : uploadFile.type.startsWith('video/') ? (
                  <Video className="h-8 w-8 text-purple-500" />
                ) : (
                  <FileText className="h-8 w-8 text-amber-500" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{uploadFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(uploadFile.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setUploadFile(null);
                    setUploadTitle('');
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="Título do arquivo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="Descrição opcional"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!uploadFile || !uploadTitle.trim() || isUploading}
            >
              {isUploading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Arquivo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Título *</Label>
              <Input
                id="edit-title"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="Título do arquivo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="Descrição opcional"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Substituir arquivo (nova versão)</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadFile ? uploadFile.name : 'Selecionar novo arquivo'}
                </Button>
                {uploadFile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setUploadFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {uploadFile && (
                <p className="text-sm text-muted-foreground">
                  Isso criará a versão {(selectedItem?.version || 0) + 1}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={!uploadTitle.trim() || isUploading}
            >
              {isUploading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover arquivo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover "{selectedItem?.title}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Versions Dialog */}
      <Dialog open={isVersionsOpen} onOpenChange={setIsVersionsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Histórico de Versões</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4 max-h-[400px] overflow-y-auto">
            {versions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum histórico disponível
              </p>
            ) : (
              versions.map((version) => (
                <div
                  key={version.id}
                  className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex-shrink-0">
                    <Badge variant="outline">v{version.version}</Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{version.fileName}</p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{format(new Date(version.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                      <span>•</span>
                      <span>{version.userName}</span>
                      <span>•</span>
                      <span>{formatFileSize(version.fileSize)}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                  >
                    <a href={version.fileUrl} download target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedItem?.title}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedItem?.type === 'imagem' && (
              <img
                src={selectedItem.fileUrl}
                alt={selectedItem.title}
                className="w-full max-h-[60vh] object-contain rounded-lg"
              />
            )}
            {selectedItem?.type === 'video' && (
              <video
                src={selectedItem.fileUrl}
                controls
                className="w-full max-h-[60vh] rounded-lg"
              />
            )}
            {selectedItem?.type === 'documento' && (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-4">{selectedItem.fileName}</p>
                <Button asChild>
                  <a href={selectedItem.fileUrl} download target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    Baixar arquivo
                  </a>
                </Button>
              </div>
            )}
            {selectedItem && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                {selectedItem.description && (
                  <p className="text-sm mb-3">{selectedItem.description}</p>
                )}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {format(new Date(selectedItem.updatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {selectedItem.updatedByName}
                  </span>
                  <Badge variant="outline">Versão {selectedItem.version}</Badge>
                  <span>{formatFileSize(selectedItem.fileSize)}</span>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
