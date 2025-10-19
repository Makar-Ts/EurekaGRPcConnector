import { Inject } from '@nestjs/common';

/**
 * DOES NOT WORKING
 * Decorator for injecting gRPC services discovered via Eureka
 * 
 * @param service - The service name to inject
 * @returns PropertyDecorator for dependency injection
 * 
 * @example
 * ```typescript
 * class MyService {
 *   constructor(
 *     @InjectGrpcService('userService')
 *     private readonly userService: UserService
 *   ) {}
 * }
 * ```
 */
export const InjectGrpcService = (service: string) => Inject(`GRPC_SERVICE_${service}`);