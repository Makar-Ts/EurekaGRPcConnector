import type { Provider } from '@nestjs/common';
import { GrpcClientService } from '../services/grpc-client.service.js';
import type { EurekaGRPcConnectorModuleOptions } from '../interfaces/module-options.interface.js';
import { EurekaDiscoveryService } from '../services/eureka-discovery.service.js';

/**
 * Creates gRPC service providers for dependency injection
 * 
 * @param options - Module configuration options
 * @returns Array of providers for gRPC services
 */
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