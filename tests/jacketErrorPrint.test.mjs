import test from 'node:test';
import assert from 'node:assert/strict';
import {errorPrintDocument} from '../src/jacketErrorPrint.js';

const row={id:7,order_id:'ORD-1',order:{customer:'<script>alert(1)</script>',phone:'123',jackets:5,errorNotes:[{text:'Previous note'}]},wf:{kind:'size',state:'paused',stage:'factory',reason:'Awaiting approval',next:'Call customer'},error_description:'Wrong size',affected_jackets:2,notes:[{type:'note',text:'New measurements',photos:[{url:'data:image/jpeg;base64,AAAA',caption:'Sleeve detail'}]}],relatedReports:[{notes:[{type:'note',text:'Linked note',photos:[{url:'https://example.com/image.jpg',caption:'Linked image'}]}]}]};
test('prints customer details and images without internal data or photo names',()=>{
 const html=errorPrintDocument([row],false);
 for(const value of ['On hold','Wrong size','ORD-1','data:image/jpeg;base64,AAAA'])assert.ok(html.includes(value),value);
 assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
 assert.ok(!html.includes('<script>alert(1)</script>'));
 assert.equal((html.match(/<figure>/g)||[]).length,2);
 assert.ok(html.includes('Promise.all'));
 for(const value of ['Sent to factory','Awaiting approval','Call customer','Previous note','New measurements','Linked note','Sleeve detail','Linked image','<figcaption>'])assert.ok(!html.includes(value),value);
 assert.ok(html.includes('height:49mm'));
});
test('prints multiple Arabic reports and handles legacy reports without images',()=>{
 const html=errorPrintDocument([row,{id:'order:2',order_id:'2',synthetic:true,order:{},wf:{}}]);
 assert.ok(html.includes('dir="rtl"'));
 assert.equal((html.match(/<article class="sheet">/g)||[]).length,2);
 assert.ok(html.includes('نسخة العميل'));
 assert.equal((html.match(/class="attachments"/g)||[]).length,1);
});
