import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

// ✨ Local Interface: Safely extend Express Request without index signature errors
interface RequestWithUser extends Request {
  user?: Record<string, unknown>;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // ✨ Upgraded: Pass our custom interface as a generic to NestJS getRequest()
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    // 1. Try verifying the HttpOnly cookie first [7.1]
    if (request.cookies && request.cookies['access_token']) {
      try {
        const payload = await this.jwtService.verifyAsync(request.cookies['access_token']);
        request.user = payload; // ✨ Fixed: Clean, type-safe assignment! [7.1]
        return true; // Cookie is valid, proceed securely!
      } catch {
        // Token in cookie is expired or invalid, do NOT crash yet.
        // Fall back to check if the header has a fresh valid token.
      }
    }

    // 2. Fallback: Verify the standard Authorization Header [7.1]
    const authHeader = request.headers.authorization;
    const [type, token] = authHeader?.split(' ') ?? [];
    
    if (type === 'Bearer' && token) {
      try {
        const payload = await this.jwtService.verifyAsync(token);
        request.user = payload; // ✨ Fixed: Clean, type-safe assignment! [7.1]
        return true; // Header is valid, proceed!
      } catch {
        // Both cookie and header failed verification
      }
    }

    // 3. Both verification methods failed or are missing [7.1]
    throw new UnauthorizedException('Invalid or expired token');
  }
}