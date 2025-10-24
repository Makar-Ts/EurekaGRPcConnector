import { Module, type DynamicModule, type OnModuleDestroy, type OnModuleInit, type Provider } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GrpcClientService } from './services/grpc-client.service.js';
import type { EurekaGRPcConnectorModuleAsyncOptions, EurekaGRPcConnectorModuleOptions, EurekaGRPcConnectorModuleOptionsFactory } from './interfaces/module-options.interface.js';
import { EurekaDiscoveryService } from './services/eureka-discovery.service.js';
import { createGrpcProviders } from './helpers/create-grpc-providers.js';
import { ScheduleModule } from '@nestjs/schedule';
import { Reflector } from '@nestjs/core';
import { GrpcServices } from './services/grpc-services.service.js';


/**
 * Main module for Eureka gRPC connector that provides service discovery
 * and gRPC client management capabilities.
 * 
 * @example
 * ```typescript
 * // Synchronous configuration
 * EurekaGRPcConnectorModule.register({
 *   eureka: { 
 *     url: 'http://eureka:8761/eureka/apps',
 *     debug: true 
 *   },
 *   apps: {
 *     'USER-SERVICE': {
 *       package: 'user',
 *       protoPath: 'proto/user.proto',
 *       serviceName: 'UserService'
 *     }
 *   }
 * })
 * 
 * // Asynchronous configuration
 * EurekaGRPcConnectorModule.registerAsync({
 *   imports: [ConfigModule],
 *   useFactory: (config: ConfigService) => ({
 *     eureka: { url: config.get('EUREKA_URL') },
 *     apps: { ... }
 *   }),
 *   inject: [ConfigService]
 * })
 * ```
 */
@Module({})
export class EurekaGRPcConnectorModule {

  /**
   * Register the module with synchronous configuration
   * 
   * @param options - Module configuration options
   * @returns DynamicModule configuration
   */
  static register(options: EurekaGRPcConnectorModuleOptions): DynamicModule {
    return {
      module: EurekaGRPcConnectorModule,
      global: true,
      imports: [HttpModule],
      providers: [
        {
          provide: 'GRPC_DISCOVERY_OPTIONS',
          useValue: options,
        },
        EurekaDiscoveryService,
        GrpcClientService,
        GrpcServices,
        // GrpcHealthService,
        ...createGrpcProviders(options),
      ],
      exports: [GrpcClientService, GrpcServices, /* GrpcHealthService */],
    };
  }


  /**
   * Register the module with asynchronous configuration
   * 
   * @param options - Asynchronous module configuration options
   * @returns DynamicModule configuration
   */
  static registerAsync(options: EurekaGRPcConnectorModuleAsyncOptions): DynamicModule {
    return {
      module: EurekaGRPcConnectorModule,
      global: true,
      imports: [...(options.imports || []), HttpModule],
      providers: [
        ...this.createAsyncProviders(options),
        EurekaDiscoveryService,
        GrpcClientService,
        GrpcServices,
        // GrpcHealthService,
        {
          provide: 'GRPC_PROVIDERS',
          inject: ['GRPC_DISCOVERY_OPTIONS'],
          useFactory: (opts: EurekaGRPcConnectorModuleOptions) => createGrpcProviders(opts),
        },
        {
          provide: 'GRPC_PROVIDER_LIST',
          inject: ['GRPC_PROVIDERS'],
          useFactory: (providers: Provider[]) => providers,
        },
        ...(options.extraProviders || []),
      ],
      exports: [GrpcClientService, GrpcServices],
    };
  }


  /**
   * Creates async providers based on configuration type
   * 
   * @param options - Async configuration options
   * @returns Array of providers
   * @private
   */
  private static createAsyncProviders(
    options: EurekaGRPcConnectorModuleAsyncOptions,
  ): Provider[] {
    if (options.useFactory) {
      return [
        {
          provide: 'GRPC_DISCOVERY_OPTIONS',
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
      ];
    }

    if (options.useExisting || options.useClass) {
      const useClass = options.useClass || options.useExisting;
      if (!useClass) {
        throw new Error(
          'Invalid async configuration: useClass or useExisting must be provided',
        );
      }

      return [
        {
          provide: 'GRPC_DISCOVERY_OPTIONS',
          useFactory: async (optionsFactory: EurekaGRPcConnectorModuleOptionsFactory) =>
            await optionsFactory.createGrpcDiscoveryOptions(),
          inject: [useClass],
        },
        {
          provide: useClass,
          useClass: useClass,
        },
      ];
    }

    throw new Error(
      'Invalid async configuration: must provide useFactory, useClass, or useExisting',
    );
  }
}
