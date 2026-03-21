import { Body, Controller, ForbiddenException, Get, Headers, HttpCode, HttpStatus, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { IssuerWebhookDto } from './dto/issuer-webhook.dto';
import { PspWebhookDto } from './dto/psp-webhook.dto';
import { WebhookQueueService } from './webhook-queue.service';
import { ListWebhookJobsDto } from './dto/list-webhook-jobs.dto';

@Controller('webhooks')
export class WebhookController {
  constructor(private readonly webhookQueue: WebhookQueueService) {}

  private assertAdmin(req: any) {
    if (req.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
  }

  @Post('issuer')
  @HttpCode(HttpStatus.ACCEPTED)
  async issuer(@Body() payload: IssuerWebhookDto) {
    await this.webhookQueue.enqueueIssuer(payload);
    return { ok: true, queued: true };
  }

  @Post('psp')
  @HttpCode(HttpStatus.ACCEPTED)
  async psp(@Body() payload: PspWebhookDto) {
    await this.webhookQueue.enqueuePsp(payload);
    return { ok: true, queued: true };
  }

  @Post('chapa')
  @HttpCode(HttpStatus.ACCEPTED)
  async chapa(@Body() payload: any, @Headers() headers: Record<string, string | string[]>) {
    const signature =
      (headers['x-chapa-signature'] as string) ||
      (headers['chapa-signature'] as string) ||
      (headers['X-Chapa-Signature'] as string) ||
      (headers['Chapa-Signature'] as string);
    await this.webhookQueue.enqueueChapa(payload, signature);
    return { ok: true, queued: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('jobs')
  async listJobs(@Req() req: any, @Query() query: ListWebhookJobsDto) {
    this.assertAdmin(req);
    const jobs = await this.webhookQueue.listJobs(query);
    return { items: jobs };
  }

  @UseGuards(JwtAuthGuard)
  @Post('jobs/:jobId/retry')
  async retryJob(@Req() req: any, @Param('jobId') jobId: string) {
    this.assertAdmin(req);
    const result = await this.webhookQueue.retryJob(jobId);
    return { ok: true, ...result };
  }

  @UseGuards(JwtAuthGuard)
  @Post('jobs/retry-failed')
  async retryFailed(@Req() req: any, @Query('limit') limit?: string) {
    this.assertAdmin(req);
    const parsedLimit = limit ? Number(limit) : undefined;
    const result = await this.webhookQueue.retryFailed(Number.isFinite(parsedLimit) ? parsedLimit : undefined);
    return { ok: true, ...result };
  }
}






