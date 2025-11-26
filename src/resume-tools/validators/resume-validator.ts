/**
 * Resume Validator - Minimal sanity checks (no hard-coded identity)
 */

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

export function validateResume(latex: string, cloud: 'azure' | 'aws' | 'gcp'): ValidationResult {
  const errors: string[] = [];

  if (!latex || latex.trim() === '') {
    errors.push('LaTeX content is empty');
  }

  const nonAsciiMatch = latex.match(/[^\x00-\x7F]/g);
  if (nonAsciiMatch) {
    errors.push(`Contains non-ASCII characters: ${Array.from(new Set(nonAsciiMatch)).join(' ')}`);
  }

  if (!latex.includes('\\section{Experience}')) {
    errors.push('Missing Experience section');
  }
  if (!latex.includes('\\section{Summary}')) {
    errors.push('Missing Summary section');
  }

  // Soft cloud alignment check
  const cloudToken = cloud.toUpperCase();
  if (!latex.toUpperCase().includes(cloudToken)) {
    errors.push(`Resume does not mention target cloud ${cloudToken}`);
  }

  return {
    ok: errors.length === 0,
    errors
  };
}
