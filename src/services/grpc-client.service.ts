import { Inject, Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ClientProxyFactory, Transport, type ClientGrpc } from '@nestjs/microservices';
import { join } from 'node:path';
import { EurekaDiscoveryService } from './eureka-discovery.service.js';
import type { EurekaGRPcConnectorModuleOptions } from '../interfaces/module-options.interface.js';
import type { ServiceInstance } from '../interfaces/server-instance.interface.js';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class GrpcClientService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(GrpcClientService.name);

  private clients = new Map<string, ClientGrpc>();
  private updateTimer!: NodeJS.Timeout;

  constructor(
    @Inject(EurekaDiscoveryService)
    private readonly discoveryService: EurekaDiscoveryService,
    @Inject('GRPC_DISCOVERY_OPTIONS')
    private readonly options: EurekaGRPcConnectorModuleOptions,
  ) {}

  async onModuleInit() {
    await this.updateClients();
    
    // this.updateTimer = setInterval(() => {
    //   this.updateClients();
    // }, this.options.eureka.pollInterval || 30000);
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  update() {
    this.updateClients();
  }

  onModuleDestroy() {
    this.updateTimer.close();
  }

  getClient(serviceName: string): ClientGrpc {
    const client = this.clients.get(serviceName);
    if (!client) {
      throw new Error(`gRPC client for ${serviceName} not found`);
    }
    return client;
  }

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