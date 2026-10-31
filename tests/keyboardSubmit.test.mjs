import test from 'node:test';
import assert from 'node:assert/strict';
import {handleEnterSubmit} from '../src/keyboardSubmit.js';

function setup() {
  let clicks=0, prevented=0;
  const button={disabled:false,getAttribute:()=>null,getClientRects:()=>[{}],click:()=>clicks++};
  const scope={style:{zIndex:100},closest:()=>null,getClientRects:()=>[{}],querySelector:()=>button};
  const layers=[scope];scope.ownerDocument={querySelectorAll:()=>layers};
  const target={tagName:'INPUT',type:'text',closest:selector=>selector==='form'?null:scope};
  const event={key:'Enter',target,preventDefault:()=>prevented++};
  return {event,target,button,scope,layers,clicks:()=>clicks,prevented:()=>prevented};
}
test('Enter on an amount or text field invokes the same marked save button once', async()=>{
  const f=setup();f.target.type='number';
  handleEnterSubmit(f.event);handleEnterSubmit(f.event);
  assert.equal(f.clicks(),1);assert.equal(f.prevented(),1);
  await Promise.resolve();f.button.disabled=true;handleEnterSubmit(f.event);
  assert.equal(f.clicks(),1);
});
test('Tab, textareas, dropdowns, focused buttons and native forms retain browser behavior',()=>{
  for(const tag of ['TEXTAREA','SELECT','BUTTON']){const f=setup();f.target.tagName=tag;handleEnterSubmit(f.event);assert.equal(f.clicks(),0);}
  for(const key of ['Tab','Escape','ArrowDown']){const f=setup();f.event.key=key;handleEnterSubmit(f.event);assert.equal(f.clicks(),0);}
  const f=setup();f.target.closest=()=>({});handleEnterSubmit(f.event);assert.equal(f.clicks(),0);
});
test('holding Enter, IME composition and modified shortcuts cannot trigger saves',()=>{
  for(const flag of ['repeat','isComposing','shiftKey','ctrlKey','altKey','metaKey','defaultPrevented']){const f=setup();f.event[flag]=true;handleEnterSubmit(f.event);assert.equal(f.clicks(),0);}
  const f=setup();f.event.nativeEvent={isComposing:true};handleEnterSubmit(f.event);assert.equal(f.clicks(),0);
});
test('covered dialogs, hidden actions and unmarked destructive confirmations never submit',()=>{
  const covered=setup();covered.layers.push({style:{zIndex:200},getClientRects:()=>[{}]});handleEnterSubmit(covered.event);assert.equal(covered.clicks(),0);
  const hidden=setup();hidden.button.getClientRects=()=>[];handleEnterSubmit(hidden.event);assert.equal(hidden.clicks(),0);
  const unmarked=setup();unmarked.scope.querySelector=()=>null;handleEnterSubmit(unmarked.event);assert.equal(unmarked.clicks(),0);
  const disabled=setup();disabled.button.getAttribute=()=> 'true';handleEnterSubmit(disabled.event);assert.equal(disabled.clicks(),0);
});
test('Enter toggles checkboxes and radios without requiring Space or submitting a form',()=>{
  for(const type of ['checkbox','radio']){
    const f=setup();let toggles=0;f.target.type=type;f.target.click=()=>toggles++;
    handleEnterSubmit(f.event);
    assert.equal(toggles,1);assert.equal(f.prevented(),1);assert.equal(f.clicks(),0);
  }
});
test('semantic clickable rows activate with Enter and Space; native buttons stay native',()=>{
  for(const key of ['Enter',' ']){
    const f=setup();let activations=0;f.target.tagName='DIV';f.target.getAttribute=name=>name==='role'?'button':null;f.target.click=()=>activations++;f.event.key=key;
    handleEnterSubmit(f.event);assert.equal(activations,1);assert.equal(f.prevented(),1);
  }
  const native=setup();native.target.tagName='BUTTON';native.target.click=()=>assert.fail('native activation must not be duplicated');handleEnterSubmit(native.event);assert.equal(native.prevented(),0);
});
test('disabled fieldsets and composing or held Enter cannot toggle choices',()=>{
  for(const blocked of ['disabled','fieldset','repeat','composition']){
    const f=setup();f.target.type='checkbox';f.target.click=()=>assert.fail('blocked choice must not activate');
    if(blocked==='disabled')f.target.disabled=true;
    if(blocked==='fieldset')f.target.matches=()=>true;
    if(blocked==='repeat')f.event.repeat=true;
    if(blocked==='composition')f.event.isComposing=true;
    handleEnterSubmit(f.event);
  }
});
