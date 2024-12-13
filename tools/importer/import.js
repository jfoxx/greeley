/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/* global WebImporter */
/* eslint-disable no-console, class-methods-use-this */

const googleError = (html) => {
    const error = "More than one Google Analytics scripts are registered. Please verify your pages and templates."
    console.log(html.textContent);
    html.textContent = html.replace(error, '');
}

const convertH2 = (main, document) => {
    const h2 = document.querySelector('h2');
    const h1 = document.createElement('h1');
    h1.innerText = h2.innerText;
    h2.after(h1);
    h2.remove();
}

const createMetadataBlock = (main, document) => {
    const meta = {};
  
    // find the <title> element
    const title = document.querySelector('title');
    if (title) {
      meta.Title = title.innerHTML.replace(/[\n\t]/gm, '');
    }
  
    // find the <meta property="og:description"> element
    const desc = document.querySelector('[property="og:description"]');
    if (desc) {
      meta.Description = desc.content;
    } else {
        meta.Description = '';
    }
  
    // find the <meta property="og:image"> element
    const img = document.querySelector('[property="og:image"]');
    const pgImage = document.querySelector('img');
    if (img) {
      // create an <img> element
      const el = document.createElement('img');
      el.src = img.content;
      meta.Image = el;
    } else if (pgImage) {
        const el = document.createElement('img');
        el.src = pgImage.content;
        meta.Image = el;
    } else {
        meta.Image = '';
    }

    //set category
    meta.Category = 'News';

    //set pubdate
    const release = document.querySelector('.sfitemDate');
    if (release) {
        const date = release.innerText;
        meta.pubdate = date;
    }
  
    // helper to create the metadata block
    const block = WebImporter.Blocks.getMetadataBlock(document, meta);
  
    // append the block to the main element
    main.append(block);
  
    // returning the meta object might be usefull to other rules
    return meta;
  };

export default {
    /**
     * Apply DOM operations to the provided document and return
     * the root element to be then transformed to Markdown.
     * @param {HTMLDocument} document The document
     * @param {string} url The url of the page imported
     * @param {string} html The raw html (the document is cleaned up during preprocessing)
     * @param {object} params Object containing some parameters given by the import process.
     * @returns {HTMLElement} The root element to be transformed
     */
    transformDOM: ({
      // eslint-disable-next-line no-unused-vars
      document, url, html, params,
    }) => {
      // define the main element: the one that will be transformed to Markdown
      const main = document.body;

      // attempt to remove non-content elements
      WebImporter.DOMUtils.remove(main, [
        'header',
        '.header',
        'nav',
        '.nav',
        'footer',
        '.footer',
        '.ggov-footer',
        'iframe',
        'noscript',
        '.breadcrumb-row',
        '.visually-hidden',
        'h1',
        '.side-content'
       ]);

      createMetadataBlock(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      WebImporter.rules.convertIcons(main, document);
      convertH2(main, document);
  
      return main;
    },
  
    /**
     * Return a path that describes the document being transformed (file name, nesting...).
     * The path is then used to create the corresponding Word document.
     * @param {HTMLDocument} document The document
     * @param {string} url The url of the page imported
     * @param {string} html The raw html (the document is cleaned up during preprocessing)
     * @param {object} params Object containing some parameters given by the import process.
     * @return {string} The path
     */
    generateDocumentPath: ({
      // eslint-disable-next-line no-unused-vars
      document, url, html, params,
    }) => {
      let p = new URL(url).pathname;
      if (p.endsWith('/')) {
        p = `${p}index`;
      }
      return decodeURIComponent(p)
        .toLowerCase()
        .replace(/\.html$/, '')
        .replace(/[^a-z0-9/]/gm, '-');
    },
  };