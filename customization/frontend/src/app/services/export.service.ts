import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ExportService {

  exportToCsv(data: Record<string, any>[], filename: string): void {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(';'),
      ...data.map(row =>
        headers.map(h => {
          const val = row[h];
          if (val === null || val === undefined) return '';
          const str = String(val).replace(/"/g, '""');
          return str.includes(';') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
        }).join(';')
      )
    ];
    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
