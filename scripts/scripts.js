import {
  buildBlock,
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateSections,
  decorateBlocks,
  decorateBlock,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadBlock,
  loadSection,
  loadSections,
  loadCSS,
  sampleRUM,
  getMetadata,
} from './aem.js';

/**
 * overlays icon to make it an image mask instead of an img.
 * @param {Element, String, String} span The icon span element
 */
function decorateIcon(span, prefix = '') {
  const iconName = Array.from(span.classList)
    .find((c) => c.startsWith('icon-'))
    .substring(5);
  const iconPath = `${window.hlx.codeBasePath}${prefix}/icons/${iconName}.svg`;
  span.style.maskImage = `url(${iconPath})`;
}

async function loadSidebar(aside) {
  const sidebarBlock = buildBlock('sidebar', '');
  aside.append(sidebarBlock);
  decorateBlock(sidebarBlock);
  return loadBlock(sidebarBlock);
}

function groupSectionColumns(parent) {
  const layout = parent.getAttribute('data-layout');
  const layoutItems = layout.split('-');
  const children = [...parent.children];
  const div1 = document.createElement('div');
  const div2 = document.createElement('div');
  children.forEach((i) => {
    if (children.indexOf(i) + 1 <= layoutItems[1]) {
      div1.append(i);
    } else {
      div2.append(i);
    }
  });
  parent.textConent = '';
  parent.append(div1, div2);
}

function categoryLabel(main) {
  const template = getMetadata('template');
  if (template === 'interior') {
    const category = getMetadata('category');
    const bannerText = `City of Greeley ${category}`;
    const banner = document.createElement('div');
    banner.className = 'category-banner';
    banner.textContent = bannerText;
    main.querySelector('h1').before(banner);
  }
}

export default function convertExcelDate(value) {
  const excelStartDate = new Date(1900, 0, 1);
  // Subtract 1 because Excel counts 1900-01-01 as 1, not 0
  const days = value - 1;
  const readableDate = new Date(excelStartDate.getTime() + days * 24 * 60 * 60 * 1000);
  return (readableDate.toDateString());
}

/**
 * Add <img> for icons, prefixed with codeBasePath and optional prefix.
 * @param {Element} [element] Element containing icons
 * @param {string} [prefix] prefix to be added to icon the src
 */
function decorateIcons(element, prefix = '') {
  const icons = [...element.querySelectorAll('span.icon')];
  icons.forEach((span) => {
    decorateIcon(span, prefix);
  });
}

function applySectionLayout(element) {
  const layouts = [...element.querySelectorAll('div[data-layout]')];
  layouts.forEach((i) => {
    groupSectionColumns(i);
  });
}

function structureTemplate(main) {
  const template = getMetadata('template');
  if (template === 'interior') {
    const aside = document.createElement('aside');
    main.after(aside);
  }
}

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} main The container element
 */
function buildHeroBlock(main) {
  const h1 = main.querySelector('h1');
  const picture = main.querySelector('picture');
  // eslint-disable-next-line no-bitwise
  if (h1 && picture && (h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)) {
    const section = document.createElement('div');
    section.append(buildBlock('hero', { elems: [picture, h1] }));
    main.prepend(section);
  }
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

async function loadJsFile(url, callback) {
  const script = document.createElement('script');
  script.src = url;
  const head = document.querySelector('head');
  head.append(script);
  callback();
}

function loadCssFile(url) {
  const link = document.createElement('link');
  link.href = url;
  link.rel = 'stylesheet';
  const head = document.querySelector('head');
  head.append(link);
}

/* eslint-disable no-undef, no-unused-vars */

function setupSa11y() {
  setTimeout(() => {
    Sa11y.Lang.addI18n(Sa11yLangEn.strings);
    const sa11y = new Sa11y.Sa11y({
      checkRoot: 'main',
      panelPosition: 'left',
    });
  }, '3000');
}

const runSa11y = async () => {
  loadCssFile('https://cdn.jsdelivr.net/gh/ryersondmp/sa11y@3.2.2/dist/css/sa11y.min.css');
  loadJsFile('https://cdn.jsdelivr.net/combine/gh/ryersondmp/sa11y@3.2.2/dist/js/lang/en.umd.js,gh/ryersondmp/sa11y@3.2.2/dist/js/sa11y.umd.min.js', setupSa11y);
};

const sk = document.querySelector('aem-sidekick');
if (sk) {
  // sidekick already loaded
  sk.addEventListener('custom:runSa11y', runSa11y);
} else {
  // wait for sidekick to be loaded
  document.addEventListener('sidekick-ready', () => {
    document.querySelector('aem-sidekick')
      .addEventListener('custom:runSa11y', runSa11y);
  }, { once: true });
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    buildHeroBlock(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  structureTemplate(main);
  decorateBlocks(main);
  applySectionLayout(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    categoryLabel(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  sampleRUM.enhance();

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  const aside = doc.querySelector('aside');

  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  if (aside) {
    loadSidebar(aside);
  }

  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
