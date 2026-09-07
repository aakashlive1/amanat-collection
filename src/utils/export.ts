/**
 * Excel / CSV Exporter utility with UTF-8 BOM for flawless opening in Microsoft Excel
 */

export interface ExportMetadata {
  title?: string;
  subtitle?: string;
  summary?: Record<string, string | number>;
}

export const exportToCsv = (
  filename: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][],
  metadata?: ExportMetadata
): void => {
  const lines: string[] = [];

  // Helper to escape CSV field
  const escapeField = (val: unknown): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  };

  // Optional Metadata Header in Excel format
  if (metadata?.title) {
    lines.push(escapeField(metadata.title));
  }
  if (metadata?.subtitle) {
    lines.push(escapeField(metadata.subtitle));
  }
  if (metadata?.title || metadata?.subtitle) {
    lines.push(escapeField(`Generated on: ${new Date().toLocaleString('en-IN')}`));
    lines.push(''); // blank line
  }

  // Summary Metrics Header if available
  if (metadata?.summary) {
    lines.push(escapeField('SUMMARY METRICS'));
    Object.entries(metadata.summary).forEach(([key, val]) => {
      lines.push(`${escapeField(key)},${escapeField(val)}`);
    });
    lines.push(''); // blank line
  }

  // Table Headers
  lines.push(headers.map(escapeField).join(','));

  // Data Rows
  rows.forEach(row => {
    lines.push(row.map(escapeField).join(','));
  });

  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
