/* =========================================================================
   DEVICE PREVIEW
   Header device menu: shows the app in a phone, tablet or desktop frame.

   Auto uses this window. Any other device opens the same app in a framed
   viewport of that size, so media queries, touch sizing and layouts behave
   exactly as on the real device.

   Provides: DEVICES, DEV_BY, devState, devStage, devSize, devIcon, devFit,
   setDevice, devLoad, closeDevice, syncDevice, openDeviceMenu, initDevice
   ========================================================================= */
'use strict';

const DEVICES = [
  ['auto', 'This window', 'monitor', 0, 0, 0, 'Real size of your browser'],
  ['desktop', 'Desktop', 'monitor', 1440, 900, 0, 'Wide screen'],
  ['laptop', 'Laptop', 'monitor', 1280, 800, 0, 'Small laptop'],
  ['tablet', 'Tablet', 'tablet', 820, 1180, 1, 'iPad Air portrait'],
  ['tablet-l', 'Tablet landscape', 'tablet', 1180, 820, 1, 'iPad Air landscape'],
  ['phone', 'Phone', 'phone', 390, 844, 1, 'iPhone 14'],
  ['phone-s', 'Small phone', 'phone', 360, 740, 1, 'Compact Android'],
  ['phone-l', 'Phone landscape', 'phone', 844, 390, 1, 'iPhone 14 rotated']
];
const DEV_BY = id => DEVICES.find(d => d[0] === id) || DEVICES[0];
const devState = { id: 'auto', rot: false };
let devStage = null;
function devSize(d) {
  return devState.rot && d[0] !== 'auto' ? [d[4], d[3]] : [d[3], d[4]];
}
function devIcon() {
  const d = DEV_BY(devState.id);
  return d[2] === 'tablet' ? 'monitor' : d[2];
}
function devFit() {
  if (!devStage) return;
  const d = DEV_BY(devState.id),
    s = devSize(d),
    pad = devState.id === 'auto' ? 0 : 10;
  const view = $('.dv-view', devStage),
    aw = view.clientWidth - 32,
    ah = view.clientHeight - 32;
  const fw = s[0] + pad * 2,
    fh = s[1] + pad * 2,
    sc = Math.min(1, aw / fw, ah / fh);
  const wrap = $('.dv-wrap', devStage),
    fr = $('.dv-frame', devStage);
  wrap.style.width = Math.round(fw * sc) + 'px';
  wrap.style.height = Math.round(fh * sc) + 'px';
  fr.style.width = fw + 'px';
  fr.style.height = fh + 'px';
  fr.style.transform = 'scale(' + sc + ')';
  fr.classList.toggle('phone', d[2] === 'phone');
  $('[data-dv-info]', devStage).textContent = s[0] + ' × ' + s[1] + ' · ' + Math.round(sc * 100) + '%';
}
function setDevice(id) {
  const d = DEV_BY(id);
  if (d[0] === 'auto') {
    closeDevice();
    return;
  }
  devState.id = d[0];
  if (!devStage) {
    devStage = el(
      '<div class="dv-stage" role="dialog" aria-label="Device preview"><div class="dv-bar"><span class="dv-ttl">' +
        icon('monitor', 16) +
        '<b>Device preview</b></span><select class="select select-sm dv-sel" aria-label="Device">' +
        DEVICES.map(
          x =>
            '<option value="' +
            x[0] +
            '">' +
            esc(x[1]) +
            (x[3] ? ' · ' + x[3] + '×' + x[4] : '') +
            '</option>'
        ).join('') +
        '</select><button type="button" class="btn btn-sm btn-icon" data-dv-rot aria-label="Rotate device" data-tip="Rotate">' +
        icon('refresh', 16) +
        '</button><span class="dv-info muted" data-dv-info></span><span class="spacer"></span><button type="button" class="btn btn-sm" data-dv-exit>' +
        icon('x', 15) +
        '<span>Exit preview</span></button></div><div class="dv-view"><div class="dv-wrap"><div class="dv-frame"><iframe title="App preview" class="dv-if"></iframe></div></div></div></div>'
    );
    $('.dv-sel', devStage).onchange = e => setDevice(e.target.value);
    $('[data-dv-rot]', devStage).onclick = () => {
      devState.rot = !devState.rot;
      devFit();
      devLoad();
    };
    $('[data-dv-exit]', devStage).onclick = closeDevice;
    document.body.append(devStage);
    $('#app').setAttribute('inert', '');
    window.addEventListener('resize', devFit);
  }
  $('.dv-sel', devStage).value = d[0];
  $('[data-dv-rot]', devStage).hidden = false;
  devFit();
  devLoad();
  syncDevice();
}
function devLoad() {
  const d = DEV_BY(devState.id),
    f = $('.dv-if', devStage);
  const base = location.href.split('#')[0].split('?')[0];
  const hash = devState.hash || location.hash || '#/' + homeRoute();
  f.src = base + '?embed=1' + (d[5] ? '&touch=1' : '') + hash;
}
function closeDevice() {
  if (devStage) {
    try {
      const h = $('.dv-if', devStage).contentWindow.location.hash;
      if (h && h !== location.hash) location.hash = h;
    } catch (e) {}
    devStage.remove();
    devStage = null;
    $('#app').removeAttribute('inert');
    window.removeEventListener('resize', devFit);
  }
  devState.id = 'auto';
  devState.rot = false;
  syncDevice();
}
function syncDevice() {
  const b = $('#deviceBtn');
  if (b) {
    b.innerHTML = icon(devIcon(), 19);
    b.dataset.tip = 'Device: ' + DEV_BY(devState.id)[1];
    b.classList.toggle('is-on', devState.id !== 'auto');
  }
  syncLab();
}
function openDeviceMenu(anchor) {
  openMenu(
    anchor,
    DEVICES.map(d => ({
      label: d[1],
      icon: devState.id === d[0] ? 'check' : d[2],
      kbd: d[3] ? d[3] + '×' + d[4] : '',
      onClick: () => setDevice(d[0])
    })),
    {
      head: '<div class="menu-head"><div><b>Preview device</b><small>Test mobile and tablet layouts</small></div></div><div class="menu-sep"></div>'
    }
  );
}
function initDevice() {
  const b = $('#deviceBtn');
  if (!b) return;
  b.setAttribute('aria-haspopup', 'menu');
  b.innerHTML = icon('monitor', 19);
  b.dataset.tip = 'Device: This window';
  b.onclick = e => openDeviceMenu(e.currentTarget);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && devStage && !menuEl) closeDevice();
  });
}
