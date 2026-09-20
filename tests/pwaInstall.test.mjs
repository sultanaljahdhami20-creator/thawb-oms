import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {createInstallController, installationPlatform} from '../src/pwaInstall.js';

function browser(standalone = false) {
  const events = new Map();
  const mode = {matches: standalone, addEventListener(name, fn) {events.set('mode:'+name,fn);}, removeEventListener(name) {events.delete('mode:'+name);}};
  return {events, mode, navigator: {}, matchMedia: () => mode,
    addEventListener(name, fn) {events.set(name,fn);}, removeEventListener(name) {events.delete(name);}};
}

test('captures the early install event and consumes each prompt only once',async()=>{
  const b=browser(), controller=createInstallController(b);
  let prevented=false, prompts=0;
  b.events.get('beforeinstallprompt')({preventDefault(){prevented=true;},async prompt(){prompts++;},userChoice:Promise.resolve({outcome:'dismissed'})});
  assert.equal(prevented,true);
  assert.equal(controller.getSnapshot().canPrompt,true);
  assert.equal((await controller.prompt()).outcome,'dismissed');
  assert.equal(controller.getSnapshot().installed,false);
  assert.equal(controller.getSnapshot().canPrompt,false);
  assert.equal(await controller.prompt(),null);
  assert.equal(prompts,1);
  controller.dispose();
  assert.equal(b.events.size,0);
});

test('installed and standalone modes hide installation controls',()=>{
  assert.equal(createInstallController(browser(true)).getSnapshot().installed,true);
  const ios=browser();ios.navigator.standalone=true;
  assert.equal(createInstallController(ios).getSnapshot().installed,true);
  const b=browser(), controller=createInstallController(b);
  let notifications=0;
  controller.subscribe(()=>notifications++);
  b.events.get('appinstalled')();
  assert.equal(controller.getSnapshot().installed,true);
  assert.equal(notifications,1);
});

test('prompt failures clear the consumed event and remain recoverable',async()=>{
  const b=browser(), controller=createInstallController(b);
  b.events.get('beforeinstallprompt')({preventDefault(){},async prompt(){throw new Error('Unavailable');}});
  await assert.rejects(controller.prompt(),/Unavailable/);
  assert.deepEqual(controller.getSnapshot(),{installed:false,canPrompt:false});
});

test('instructions cover iPhone, desktop-mode iPad, Android and desktop',()=>{
  assert.equal(installationPlatform({userAgent:'iPhone'}),'ios');
  assert.equal(installationPlatform({userAgent:'Macintosh',maxTouchPoints:5}),'ios');
  assert.equal(installationPlatform({userAgent:'Android'}),'android');
  assert.equal(installationPlatform({userAgent:'Macintosh',maxTouchPoints:0}),'desktop');
});

test('manifest launches the same site and has valid PNG icon dimensions',()=>{
  const manifest=JSON.parse(readFileSync(new URL('../public/manifest.webmanifest',import.meta.url)));
  assert.equal(manifest.display,'standalone');
  assert.equal(manifest.start_url,'/');
  assert.equal(manifest.scope,'/');
  assert.equal(manifest.id,'/');
  for(const icon of manifest.icons){
    const png=readFileSync(new URL('../public'+icon.src,import.meta.url));
    assert.equal(icon.sizes,`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`);
  }
  assert.ok(existsSync(new URL('../public/pwa/icon-180.png',import.meta.url)));
});
