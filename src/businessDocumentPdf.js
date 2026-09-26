import {jsPDF} from 'jspdf';
import {money, titleFor, totalsFor, validateDocument} from './businessDocuments.js';

// The two unmodified images are extracted from the user-provided reference PDF.
export function buildDocumentPdf(doc, assets) {
  const invalid = validateDocument(doc);
  if (invalid) throw new Error(invalid);
  const pdf = new jsPDF({unit:'mm', format:'a4'});
  const total = totalsFor(doc);
  const left = 16, right = 194, width = right-left;
  let y = 0;
  const text = (value,x,at,size=10,bold=false,options={}) => {
    pdf.setFont('helvetica',bold?'bold':'normal'); pdf.setFontSize(size); pdf.setTextColor('#202F4D');
    pdf.text(String(value),x,at,options);
  };
  const wrap = (value,w,size=10) => {pdf.setFont('helvetica','normal');pdf.setFontSize(size);return pdf.splitTextToSize(String(value),w);};
  const line = at => {pdf.setDrawColor('#B1B7C1');pdf.setLineWidth(.25);pdf.line(left,at,right,at);};
  const header = () => {
    text(titleFor(doc.type).toUpperCase(),105,25,27,true,{align:'center'});line(34);
    text(`${titleFor(doc.type)} no.: ${doc.number}`,left,44,9,true);
    text(`Date: ${doc.date.split('-').reverse().join('/')}`,right,50,9,false,{align:'right'});
    y=59;
  };
  const nextPage = () => {pdf.addPage();header();};
  const ensure = height => {if (y+height>251) nextPage();};
  const paragraph = (value,w=width) => {
    for(const part of wrap(value,w)) {ensure(5);text(part,left,y);y+=5;}
  };
  header();
  const seller=wrap(doc.seller,82), buyer=wrap(doc.buyer,82);
  text('SELLER',left,y,9,true);text('BUYER',110,y,9,true);y+=7;
  for(let i=0;i<Math.max(seller.length,buyer.length);i++) {
    ensure(5);if(seller[i])text(seller[i],left,y);if(buyer[i])text(buyer[i],110,y);y+=5;
  }
  y+=9;
  const tableHead = () => {
    pdf.setFillColor('#202F4D');pdf.rect(left,y,width,10,'F');
    pdf.setFont('helvetica','bold');pdf.setFontSize(8);pdf.setTextColor('#FFFFFF');
    pdf.text('ITEM',19,y+6.5);pdf.text('QTY',112,y+6.5,{align:'right'});
    pdf.text(`UNIT PRICE (${doc.currency})`,153,y+6.5,{align:'right'});pdf.text(`TOTAL (${doc.currency})`,191,y+6.5,{align:'right'});y+=16;
  };
  ensure(22);tableHead();
  doc.items.forEach((item,index) => {
    const description=wrap(item.description,77,10);
    if(y+Math.min(description.length,5)*5+5>249){nextPage();tableHead();}
    const n=digits => Number(digits).toLocaleString('en-US',{minimumFractionDigits:doc.currency==='OMR'?3:2,maximumFractionDigits:doc.currency==='OMR'?3:2});
    text(item.quantity,112,y,9,false,{align:'right'});text(n(item.unitPrice),153,y,9,false,{align:'right'});text(n(total.lines[index]),191,y,9,false,{align:'right'});
    description.forEach(part=>{if(y+5>249){nextPage();tableHead();}text(part,19,y);y+=5;});
    line(y);y+=7;
  });
  // Keep totals and approval together when they need a new page.
  ensure(doc.notes.trim()?29:85);y+=3;
  for(const [label,value] of [['SUBTOTAL',total.subtotal],[`VAT (${Number(doc.vatRate)}%)`,total.vat],[doc.type==='invoice'?'TOTAL AMOUNT DUE':'QUOTATION TOTAL',total.total]]) {
    text(label,left,y,10,true);text(money(value,doc.currency),right,y,11,true,{align:'right'});y+=8;
  }
  if(doc.notes.trim()){y+=5;ensure(12);text('NOTES / TERMS',left,y,9,true);y+=6;paragraph(doc.notes);}
  ensure(49);y=Math.max(y+9,211);
  const signatory=wrap(doc.signatory,90,9);
  // Allow long edited signatory details without colliding with the fixed images.
  if(y+signatory.length*4+35>260){nextPage();y=190;}
  signatory.forEach(part=>{text(part,148,y,9,false,{align:'center'});y+=4;});
  pdf.addImage(assets.stamp,'JPEG',112,y+1,30,30);
  pdf.addImage(assets.signature,'JPEG',158,y+1,30,30);
  const pages=pdf.getNumberOfPages();
  for(let page=1;page<=pages;page++) {
    pdf.setPage(page);line(271);
    const footer=wrap(`${doc.company} · RN: ${doc.registration} · ${doc.address} · GSM: ${doc.phone}`,width,8);
    // Split edited footer details across multiple lines, using the reserved bottom margin.
    const footerSize=footer.length>3?6:8;
    const footerLines=wrap(`${doc.company} · RN: ${doc.registration} · ${doc.address} · GSM: ${doc.phone}`,width,footerSize);
    footerLines.slice(0,6).forEach((part,i)=>text(part,105,276+i*2.7,footerSize,false,{align:'center'}));
    text(`${page} / ${pages}`,right,295,7,false,{align:'right'});
  }
  return pdf;
}
