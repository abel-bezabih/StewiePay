import { Controller, Get } from '@nestjs/common';
import { IntegrationReadinessService } from './integrations/integration-readiness.service';

@Controller('health')
export class AppController {
  constructor(private readonly integrationReadiness: IntegrationReadinessService) {}

  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'backend',
      timestamp: new Date().toISOString()
    };
  }

  @Get('integrations')
  getIntegrationHealth() {
    return this.integrationReadiness.getReadinessReport();
  }
}





















