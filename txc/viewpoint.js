// Exactly one physical observation station shared by the 3D and 2D views.
// building.js uses Three (x, height, z), metres. The panorama camera is
// Blender (4.65, -9.5, 1.6), so its matching floor point is (4.65, 9.5).
// The original model has a clear approach north of its coffee table here.
export const LIVING_VIEWPOINT = Object.freeze({
  id: 'living-01', x: 4.65, z: 9.5, floorHeight: .075, eyeHeight: 1.6,
  direction: Object.freeze({x: .64, z: .7683749085}),
  initialYaw: 0, initialPitch: -8,
  label: '客厅 · 360°',
  url: 'panorama/index.html?v=living-6k-a9ab597e767e'
});

export function initLivingPanorama() {
  const dialog = document.querySelector('#panorama-dialog');
  const frame = document.querySelector('#panorama-frame');
  const button = document.querySelector('#living-viewpoint');
  const shortcut = document.querySelector('#open-living-panorama');
  let returnFocus;
  const close = () => { if (dialog.open) dialog.close(); };
  const open = (trigger = document.activeElement) => {
    if (dialog.open) return;
    returnFocus = trigger;
    dialog.showModal();
    frame.src = LIVING_VIEWPOINT.url;
    document.querySelector('#close-panorama').focus({preventScroll:true});
  };
  button.addEventListener('click', event => {event.stopPropagation();open(button);});
  shortcut.addEventListener('click', () => open(shortcut));
  document.querySelector('#close-panorama').addEventListener('click', close);
  dialog.addEventListener('close', () => {
    // Navigating away aborts pending image loads and disposes the viewer's RAF,
    // progressive rendering work and WebGL context. Reopening starts cleanly.
    frame.src = 'about:blank';
    if (returnFocus?.isConnected) returnFocus.focus({preventScroll:true});
  });
  window.addEventListener('message', event => {
    if (event.origin === location.origin && event.source === frame.contentWindow && event.data?.type === 'living-panorama-close') close();
  });
  return {open, isOpen: () => dialog.open, button};
}
