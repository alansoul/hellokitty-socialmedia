import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing authentication token');
    }

    try {
      // ✨ Verify the token signature using the shared secret
      const payload = await this.jwtService.verifyAsync(token, {
      });

      // ✨ Attach the user's data (ID, Email, TenantId) directly to the request!
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
    return true;
  }

  // ✨ Hybrid Extractor: Checks Cookies first, falls back to Headers
  private extractToken(request: Request): string | undefined {
    // 1. Try to read from secure HttpOnly Cookies
    if (request.cookies && request.cookies['access_token']) {
      return request.cookies['access_token'];
    }

    // 2. Fallback to standard Authorization: Bearer header (keeps Postman working!)
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
