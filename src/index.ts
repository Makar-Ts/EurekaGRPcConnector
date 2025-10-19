/**
 * NestJS Eureka gRPC Connector
 * 
 * A powerful module for integrating Netflix Eureka service discovery with gRPC clients
 * in NestJS applications. Provides automatic service discovery, load balancing,
 * and dynamic client management.
 * 
 * @packageDocumentation
 */

export { EurekaGRPcConnectorModule } from './eureka-grpc-connector.module.js'
export { InjectGrpcService } from './helpers/inject.decorator.js'
export { GrpcClientService } from './services/grpc-client.service.js'
export { GrpcServices } from './services/grpc-services.service.js'