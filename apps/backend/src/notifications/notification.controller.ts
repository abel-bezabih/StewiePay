import { Body, Controller, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { NotificationService } from './notification.service';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('register-token')
  registerToken(@Req() req: any, @Body() body: { token: string }) {
    return this.notificationService.registerPushToken(req.user.userId, body.token);
  }

  @Patch('preferences')
  updatePreferences(
    @Req() req: any,
    @Body() preferences: {
      transactions?: boolean;
      limits?: boolean;
      subscriptions?: boolean;
      cardStatus?: boolean;
    }
  ) {
    return this.notificationService.updatePreferences(req.user.userId, preferences);
  }
}







