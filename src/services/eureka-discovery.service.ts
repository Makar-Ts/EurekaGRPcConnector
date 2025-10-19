import { Inject, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { parseString } from 'xml2js';
import type { ServiceInstance } from '../interfaces/server-instance.interface.js';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class EurekaDiscoveryService {
  private readonly logger = new Logger(EurekaDiscoveryService.name);
  private instances = new Map<string, ServiceInstance[]>();

  constructor(@Inject(HttpService) private readonly httpService: HttpService) {}

  get allServices() {
    return this.instances;
  }

  async discoverServices(eurekaUrl: string): Promise<void> {
    try {
      const response = await firstValueFrom(this.httpService.get(eurekaUrl));
      
      this.instances.clear();
      for (let app of response.data.applications.application) {
        const instances: ServiceInstance[] = app.instance.map((inst: any) => ({
          app: app.name,
          instanceId: inst.instanceId,
          hostName: inst.hostName,
          ipAddr: inst.ipAddr,
          port: +inst.metadata.gRPC_port,
          status: inst.status
        }));
        this.instances.set(app.name, instances);

        //this.logger.debug(`Discovered ${app.name} service with ${instances.length} instances`);
      }
      
      //this.logger.debug(`Discovered ${this.instances.size} services`);
    } catch (error: any) {
      this.logger.error('Failed to discover services', error.stack);
    }
  }

  getServiceInstances(serviceName: string): ServiceInstance[] {
    return this.instances.get(serviceName) || [];
  }

  private parseXml(xml: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const cleanedXml = xml.replace(/^\ufeff/i, '').trim();

      parseString(cleanedXml, (err, result) => {
        err ? reject(err) : resolve(result);
      });
    });
  }
}