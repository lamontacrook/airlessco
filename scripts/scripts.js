/* eslint-disable max-len */
import {
  sampleRUM,
  buildBlock,
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForLCP,
  loadBlocks,
  loadCSS, getMetadata,
} from './lib-franklin.js';

const LCP_BLOCKS = []; // add your LCP blocks to the list
window.hlx.RUM_GENERATION = 'airlessco'; // add your RUM generation information here

function buildPageHeader(main) {
  const h1 = main.querySelector('h1');
  if (h1) {
    h1.parentElement.classList.add('page-header-container');
    Object.values(h1.childNodes).forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const small = document.createElement('small');
        small.appendChild(node);
        h1.append(small);
      }
    });
  }
}

function buildBreadcrumb(main) {
  let pathSegments = window.location.pathname.split('/');
  // remove the last element if there was a / at the end of the pathname
  pathSegments = pathSegments[pathSegments.length - 1] === '' ? pathSegments.slice(0, pathSegments.length - 1) : pathSegments;

  if (pathSegments.length < 4) {
    return;
  }

  if (pathSegments.length > 4) {
    const breadcrumbDiv = document.createElement('div');
    breadcrumbDiv.append(buildBlock('breadcrumb', { elems: [] }));
    main.prepend(breadcrumbDiv);
  }
}

function buildPageDivider(main) {
  const allPageDivider = main.querySelectorAll('code');
  allPageDivider.forEach((el) => {
    const alt = el.innerText.trim();
    const lower = alt.toLowerCase();
    if (lower === 'divider-s') {
      el.innerText = '';
      el.classList.add('divider-s');
    } else {
      el.classList.add('product-category');
    }
  });
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    buildPageHeader(main);
    buildBreadcrumb(main);
    buildPageDivider(main);
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
  decorateBlocks(main);
}

/**
 * loads everything needed to get to LCP.
 */
async function loadEager(doc) {
  const locale = getMetadata('locale');
  document.documentElement.lang = locale.replace(/\/\w+\/(\w+)\/?/, '$1');
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    await waitForLCP(LCP_BLOCKS);
  }
}

/**
 * Helper function to create DOM elements
 * @param {string} tag DOM element to be created
 * @param {array} attributes attributes to be added
 */

export function createTag(tag, attributes, html) {
  const el = document.createElement(tag);
  if (html) {
    if (html instanceof HTMLElement || html instanceof SVGElement) {
      el.append(html);
    } else {
      el.insertAdjacentHTML('beforeend', html);
    }
  }
  if (attributes) {
    Object.entries(attributes).forEach(([key, val]) => {
      el.setAttribute(key, val);
    });
  }
  return el;
}

/**
 * Gets details about products in product master sheet
* @param {String} productFamily,
* @param {String} productName
* @param {Array} productFields
 */

export async function lookupProductData(productFamilyData, productName) {
  const resp = await fetch(productFamilyData);
  const json = await resp.json();
  const filteredProduct = json.data.filter((e) => e.Name === productName);
  return filteredProduct.length > 0 ? filteredProduct[0] : undefined;
}

/**
 * Gets details about products in product master sheet
* @param {String} productSheetURL,
* @param {Array} productNames
*/

export async function lookupProductComparisionData(productSheetURL, productNames) {
  const resp = await fetch(productSheetURL);
  const json = await resp.json();
  window.productData = json.data;
  const filteredProduct = [];
  const productInfo = [];
  productNames.forEach((productName, index) => {
    filteredProduct[index] = window.productData.filter((e) => e.Name.toLowerCase()
     === productName.toLowerCase());
  });
  filteredProduct.forEach((element) => {
    productInfo.push([element[0]]);
  });
  const result = productInfo;
  return (result);
}

/**
 * Adds the favicon.
 * @param {string} href The favicon URL
 */
export function addFavIcon(href) {
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/svg+xml';
  link.href = href;
  const existingLink = document.querySelector('head link[rel="icon"]');
  if (existingLink) {
    existingLink.parentElement.replaceChild(link, existingLink);
  } else {
    document.getElementsByTagName('head')[0].appendChild(link);
  }
}

/**
 * loads everything that doesn't need to be delayed.
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  await loadBlocks(main);

  const { hash } = window.location;
  const element = hash ? main.querySelector(hash) : false;
  if (hash && element) element.scrollIntoView();

  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  addFavIcon(`${window.hlx.codeBasePath}/styles/favicon.svg`);
  sampleRUM('lazy');
  sampleRUM.observe(main.querySelectorAll('div[data-block-name]'));
  sampleRUM.observe(main.querySelectorAll('picture > img'));
}

export async function lookupFiles(fileSource, category, locale) {
  const resp = await fetch(fileSource);
  const json = await resp.json();
  window.fileSource = json.data;
  const filteredFilesCategory = window.fileSource.filter((e) => e.Category.toLowerCase() === category.toLowerCase());
  const filteredLocaleFiles = filteredFilesCategory.filter((e) => e.Locale.toLowerCase() === locale.toLowerCase());

  return (filteredLocaleFiles);
}

/**
 * loads everything that happens a lot later, without impacting
 * the user experience.
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
