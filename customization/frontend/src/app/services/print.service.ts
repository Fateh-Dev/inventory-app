import { Injectable } from '@angular/core';
import { StockMovementDto } from '../modules/stock/models/stock.models';

const UNIT_FR: Record<string, string> = {
  Piece: 'Pièce', Liter: 'Litre', Kilogram: 'Kg', Meter: 'Mètre',
  SquareMeter: 'm²', CubicMeter: 'm³', Box: 'Carton', Pallet: 'Palette',
  Roll: 'Rouleau', Bag: 'Sac', Can: 'Bidon', Set: 'Ensemble'
};

const TYPE_FR: Record<string, string> = {
  Reception: 'BON DE RÉCEPTION', Issue: 'BON DE SORTIE / DISTRIBUTION',
  Transfer: 'BON DE TRANSFERT', Return: 'BON DE RETOUR',
  Adjustment: "BON D'AJUSTEMENT", Disposal: 'BON DE MISE AU REBUT'
};

@Injectable({ providedIn: 'root' })
export class PrintService {

  printMovement(movement: StockMovementDto): void {
    const title = TYPE_FR[movement.type] || movement.type.toUpperCase();
    const dateStr = new Date(movement.movementDate).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    const isReception = movement.type === 'Reception';

    const linesHtml = (movement.lines || []).map((l, i) => `
      <tr>
        <td style="text-align:center">${i + 1}</td>
        <td><span style="font-family:monospace;font-size:11px;color:#0284c7">${l.stockItemReference || '—'}</span></td>
        <td style="font-weight:600">${l.stockItemName || '—'}</td>
        <td style="text-align:right;font-weight:700">${l.quantity}</td>
        <td style="text-align:center">${UNIT_FR[l.unit] || l.unit}</td>
        ${isReception ? `<td style="text-align:right">${l.unitCost?.toFixed(2) || '0.00'}</td>
        <td style="text-align:right;font-weight:700">${((l.quantity || 0) * (l.unitCost || 0)).toFixed(2)}</td>` : ''}
        ${l.lotNumber ? `<td>${l.lotNumber}</td>` : (isReception ? '' : '<td>—</td>')}
        ${l.notes ? `<td style="font-size:11px;color:#666">${l.notes}</td>` : '<td></td>'}
      </tr>`).join('');

    const total = isReception ? (movement.lines || []).reduce((s, l) => s + (l.quantity * (l.unitCost || 0)), 0) : 0;

    const infoRows = [
      movement.sourceWarehouseName ? `<tr><td class="label">Dépôt source</td><td>${movement.sourceWarehouseName}</td></tr>` : '',
      movement.destinationWarehouseName ? `<tr><td class="label">Dépôt destination</td><td>${movement.destinationWarehouseName}</td></tr>` : '',
      movement.supplierName ? `<tr><td class="label">Fournisseur</td><td>${movement.supplierName}</td></tr>` : '',
      movement.departmentName ? `<tr><td class="label">Département</td><td>${movement.departmentName}</td></tr>` : '',
      movement.reference ? `<tr><td class="label">Référence</td><td>${movement.reference}</td></tr>` : '',
      movement.notes ? `<tr><td class="label">Notes</td><td>${movement.notes}</td></tr>` : '',
    ].filter(Boolean).join('');

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>${title} — ${movement.movementNumber}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1e293b; padding: 30px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; border-bottom: 3px solid #0284c7; padding-bottom: 16px; }
  .company { font-size: 22px; font-weight: 800; color: #0284c7; }
  .company-sub { font-size: 12px; color: #64748b; margin-top: 4px; }
  .doc-title { text-align: right; }
  .doc-title h1 { font-size: 16px; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px; }
  .doc-title .num { font-size: 22px; font-weight: 900; color: #0284c7; margin-top: 4px; font-family: monospace; }
  .doc-title .date { font-size: 11px; color: #64748b; margin-top: 4px; }
  .info-section { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
  .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; }
  .info-box h3 { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
  .info-box table { width: 100%; border-collapse: collapse; }
  .info-box td { padding: 3px 0; font-size: 12px; }
  .info-box td.label { color: #64748b; width: 45%; font-weight: 600; }
  table.lines { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  table.lines th { background: #0284c7; color: white; padding: 8px 10px; font-size: 11px; font-weight: 700; text-align: left; text-transform: uppercase; letter-spacing: 0.3px; }
  table.lines td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
  table.lines tr:nth-child(even) td { background: #f8fafc; }
  .total-row { background: #0284c7 !important; color: white; font-weight: 700; }
  .total-row td { color: white !important; padding: 10px !important; }
  .signatures { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 40px; }
  .sig-box { border-top: 2px solid #1e293b; padding-top: 10px; }
  .sig-box .sig-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; }
  .sig-box .sig-name { font-size: 12px; color: #1e293b; margin-top: 4px; }
  .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
  @media print {
    body { padding: 15px; }
    @page { margin: 1cm; }
  }
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="company">FTH — Gestion de Stock</div>
    <div class="company-sub">Matériaux d'Infrastructure</div>
  </div>
  <div class="doc-title">
    <h1>${title}</h1>
    <div class="num">${movement.movementNumber}</div>
    <div class="date">${dateStr}</div>
  </div>
</div>

<div class="info-section">
  <div class="info-box">
    <h3>Informations du mouvement</h3>
    <table>
      <tr><td class="label">Créé par</td><td>${movement.createdByUser}</td></tr>
      <tr><td class="label">Statut</td><td>${movement.status}</td></tr>
      ${infoRows}
    </table>
  </div>
  <div class="info-box">
    <h3>Résumé</h3>
    <table>
      <tr><td class="label">Nombre d'articles</td><td>${(movement.lines || []).length}</td></tr>
      <tr><td class="label">Quantité totale</td><td>${(movement.lines || []).reduce((s, l) => s + l.quantity, 0)}</td></tr>
      ${isReception ? `<tr><td class="label" style="font-weight:800;color:#0284c7">Valeur totale</td><td style="font-weight:800;color:#0284c7">${total.toFixed(2)} DZD</td></tr>` : ''}
    </table>
  </div>
</div>

<table class="lines">
  <thead>
    <tr>
      <th style="width:40px">#</th>
      <th style="width:100px">Référence</th>
      <th>Désignation</th>
      <th style="text-align:right">Quantité</th>
      <th>Unité</th>
      ${isReception ? '<th style="text-align:right">P.U. (DZD)</th><th style="text-align:right">Total (DZD)</th>' : ''}
      <th>N° Lot</th>
      <th>Remarques</th>
    </tr>
  </thead>
  <tbody>
    ${linesHtml}
  </tbody>
  ${isReception ? `<tfoot>
    <tr class="total-row">
      <td colspan="6" style="text-align:right;font-size:13px">TOTAL GÉNÉRAL :</td>
      <td style="font-size:15px">${total.toFixed(2)} DZD</td>
      <td colspan="2"></td>
    </tr>
  </tfoot>` : ''}
</table>

<div class="signatures">
  <div class="sig-box">
    <div class="sig-label">Établi par</div>
    <div class="sig-name">${movement.createdByUser}</div>
    <div style="height:50px;margin-top:8px;"></div>
    <div style="font-size:10px;color:#94a3b8">Signature et cachet</div>
  </div>
  <div class="sig-box">
    <div class="sig-label">Magasinier / Responsable</div>
    <div class="sig-name"> </div>
    <div style="height:50px;margin-top:8px;"></div>
    <div style="font-size:10px;color:#94a3b8">Signature et cachet</div>
  </div>
  <div class="sig-box">
    <div class="sig-label">Destinataire / Validation</div>
    <div class="sig-name"> </div>
    <div style="height:50px;margin-top:8px;"></div>
    <div style="font-size:10px;color:#94a3b8">Signature et cachet</div>
  </div>
</div>

<div class="footer">
  Document généré automatiquement le ${new Date().toLocaleDateString('fr-FR')} — FTH Stock Management System
</div>

<script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }</script>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  }

  printReport(title: string, headers: string[], rows: string[][], totals?: string[]): void {
    const tableRows = rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('');
    const totalRow = totals ? `<tfoot><tr class="total-row">${totals.map(t => `<td>${t}</td>`).join('')}</tr></tfoot>` : '';

    const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>${title}</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1e293b; padding: 30px; }
  h1 { font-size: 18px; color: #0284c7; margin-bottom: 6px; }
  .date { font-size: 11px; color: #64748b; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #0284c7; color: white; padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; }
  td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; }
  tr:nth-child(even) td { background: #f8fafc; }
  .total-row td { background: #0f172a; color: white; font-weight: 700; padding: 10px; }
  @media print { @page { margin: 1cm; } }
</style>
</head>
<body>
<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #0284c7;padding-bottom:12px;margin-bottom:20px;">
  <div><h1>${title}</h1><div class="date">FTH Stock — ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</div></div>
</div>
<table>
  <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
  <tbody>${tableRows}</tbody>
  ${totalRow}
</table>
<script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }</script>
</body></html>`;

    const win = window.open('', '_blank', 'width=1000,height=700');
    if (win) { win.document.write(html); win.document.close(); }
  }

  printItemCard(item: any, lots: any[], history: any[]): void {
    const dateStr = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const lotsHtml = (lots || []).map(l => `
      <tr>
        <td><code style="font-family:monospace;font-weight:bold">${l.lotNumber || '—'}</code></td>
        <td>${l.warehouseName || '—'}</td>
        <td style="text-align:right;font-weight:bold">${l.currentQuantity} ${UNIT_FR[l.currentUnit] || l.currentUnit}</td>
        <td>${l.expiryDate ? new Date(l.expiryDate).toLocaleDateString('fr-FR') : '—'}</td>
        <td style="text-align:right">${l.unitCost?.toFixed(2) || '0.00'} DZD</td>
      </tr>`).join('');

    const historyHtml = (history || []).map(h => `
      <tr>
        <td>${new Date(h.movementDate).toLocaleDateString('fr-FR')}</td>
        <td><span style="font-family:monospace;font-size:11px;color:#0284c7">${h.movementNumber}</span></td>
        <td>${h.typeFr || h.type}</td>
        <td style="text-align:right;font-weight:700">${h.quantity} ${UNIT_FR[h.unit] || h.unit}</td>
        <td>${h.sourceWarehouseName || h.supplierName || '—'}</td>
        <td>${h.destinationWarehouseName || h.departmentName || '—'}</td>
        <td>${h.createdByUser || '—'}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>FICHE ARTICLE — ${item.reference}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1e293b; padding: 30px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; border-bottom: 3px solid #0284c7; padding-bottom: 16px; }
  .company { font-size: 22px; font-weight: 800; color: #0284c7; }
  .company-sub { font-size: 12px; color: #64748b; margin-top: 4px; }
  .doc-title { text-align: right; }
  .doc-title h1 { font-size: 16px; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px; }
  .doc-title .ref { font-size: 20px; font-weight: 900; color: #0284c7; margin-top: 4px; font-family: monospace; }
  .doc-title .date { font-size: 11px; color: #64748b; margin-top: 4px; }
  .info-section { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
  .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; }
  .info-box h3 { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
  .info-box table { width: 100%; border-collapse: collapse; }
  .info-box td { padding: 4px 0; font-size: 12px; }
  .info-box td.label { color: #64748b; width: 45%; font-weight: 600; }
  h2 { font-size: 14px; color: #0284c7; margin-top: 24px; margin-bottom: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; text-transform: uppercase; }
  table.data-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  table.data-table th { background: #f1f5f9; color: #475569; padding: 6px 10px; font-size: 11px; font-weight: 700; text-align: left; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; }
  table.data-table td { padding: 6px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
  table.data-table tr:nth-child(even) td { background: #f8fafc; }
  .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
  @media print {
    body { padding: 15px; }
    @page { margin: 1cm; }
  }
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="company">FTH — Gestion de Stock</div>
    <div class="company-sub">Fiche Article</div>
  </div>
  <div class="doc-title">
    <h1>FICHE ARTICLE</h1>
    <div class="ref">${item.reference}</div>
    <div class="date">Généré le ${dateStr}</div>
  </div>
</div>

<div class="info-section">
  <div class="info-box">
    <h3>Détails du Matériau</h3>
    <table>
      <tr><td class="label">Désignation</td><td><strong>${item.name}</strong></td></tr>
      <tr><td class="label">Catégorie</td><td>${item.categoryName || '—'}</td></tr>
      <tr><td class="label">Marque / Modèle</td><td>${item.brandName ? `${item.brandName} ${item.brandModelName || ''}` : '—'}</td></tr>
      <tr><td class="label">Unité par défaut</td><td>${UNIT_FR[item.defaultUnit] || item.defaultUnit}</td></tr>
      <tr><td class="label">Seuil stock faible</td><td>${item.defaultLowStockThreshold}</td></tr>
    </table>
  </div>
  <div class="info-box">
    <h3>État du Stock</h3>
    <table>
      <tr><td class="label" style="font-size:14px;">Stock global actuel</td><td style="font-size:14px;font-weight:800;color:${item.isLowStock ? '#ef4444' : '#22c55e'}">${item.totalQuantity} ${UNIT_FR[item.defaultUnit] || item.defaultUnit}</td></tr>
      <tr><td class="label">Statut</td><td><strong style="color:${item.isActive ? '#22c55e' : '#64748b'}">${item.isActive ? 'ACTIF' : 'INACTIF'}</strong></td></tr>
      <tr><td class="label">Lots actifs</td><td>${lots.length}</td></tr>
    </table>
  </div>
</div>

<h2>Répartition des lots en stock</h2>
<table class="data-table">
  <thead>
    <tr>
      <th>N° Lot</th>
      <th>Entrepôt / Dépôt</th>
      <th style="text-align:right">Quantité</th>
      <th>Péremption</th>
      <th style="text-align:right">Coût unitaire</th>
    </tr>
  </thead>
  <tbody>
    ${lotsHtml || '<tr><td colspan="5" style="text-align:center;color:#64748b">Aucun lot actif en stock</td></tr>'}
  </tbody>
</table>

<h2>Historique des mouvements</h2>
<table class="data-table">
  <thead>
    <tr>
      <th>Date</th>
      <th>N° Mouvement</th>
      <th>Type</th>
      <th style="text-align:right">Quantité</th>
      <th>Provenance</th>
      <th>Destination</th>
      <th>Par</th>
    </tr>
  </thead>
  <tbody>
    ${historyHtml || '<tr><td colspan="7" style="text-align:center;color:#64748b">Aucun mouvement enregistré</td></tr>'}
  </tbody>
</table>

<div class="footer">
  FTH Stock Management System — Fiche imprimée le ${new Date().toLocaleDateString('fr-FR')}
</div>

<script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }</script>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  }
}
