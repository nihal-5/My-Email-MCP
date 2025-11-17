/**
 * Resume Validator - Enforces strict formatting and content rules
 */
export interface ValidationResult {
    ok: boolean;
    errors: string[];
}
export declare function validateResume(latex: string, cloud: 'azure' | 'aws' | 'gcp'): ValidationResult;
//# sourceMappingURL=resume-validator.d.ts.map