import { IntegrationReadinessService } from './integrations/integration-readiness.service';
export declare class AppController {
    private readonly integrationReadiness;
    constructor(integrationReadiness: IntegrationReadinessService);
    getHealth(): {
        status: string;
        service: string;
        timestamp: string;
    };
    getIntegrationHealth(): {
        ready: boolean;
        issuerProvider: string;
        pspProvider: string;
        issues: {
            key: string;
            message: string;
        }[];
    };
}
