/**
 * The anchor IDs a guide page uses.
 *
 * Three components need to agree on these strings: the hero renders the jump links, the three
 * sections render the targets, and a broken pair produces a link that silently does nothing —
 * the one bug class that no type checker and no test catches by accident, because a bad
 * fragment is not an error to the browser. One frozen object removes the possibility.
 *
 * They are also public URLs the moment anybody shares `/for/x#checklist`, so they are renamed
 * with the same caution as a slug.
 */

export const GUIDE_SECTION_IDS = {
  risks: 'risks',
  checklist: 'checklist',
  faq: 'questions',
} as const;
