/**
 * src/constants.js
 * Single source of truth for gene-panel constants shared across the frontend.
 * Keep in sync with backend/config.py.
 */

/** Ordered gene panel used by the model (10-gene transcriptomic panel). */
export const GENE_PANEL = [
  'IL6', 'TLR4', 'HLA-DRA', 'STAT3', 'TNF',
  'CXCL8', 'CD14', 'MMP8', 'LBP', 'PCSK9',
];

/** Healthy control median log₂ expression values (literature-derived estimates). */
export const REFERENCE_BASELINE = {
  IL6: 2.1, TLR4: 4.5, 'HLA-DRA': 6.8, STAT3: 5.0, TNF: 2.4,
  CXCL8: 2.8, CD14: 5.9, MMP8: 1.8, LBP: 4.1, PCSK9: 3.6,
};
