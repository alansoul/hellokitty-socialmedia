import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_MFA_KEY } from './require-mfa.decorator';

@Injectable()
export class StepUpGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Check if the controller or method has the @RequireMfa() metadata
    const requireMfa = this.reflector.getAllAndOverride<boolean>(REQUIRE_MFA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requireMfa) {
      return true; // No step-up required, let the request proceed
    }

    const request = context.switchToHttp().getRequest();
    const user = request['user']; // Populated by JwtAuthGuard

    if (!user) {
      throw new UnauthorizedException('Missing authentication session');
    }

    // 2. ✨ Check if the user's active token has the mfa_verified claim
    const mfaVerified = user['mfa_verified'];
    const mfaVerifiedAt = user['mfa_verified_at'];

    // 1. Basic check: Has the user verified MFA at all during this session? [2]
    if (!mfaVerified || !mfaVerifiedAt) {
      throw new ForbiddenException({
        error: 'mfa_required',
        message: 'This is a sensitive operation. Please verify your identity with your authenticator code.',
      });
    }

    // 2. ✨ TIME-SENSITIVE GRACE PERIOD CHECK! [12]
    const now = Math.floor(Date.now() / 1000); // Current UNIX time in seconds
    const GRACE_PERIOD_SECONDS = 60;          // ⏳ Set to 60 seconds for easy local testing (Change to 300/900 in prod)
    const elapsedSeconds = now - Number(mfaVerifiedAt);

    if (elapsedSeconds > GRACE_PERIOD_SECONDS) {
      // Security Grace Period has expired! Force a fresh step-up challenge. [12]
      throw new ForbiddenException({
        error: 'mfa_required',
        message: 'Your MFA security session has expired. Please verify your identity again to continue.',
      });
    }

    return true; // Still within the 60-second window, proceed! [12]
  }
}