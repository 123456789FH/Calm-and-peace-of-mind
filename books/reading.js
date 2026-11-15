'use strict';
try {
  document.body.classList.toggle('dark', JSON.parse(localStorage.getItem('sakinah.v1.dark')) === true);
} catch {}
if (window.parent !== window) document.body.classList.add('embedded-book');
window.addEventListener('storage', e => {
  if (e.key === 'sakinah.v1.dark') document.body.classList.toggle('dark', e.newValue === 'true');
});
const toc = document.getElementById('toc');
function selectHeading() {
  const id = location.hash.slice(1);
  const heading = document.getElementById(id);
  if (!heading || !/^part-\d+$/.test(id)) return;
  toc.value = id;
  heading.focus({ preventScroll: true });
  heading.scrollIntoView({ block: 'start' });
}
toc.addEventListener('change', () => {
  if (toc.value) location.hash = toc.value;
});
window.addEventListener('hashchange', selectHeading);
toc.disabled = false;
selectHeading();
