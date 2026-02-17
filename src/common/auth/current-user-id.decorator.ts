import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const USER_ID_HEADER = 'x-user-id';
export const DEFAULT_USER_ID = 'anonymous';

export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const rawHeader = request.headers[USER_ID_HEADER] as string | undefined;

    return rawHeader?.trim() || DEFAULT_USER_ID;
  },
);
