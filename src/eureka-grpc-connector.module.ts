import { Module, type DynamicModule, type OnModuleDestroy, type OnModuleInit, type Provider } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GrpcClientService } from './services/grpc-client.service.js';
import type { EurekaGRPcConnectorModuleAsyncOptions, EurekaGRPcConnectorModuleOptions, EurekaGRPcConnectorModuleOptionsFactory } from './interfaces/module-options.interface.js';
import { EurekaDiscoveryService } from './services/eureka-discovery.service.js';
import { createGrpcProviders } from './helpers/create-grpc-providers.js';
import { ScheduleModule } from '@nestjs/schedule';
import { Reflector } from '@nestjs/core';
import { GrpcServices } from './services/grpc-services.service.js';

@Module({})
export class EurekaGRPcConnectorModule {
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
