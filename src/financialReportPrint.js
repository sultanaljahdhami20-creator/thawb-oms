// Clone the displayed historical report so printing never reads current balances.
export function openFinancialReportPrint(report, rtl) {
  if (!report) return false;
  const preview = window.open('', '_blank');
  if (!preview) return false;
  preview.opener = null;
  const doc = preview.document;
  doc.open();
  doc.write('<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>');
  doc.close();
  doc.documentElement.lang = rtl ? 'ar' : 'en';
  doc.documentElement.dir = rtl ? 'rtl' : 'ltr';
  doc.title = rtl ? 'ثوب — تقرير مالي' : 'THAWB — Financial Report';
  const style = doc.createElement('style');
  style.textContent = `
    @page { size: A4; margin: 14mm; }
    body { margin: 24px auto; max-width: 1000px; font-family: Tahoma, Arial, sans-serif; color: #1e293b; background: white; }
    #financial-report, #financial-report * { color: #1e293b !important; background-color: white !important; }
    #financial-report button { display: none !important; }
    #financial-report div { overflow: visible !important; }
    h2 { font-size: 20px !important; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th, td { padding: 9px 7px !important; border-bottom: 1px solid #cbd5e1; font-size: 11px !important; overflow-wrap: anywhere; }
    th { background: #eef2f7 !important; }
    tr { break-inside: avoid; }
    thead { display: table-header-group; }
    h2, p { break-inside: avoid; }
    .print-toolbar { margin-bottom: 20px; }
    .print-toolbar button { padding: 10px 20px; cursor: pointer; }
    @media print { body { margin: 0; max-width: none; } .print-toolbar { display: none; } }
  `;
  doc.head.append(style);
  const toolbar = doc.createElement('div');
  toolbar.className = 'print-toolbar';
  const button = doc.createElement('button');
  button.textContent = rtl ? 'طباعة / حفظ PDF' : 'Print / Save PDF';
  button.onclick = () => preview.print();
  toolbar.append(button);
  doc.body.append(toolbar, doc.importNode(report, true));
  preview.focus();
  doc.fonts.ready.then(() => { if (!preview.closed) preview.print(); });
  return true;
}
