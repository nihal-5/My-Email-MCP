/**
 * Resume Validator - Basic sanity checks (no hard-coded identity)
 */
export interface ValidationResult {
    ok: boolean;
    errors: string[];
}
export declare function validateResume(latex: string, cloud: 'azure' | 'aws' | 'gcp'): ValidationResult;
//# sourceMappingURL=resume-validator.d.ts.map
