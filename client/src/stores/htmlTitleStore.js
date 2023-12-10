// stores/pageTitleStore.js
import { writable } from 'svelte/store';

const staticTitlePart = 'Exam Project';

export const dynamicTitlePart = writable('');

export function getFullTitle(dynamicPart) {
  return `${staticTitlePart} | ${dynamicPart}`;
}
