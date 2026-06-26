import { SetMetadata } from '@nestjs/common';

export const REQUIRE_MFA_KEY = 'require_mfa';

// ✨ Decorator to mark any endpoint as a sensitive "Step-Up required" operation
export const RequireMfa = () => SetMetadata(REQUIRE_MFA_KEY, true);