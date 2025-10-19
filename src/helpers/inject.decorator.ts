import { Inject } from '@nestjs/common';

export const InjectGrpcService = (service: string) => Inject(`GRPC_SERVICE_${service}`);