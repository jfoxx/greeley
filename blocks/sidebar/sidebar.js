import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the aside/sidebar
 * @param {Element} block The sidebar block element
 */
export default async function decorate(block) {
    const path = window.location.pathname;
    const steps = [...path.split('/')];
   
  }