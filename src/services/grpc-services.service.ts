import { Inject, Injectable } from "@nestjs/common";
import { GrpcClientService } from "./grpc-client.service";
import { EurekaGRPcConnectorModuleOptions } from "../interfaces/module-options.interface";

/**
 * High-level service for accessing gRPC services with Eureka discovery
 * Provides a convenient interface for getting service clients
 * 
 * @example
 * ```typescript
 * constructor(private grpcServices: GrpcServices) {}
 * 
 * async getUser(id: string) {
 *   const userService = this.grpcServices.getService<UserService>('userService');
 *   return userService.getUser({ id });
 * }
 * ```
 */
@Injectable()
export class GrpcServices {
  constructor(
    @Inject(GrpcClientService)
    private readonly clientService: GrpcClientService,
    @Inject('GRPC_DISCOVERY_OPTIONS')
    private readonly options: EurekaGRPcConnectorModuleOptions,
  ) {}

  /**
   * Gets a gRPC service client for the specified service
   * 
   * @template T - The type of the service interface
   * @param serviceName - The name of the service as registered in Eureka
   * @param protobufService - The protobuf service name (optional, defaults to serviceName)
   * @returns The gRPC service client instance
   */
  getService<T extends Object>(serviceName: string, protobufService?: string) {
    if (!protobufService) protobufService = serviceName

    return this.clientService.getClient(serviceName).getService<T>(protobufService);
  }
}