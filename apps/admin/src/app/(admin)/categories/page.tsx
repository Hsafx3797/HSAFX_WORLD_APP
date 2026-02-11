/**
 * Categories Management Page
 * CRUD for tool categories with drag-and-drop reordering
 */

'use client';

import { useState, useCallback } from 'react';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  GripVertical,
  Search,
  Wrench,
} from 'lucide-react';
import { useCategories, useCategoryMutations } from '@/lib/hooks';
import type { ToolCategory } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Input,
  Modal,
  ConfirmModal,
  FormGroup,
  Textarea,
  Badge,
} from '@/components/ui';

// Emoji picker options
const CATEGORY_ICONS = [
  '✏️', '🔄', '🎬', '🖼️', '📊', '🔢', '🔐', '📝', '⚙️', '🧮',
  '📁', '🗂️', '📋', '🔍', '💡', '🎨', '📐', '🧪', '🚀', '💾',
  '🔗', '📦', '🛠️', '⚡', '🌐', '📱', '💻', '🖥️', '📄', '✨',
];

export default function CategoriesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '📁',
    sortOrder: 0,
  });

  const { categories, isLoading, refresh } = useCategories();
  const mutations = useCategoryMutations();

  const filteredCategories = categories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      icon: '📁',
      sortOrder: categories.length,
    });
  }, [categories.length]);

  const openCreateModal = useCallback(() => {
    resetForm();
    setShowCreateModal(true);
  }, [resetForm]);

  const openEditModal = useCallback((category: ToolCategory) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      icon: category.icon || '📁',
      sortOrder: category.sortOrder || 0,
    });
    setShowEditModal(true);
  }, []);

  const handleCreate = useCallback(async () => {
    await mutations.create({
      name: formData.name,
      slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
      description: formData.description,
      icon: formData.icon,
      sortOrder: formData.sortOrder,
    });
    setShowCreateModal(false);
    resetForm();
    refresh();
  }, [formData, mutations, resetForm, refresh]);

  const handleUpdate = useCallback(async () => {
    if (!selectedCategory) return;
    await mutations.update(selectedCategory.id, {
      name: formData.name,
      description: formData.description,
      icon: formData.icon,
      sortOrder: formData.sortOrder,
    });
    setShowEditModal(false);
    setSelectedCategory(null);
    refresh();
  }, [selectedCategory, formData, mutations, refresh]);

  const handleDelete = useCallback(async () => {
    if (!selectedCategory) return;
    await mutations.remove(selectedCategory.id);
    setShowDeleteModal(false);
    setSelectedCategory(null);
    refresh();
  }, [selectedCategory, mutations, refresh]);

  const generateSlug = useCallback((name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-chart-2/10 rounded-lg">
            <FolderTree className="h-6 w-6 text-chart-2" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Categories</h1>
            <p className="text-sm text-muted-foreground">
              Organize tools into categories
            </p>
          </div>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={openCreateModal}>
          Add Category
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Categories</p>
            <p className="text-2xl font-bold text-foreground">{categories.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Tools</p>
            <p className="text-2xl font-bold text-primary">
              {categories.reduce((sum, cat) => sum + (cat.toolCount || 0), 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Avg Tools/Category</p>
            <p className="text-2xl font-bold text-chart-4">
              {categories.length ? Math.round(categories.reduce((sum, cat) => sum + (cat.toolCount || 0), 0) / categories.length) : 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent>
          <Input
            placeholder="Search categories..."
            icon={<Search className="h-4 w-4" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Categories Grid */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : filteredCategories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderTree className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground">No categories found</p>
            <Button className="mt-4" onClick={openCreateModal}>
              Create First Category
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filteredCategories.map((category) => (
            <Card key={category.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{category.icon || '📁'}</span>
                    <div>
                      <h3 className="font-semibold text-foreground">{category.name}</h3>
                      <p className="text-sm text-muted-foreground font-mono">{category.slug}</p>
                    </div>
                  </div>
                  <button className="p-1 text-muted-foreground hover:text-foreground cursor-grab">
                    <GripVertical className="h-5 w-5" />
                  </button>
                </div>
                
                {category.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {category.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="default">{category.toolCount || 0} tools</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Edit2 className="h-4 w-4" />}
                      onClick={() => openEditModal(category)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 className="h-4 w-4" />}
                      onClick={() => {
                        setSelectedCategory(category);
                        setShowDeleteModal(true);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Create Category"
        size="lg"
      >
        <FormGroup>
          <Input
            label="Name"
            placeholder="Text Tools"
            value={formData.name}
            onChange={(e) => {
              setFormData((prev) => ({
                ...prev,
                name: e.target.value,
                slug: generateSlug(e.target.value),
              }));
            }}
            required
          />
          <Input
            label="Slug"
            placeholder="text-tools"
            value={formData.slug}
            onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
            hint="URL-friendly identifier (auto-generated from name)"
          />
          <Textarea
            label="Description"
            placeholder="Describe this category..."
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            rows={2}
          />
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Icon</label>
            <div className="flex flex-wrap gap-2 p-3 border border-border rounded-lg bg-muted/50">
              {CATEGORY_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, icon }))}
                  className={`w-10 h-10 flex items-center justify-center text-xl rounded-lg transition-colors ${
                    formData.icon === icon
                      ? 'bg-primary/10 ring-2 ring-primary'
                      : 'hover:bg-muted'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <Input
            label="Sort Order"
            type="number"
            min={0}
            value={formData.sortOrder}
            onChange={(e) => setFormData((prev) => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={mutations.loading} disabled={!formData.name}>
              Create Category
            </Button>
          </div>
        </FormGroup>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCategory(null);
        }}
        title="Edit Category"
        description={selectedCategory?.slug}
        size="lg"
      >
        <FormGroup>
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            rows={2}
          />
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Icon</label>
            <div className="flex flex-wrap gap-2 p-3 border border-border rounded-lg bg-muted/50">
              {CATEGORY_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, icon }))}
                  className={`w-10 h-10 flex items-center justify-center text-xl rounded-lg transition-colors ${
                    formData.icon === icon
                      ? 'bg-primary/10 ring-2 ring-primary'
                      : 'hover:bg-muted'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <Input
            label="Sort Order"
            type="number"
            min={0}
            value={formData.sortOrder}
            onChange={(e) => setFormData((prev) => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button onClick={handleUpdate} loading={mutations.loading}>Save Changes</Button>
          </div>
        </FormGroup>
      </Modal>

      {/* Delete Modal */}
      <ConfirmModal
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedCategory(null);
        }}
        onConfirm={handleDelete}
        title="Delete Category"
        message={`Are you sure you want to delete "${selectedCategory?.name}"? All tools in this category will become uncategorized.`}
        confirmText="Delete"
        variant="danger"
        loading={mutations.loading}
      />
    </div>
  );
}
