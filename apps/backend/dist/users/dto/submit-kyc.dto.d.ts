export declare class SubmitKycDto {
    documentType: 'passport' | 'national_id' | 'driver_license';
    country: string;
    documentFront: string;
    documentBack?: string;
    selfie: string;
}
