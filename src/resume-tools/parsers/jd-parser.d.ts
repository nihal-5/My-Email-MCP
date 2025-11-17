/**
 * JD Parser - Extracts key information from job descriptions
 */
export interface ParsedJD {
    role: string;
    cloud: 'azure' | 'aws' | 'gcp';
    location: string;
    recruiterEmail?: string;
    recruiterName?: string;
    company?: string;
}
export declare function parseJD(jdText: string): ParsedJD;
//# sourceMappingURL=jd-parser.d.ts.map