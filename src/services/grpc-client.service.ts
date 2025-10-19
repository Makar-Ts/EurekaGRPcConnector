import { Inject, Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ClientProxyFactory, Transport, type ClientGrpc } from '@nestjs/microservices';
import { join } from 'node:path';
import { EurekaDiscoveryService } from './eureka-discovery.service.js';
import type { EurekaGRPcConnectorModuleOptions } from '../interfaces/module-options.interface.js';
import type { ServiceInstance } from '../interfaces/server-instance.interface.js';
import { Cron, CronExpression } from '@nestjs/schedule';

/**
 * Service for managing gRPC clients with Eureka service discovery
 * Handles client creation, load balancing, and periodic updates
 * 
 * @example
 * ```typescript
 * constructor(private grpcClientService: GrpcClientService) {}
 * 
 * getClient() {
 *   const client = this.grpcClientService.getClient('userService');
 *   return client.getService('user');
 * }
 * ```
 */
@Injectable()
export class GrpcClientService implements OnModuleInit {
  private readonly logger = new Logger(GrpcClientService.name);

  private clients = new Map<string, ClientGrpc>();

  constructor(
    @Inject(EurekaDiscoveryService)
    private readonly discoveryService: EurekaDiscoveryService,
    @Inject('GRPC_DISCOVERY_OPTIONS')
    private readonly options: EurekaGRPcConnectorModuleOptions,
  ) {}

  /**
   * Initializes the service
   */
  async onModuleInit() {
    await this.updateClients();
  }

  /**
   * Cron job for updating clients every 30 seconds
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  update() {
    this.updateClients();
  }

  /**
   * Gets a gRPC client for the specified service
   * 
   * @param serviceName - The name of the service to get client for
   * @returns ClientGrpc instance for the service
   * @throws Error if client for service is not found
   */
  getClient(serviceName: string): ClientGrpc {
    const client = this.clients.get(serviceName);
    if (!client) {
      throw new Error(`gRPC client for ${serviceName} not found`);
    }
    return client;
  }

  /**
   * Updates all gRPC clients based on current service instances from Eureka
   * 
   * @private
   */
  private async updateClients() {
    await this.discoveryService.discoverServices(this.options.eureka.url);
    
    for (const [serviceName, instances] of this.discoveryService.allServices) {
      const availableInstances = instances.filter(i => i.status === 'UP');
      
      if (availableInstances.length > 0) {
        const instance = availableInstances[
          Math.floor(Math.random() * availableInstances.length)
        ];

        await this.createClient(serviceName, instance!);
      }
    }
  }

  /**
   * Creates a gRPC client for a specific service instance
   * 
   * @param serviceName - The name of the service
   * @param instance - The service instance to connect to
   * @private
   */
  private async createClient(serviceName: string, instance: ServiceInstance) {
    const options = this.options.apps[serviceName];

    if (!options) {
      //this.logger.debug(`Service ${serviceName} exists in Eureka, but does not in module options.`)
      return
    }

    const client = ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        url: `${instance.ipAddr}:${instance.port}`,
        package: options.package,
        protoPath: join(options.protoPath),
      },
    });

    this.clients.set(options.serviceName, client);
  }
}