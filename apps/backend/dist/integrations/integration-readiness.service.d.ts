import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
type ReadinessIssue = {
    key: string;
    message: string;
};
export declare class IntegrationReadinessService implements OnModuleInit {
    private readonly config;
    private readonly logger;
    constructor(config: ConfigService);
    onModuleInit(): void;
    getReadinessReport(): {
        ready: boolean;
        issuerProvider: string;
        pspProvider: string;
        issues: ReadinessIssue[];
    };
}
export {};
