/**
 * Resume Tailor - Generates resume from candidate profile + JD params (no hard-coded template)
 */
export interface TailorParams {
    cloud: 'azure' | 'aws' | 'gcp';
    role: string;
    location: string;
}
export declare function tailorResume(params: TailorParams): Promise<string>;
//# sourceMappingURL=resume-tailor.d.ts.map
