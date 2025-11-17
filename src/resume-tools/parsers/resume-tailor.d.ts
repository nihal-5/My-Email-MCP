/**
 * Resume Tailor - Applies cloud-specific substitutions to LaTeX template
 */
export interface TailorParams {
    cloud: 'azure' | 'aws' | 'gcp';
    role: string;
    location: string;
}
export declare function tailorResume(params: TailorParams): string;
//# sourceMappingURL=resume-tailor.d.ts.map