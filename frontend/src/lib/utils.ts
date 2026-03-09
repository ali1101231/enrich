import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m`;
}

export function maskApiKey(key: string): string {
  if (key.length <= 8) return '****';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function detectColumnType(values: string[]): string {
  const patterns = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
    linkedin: /linkedin\.com\/(in|company)\//i,
    url: /^https?:\/\//i,
    domain: /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/,
  };

  const sampleSize = Math.min(values.length, 20);
  const sample = values.slice(0, sampleSize).filter(v => v && v.trim());
  
  if (sample.length === 0) return 'text';

  for (const [type, pattern] of Object.entries(patterns)) {
    const matches = sample.filter(v => pattern.test(v.trim()));
    if (matches.length >= sample.length * 0.7) {
      return type;
    }
  }

  return 'text';
}

export function autoDetectColumns(headers: string[], rows: Record<string, string>[]): Record<string, { field: string; confidence: number }> {
  const mapping: Record<string, { field: string; confidence: number }> = {};
  
  const fieldAliases: Record<string, string[]> = {
    email: ['email', 'e-mail', 'email_address', 'mail'],
    linkedin_url: ['linkedin', 'linkedin_url', 'profile_url', 'linkedin_profile', 'url'],
    phone: ['phone', 'phone_number', 'mobile', 'cell', 'telephone'],
    name: ['name', 'full_name', 'fullname', 'contact_name'],
    first_name: ['first_name', 'firstname', 'first'],
    last_name: ['last_name', 'lastname', 'last', 'surname'],
    company: ['company', 'company_name', 'organization', 'org', 'employer'],
    title: ['title', 'job_title', 'position', 'role'],
    domain: ['domain', 'website', 'company_domain', 'url'],
  };

  headers.forEach(header => {
    const headerLower = header.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    for (const [field, aliases] of Object.entries(fieldAliases)) {
      if (aliases.some(alias => headerLower.includes(alias))) {
        mapping[header] = { field, confidence: 0.9 };
        return;
      }
    }
    
    const values = rows.map(row => row[header] || '');
    const detectedType = detectColumnType(values);
    
    if (detectedType !== 'text') {
      const fieldMap: Record<string, string> = {
        email: 'email',
        phone: 'phone',
        linkedin: 'linkedin_url',
        url: 'url',
        domain: 'domain',
      };
      
      if (fieldMap[detectedType]) {
        mapping[header] = { field: fieldMap[detectedType], confidence: 0.7 };
        return;
      }
    }
    
    mapping[header] = { field: 'text', confidence: 0.3 };
  });

  return mapping;
}
