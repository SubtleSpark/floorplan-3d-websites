'use strict';
// Escape inside an iframe does not reach the parent dialog automatically.
window.addEventListener('keydown', event => {
  if (event.key === 'Escape' && window.parent !== window) {
    event.preventDefault();
    window.parent.postMessage({type:'living-panorama-close'}, location.origin);
  }
});
if (window.parent === window) {
  const back = document.createElement('a');
  back.href = '../'; back.className = 'direct-return'; back.textContent = '← 返回原户型';
  document.body.prepend(back);
}
