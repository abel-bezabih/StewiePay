export declare class ListKycReviewsDto {
    limit?: number;
    cursor?: string;
    status?: 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
    startDate?: string;
    endDate?: string;
    reviewerEmail?: string;
    subjectEmail?: string;
}
