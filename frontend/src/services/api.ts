import { DocumentItem, DocumentDetail, Finding, AuditLogEntry, PolicyItem, AnalyticsData, DemoItem, RedactionMode, FindingStatus } from '../types';

const API_BASE = '/api';

export async function uploadDocument(file: File, policyId: string = 'policy_default'): Promise<DocumentItem> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('policy_id', policyId);

  const res = await fetch(`${API_BASE}/documents/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(errorData.detail || 'Upload failed');
  }

  return res.json();
}

export async function batchUploadDocuments(files: File[], policyId: string = 'policy_default'): Promise<DocumentItem[]> {
  const formData = new FormData();
  files.forEach(f => formData.append('files', f));
  formData.append('policy_id', policyId);

  const res = await fetch(`${API_BASE}/documents/batch-upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Batch upload failed' }));
    throw new Error(errorData.detail || 'Batch upload failed');
  }

  return res.json();
}

export async function listDocuments(): Promise<DocumentItem[]> {
  const res = await fetch(`${API_BASE}/documents`);
  if (!res.ok) throw new Error('Failed to load documents');
  return res.json();
}

export async function getDocument(id: string): Promise<DocumentDetail> {
  const res = await fetch(`${API_BASE}/documents/${id}`);
  if (!res.ok) throw new Error('Failed to load document details');
  return res.json();
}

export function getDocumentPreviewUrl(id: string, page: number = 1): string {
  return `${API_BASE}/documents/${id}/preview/${page}?t=${Date.now()}`;
}

export async function redactDocument(
  id: string,
  payload: {
    default_mode?: RedactionMode;
    finding_ids?: string[];
    custom_replacements?: Record<string, string>;
  }
): Promise<{ document_id: string; redacted_filename: string; redacted_count: number; download_url: string }> {
  const res = await fetch(`${API_BASE}/documents/${id}/redact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Redaction failed' }));
    throw new Error(errorData.detail || 'Redaction failed');
  }

  return res.json();
}

export function getSanitizedDownloadUrl(id: string): string {
  return `${API_BASE}/documents/${id}/download`;
}

export async function deleteDocument(id: string): Promise<{ status: string; message: string }> {
  const res = await fetch(`${API_BASE}/documents/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete document');
  return res.json();
}

export function getBatchExportUrl(): string {
  return `${API_BASE}/documents/export/batch-zip`;
}

export async function updateFinding(
  findingId: string,
  update: { status?: FindingStatus; redaction_mode?: RedactionMode }
): Promise<Finding> {
  const res = await fetch(`${API_BASE}/findings/${findingId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update),
  });

  if (!res.ok) throw new Error('Failed to update finding');
  return res.json();
}

export async function getAnalytics(): Promise<AnalyticsData> {
  const res = await fetch(`${API_BASE}/analytics`);
  if (!res.ok) throw new Error('Failed to load analytics');
  return res.json();
}

export async function getAuditLogs(action?: string, severity?: string, limit: number = 50): Promise<AuditLogEntry[]> {
  const params = new URLSearchParams();
  if (action) params.append('action', action);
  if (severity) params.append('severity', severity);
  params.append('limit', limit.toString());

  const res = await fetch(`${API_BASE}/audit?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to load audit logs');
  return res.json();
}

export async function getPolicies(): Promise<PolicyItem[]> {
  const res = await fetch(`${API_BASE}/policies`);
  if (!res.ok) throw new Error('Failed to load policies');
  return res.json();
}

export async function listDemos(): Promise<DemoItem[]> {
  const res = await fetch(`${API_BASE}/demo/list`);
  if (!res.ok) throw new Error('Failed to load demo list');
  return res.json();
}

export async function loadDemoDocument(demoId: string): Promise<DocumentItem> {
  const res = await fetch(`${API_BASE}/demo/load/${demoId}`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to load demo' }));
    throw new Error(err.detail || 'Failed to load demo');
  }
  return res.json();
}
