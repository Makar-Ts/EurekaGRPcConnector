import { Inject, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { parseString } from 'xml2js';
import type { ServiceInstance } from '../interfaces/server-instance.interface.js';
import { firstValueFrom } from 'rxjs';

/**
 * Service responsible for discovering and managing service instances from Eureka
 * 
 * @example
 * ```typescript
 * constructor(private discoveryService: EurekaDiscoveryService) {}
 * 
 * async discover() {
 *   await this.discoveryService.discoverServices('http://eureka:8761/eureka/apps');
 *   const instances = this.discoveryService.getServiceInstances('USER-SERVICE');
 * }
 * ```
 */
@Injectable()
export class EurekaDiscoveryService {
  private readonly logger = new Logger(EurekaDiscoveryService.name);
  private instances = new Map<string, ServiceInstance[]>();

  constructor(@Inject(HttpService) private readonly httpService: HttpService) {}

  /**
   * Gets all discovered services
   */
  get allServices() {
    return this.instances;
  }

  /**
   * Discovers services from Eureka server and updates internal cache
   * 
   * @param eurekaUrl - The Eureka server URL to fetch services from
   * @returns Promise that resolves when discovery is complete
   */
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
        })).filter((i: ServiceInstance) => !!i.port);
        this.instances.set(app.name, instances);

        //this.logger.debug(`Discovered ${app.name} service with ${instances.length} instances`);
      }
      
      //this.logger.debug(`Discovered ${this.instances.size} services`);
    } catch (error: any) {
      this.logger.error('Failed to discover services', error.stack);
    }
  }

  /**
   * Gets all instances for a specific service
   * 
   * @param serviceName - The name of the service to get instances for
   * @returns Array of service instances or empty array if none found
   */
  getServiceInstances(serviceName: string): ServiceInstance[] {
    return this.instances.get(serviceName) || [];
  }

  /**
   * Parses XML response from Eureka
   * 
   * @param xml - XML string to parse
   * @returns Promise that resolves with parsed XML object
   * @private
   */
  private parseXml(xml: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const cleanedXml = xml.replace(/^\ufeff/i, '').trim();

      parseString(cleanedXml, (err, result) => {
        err ? reject(err) : resolve(result);
      });
    });
  }
}