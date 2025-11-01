import { SetMetadata } from '@nestjs/common';

export const RESPONSE_MSG_KEY = 'custom:response_message';

export const ResponseMessage = (msg: string) => SetMetadata(RESPONSE_MSG_KEY, msg);
