'use client';

import { useState, useCallback } from 'react';
import { Mail, Plus, Edit, Eye, EyeOff } from 'lucide-react';
import { useEmailTemplates, useEmailTemplateMutations } from '@/lib/hooks';
import type { EmailTemplate } from '@/lib/types';
import {
  Card, CardHeader, CardContent,
  Button, Badge, Modal,
  Input, Textarea, Toggle, FormGroup,
} from '@/components/ui';

type FormData = {
  slug: string;
  name: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  variables: string;
  isActive: boolean;
};

const emptyForm: FormData = { slug: '', name: '', subject: '', htmlBody: '', textBody: '', variables: '', isActive: true };

function toFormData(t: EmailTemplate): FormData {
  return {
    slug: t.slug,
    name: t.name,
    subject: t.subject,
    htmlBody: t.htmlBody,
    textBody: t.textBody ?? '',
    variables: (t.variables ?? []).join(', '),
    isActive: t.isActive,
  };
}

export default function EmailTemplatesPage() {
  const { templates, isLoading, refresh } = useEmailTemplates();
  const mutations = useEmailTemplateMutations();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

  const openCreate = useCallback(() => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((t: EmailTemplate) => {
    setEditing(t);
    setForm(toFormData(t));
    setModalOpen(true);
  }, []);

  const openPreview = useCallback((html: string) => {
    setPreviewHtml(html);
    setPreviewOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
    const vars = form.variables
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    await mutations.save({
      slug: form.slug,
      name: form.name,
      subject: form.subject,
      htmlBody: form.htmlBody,
      textBody: form.textBody || undefined,
      variables: vars.length ? vars : undefined,
      isActive: form.isActive,
    });
    setModalOpen(false);
    refresh();
  }, [form, mutations, refresh]);

  const set = (key: keyof FormData, value: string | boolean) =>
    setForm((p) => ({ ...p, [key]: value }));

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Mail className="h-6 w-6" /> Email Templates
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{templates.length} template(s)</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate}>Create Template</Button>
      </div>

      {/* Template Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((t) => (
          <Card key={t.id}>
            <CardHeader
              title={t.name}
              description={t.slug}
              action={
                <Badge variant={t.isActive ? 'success' : 'default'}>
                  {t.isActive ? 'Active' : 'Inactive'}
                </Badge>
              }
            />
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Subject:</span>{' '}
                  <span className="text-foreground">{t.subject}</span>
                </div>
                {t.variables && t.variables.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {t.variables.map((v) => (
                      <Badge key={v} variant="muted">{`{{${v}}}`}</Badge>
                    ))}
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  Updated {new Date(t.updatedAt).toLocaleDateString()}
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" icon={<Edit className="h-3 w-3" />} onClick={() => openEdit(t)}>
                  Edit
                </Button>
                <Button variant="ghost" size="sm" icon={<Eye className="h-3 w-3" />} onClick={() => openPreview(t.htmlBody)}>
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-lg font-medium text-foreground">No email templates</p>
            <p className="text-sm text-muted-foreground mt-1">Create your first template to get started.</p>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Template' : 'Create Template'}
        description={editing ? `Editing "${editing.name}"` : 'Create a new email template'}
      >
        <FormGroup>
          <Input label="Slug" value={form.slug} onChange={(e) => set('slug', e.target.value)} disabled={!!editing} placeholder="e.g. welcome-email" />
          <Input label="Name" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Welcome Email" />
          <Input label="Subject" value={form.subject} onChange={(e) => set('subject', e.target.value)} placeholder="Welcome to {{appName}}" />
          <Textarea label="HTML Body" value={form.htmlBody} onChange={(e) => set('htmlBody', e.target.value)} rows={8} placeholder="<h1>Hello {{userName}}</h1>..." />
          <Textarea label="Text Body (optional)" value={form.textBody} onChange={(e) => set('textBody', e.target.value)} rows={3} placeholder="Plain text fallback..." />
          <Input label="Variables (comma separated)" value={form.variables} onChange={(e) => set('variables', e.target.value)} placeholder="userName, resetLink, appName" />
          <Toggle label="Active" checked={form.isActive} onChange={(checked) => set('isActive', checked)} />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={mutations.loading} disabled={!form.slug || !form.name || !form.subject || !form.htmlBody}>
              {editing ? 'Update' : 'Create'}
            </Button>
          </div>
        </FormGroup>
      </Modal>

      {/* Preview Modal */}
      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="Template Preview">
        <div className="border border-border rounded-lg p-4 bg-card max-h-96 overflow-y-auto">
          <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </div>
        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => setPreviewOpen(false)}>Close</Button>
        </div>
      </Modal>
    </div>
  );
}
