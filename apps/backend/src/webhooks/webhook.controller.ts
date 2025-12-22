import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { IssuerWebhookDto } from './dto/issuer-webhook.dto';
import { PspWebhookDto } from './dto/psp-webhook.dto';

@Controller('webhooks')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('issuer')
  @HttpCode(HttpStatus.OK)
  async issuer(@Body() payload: IssuerWebhookDto) {
    try {
      const result = await this.webhookService.processIssuerWebhook(payload);
      return { ok: true, ...result };
    } catch (error: any) {
      return {
        ok: false,
        error: error.message || 'Webhook processing failed'
      };
    }
  }

  @Post('psp')
  @HttpCode(HttpStatus.OK)
  async psp(@Body() payload: PspWebhookDto) {
    try {
      const result = await this.webhookService.processPspWebhook(payload);
      return { ok: true, ...result };
    } catch (error: any) {
      return {
        ok: false,
        error: error.message || 'Webhook processing failed'
      };
    }
  }
}






