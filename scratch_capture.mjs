import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

class CdpClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
  }

  ready() {
    return new Promise(resolve => {
      if (this.ws.readyState === WebSocket.OPEN) resolve();
      else this.ws.onopen = () => resolve();
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    return res.result ? res.result.value : null;
  }

  async screenshot(filePath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
    console.log(`Saved screenshot: ${filePath}`);
  }

  close() {
    this.ws.close();
  }
}

async function main() {
  console.log('Spawning Chrome headless...');
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--window-size=1280,720',
    '--user-data-dir=C:\\Users\\Rao\\AppData\\Local\\Temp\\chrome_test_profile',
    'http://localhost:5173'
  ]);

  await wait(3000);
  const targets = await getJson('http://127.0.0.1:9222/json');
  const page = targets.find(t => t.type === 'page' && t.url.includes('localhost:5173'));
  if (!page) {
    console.error('Page target not found!');
    chrome.kill();
    return;
  }

  console.log('Connecting to CDP page...', page.webSocketDebuggerUrl);
  const cdp = new CdpClient(page.webSocketDebuggerUrl);
  await cdp.ready();
  await cdp.send('Page.enable');

  await wait(2000);
  console.log('Selecting Earth target...');
  await cdp.eval(`window.__app.ui.selectTarget('earth')`);
  await wait(3000);

  const camPos = await cdp.eval(`JSON.stringify(window.__app.camera.position)`);
  const targetPos = await cdp.eval(`JSON.stringify(window.__app.controls.target)`);
  console.log('Camera pos after flyTo Earth:', camPos);
  console.log('Controls target after flyTo Earth:', targetPos);

  await cdp.screenshot('e:/RAO/solar-system/earth_closeup.png');

  console.log('Selecting Moon target...');
  await cdp.eval(`window.__app.ui.selectTarget('moon')`);
  await wait(3000);
  await cdp.screenshot('e:/RAO/solar-system/moon_closeup.png');

  console.log('Selecting Mars target...');
  await cdp.eval(`window.__app.ui.selectTarget('mars')`);
  await wait(3000);
  await cdp.screenshot('e:/RAO/solar-system/mars_closeup.png');

  cdp.close();
  chrome.kill();
  console.log('Done!');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
