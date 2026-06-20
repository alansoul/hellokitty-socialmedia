import { Controller, Post, Body } from '@nestjs/common';
import { IamFeatureAuthService } from './iam-feature-auth.service';

// ✨ Renamed to AuthDto since both signup and login need an email & password
class AuthDto {
  email!: string;
  password!: string;
}

@Controller('auth')
export class IamFeatureAuthController {
  constructor(private readonly authService: IamFeatureAuthService) {}

  @Post('signup')
  async signup(@Body() body: AuthDto) {
    return this.authService.signup(body.email, body.password);
  }

  @Post('login')
  async login(@Body() body: AuthDto) {
    return this.authService.login(body.email, body.password);
  }
  // ✨ NEW: Google Social Login Endpoint!
  @Post('google')
  async googleLogin(@Body() body: { token: string }) {
    return this.authService.loginWithGoogle(body.token);
  }
}
