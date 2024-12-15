import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the aside/sidebar
 * @param {Element} block The sidebar block element
 */
export default async function decorate(block) {
  const path = window.location.pathname;
  const steps = [...path.split('/')];
  steps.shift();
  steps.pop();
  let urlPath = '';
  steps.forEach((i) => {
    urlPath = `${urlPath}/${i}`;
  });
  urlPath = `${urlPath}/sidebar`;
  const fragment = await loadFragment(urlPath);

  if (fragment) {
    const fragmentSection = fragment.querySelector(':scope .section');
    if (fragmentSection) {
      block.closest('.sidebar').classList.add(...fragmentSection.classList);
      block.closest('.sidebar').replaceWith(...fragment.childNodes);
    }
  }
}
