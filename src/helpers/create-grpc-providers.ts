import type { Provider } from '@nestjs/common';
import { GrpcClientService } from '../services/grpc-client.service.js';
import type { EurekaGRPcConnectorModuleOptions } from '../interfaces/module-options.interface.js';
import { EurekaDiscoveryService } from '../services/eureka-discovery.service.js';

export function createGrpcProviders(options: EurekaGRPcConnectorModuleOptions): Provider[] {
  return Object.keys(options.apps).map(serviceName => ({
    provide: `GRPC_SERVICE_${options.apps[serviceName]?.serviceName}`,
    useFactory: (clientService: GrpcClientService) => {
      console.log(options.apps[serviceName], serviceName)
      const client = clientService.getClient(serviceName);
      const protoKey = serviceName.toLowerCase();
      return client.getService(protoKey);
    },
    inject: [GrpcClientService, EurekaDiscoveryService],
  }));
}