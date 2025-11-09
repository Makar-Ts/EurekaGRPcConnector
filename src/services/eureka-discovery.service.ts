import { Inject, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { parseString } from 'xml2js';
import type { ServiceInstance } from '../interfaces/server-instance.interface.js';
import { firstValueFrom } from 'rxjs';
import { InstanceProcessor } from '../interfaces/instance-processor.type.js';
import { EurekaApp, EurekaInstance } from '../interfaces/eureka-instance.interface.js';
import { defaultInstanceProcessor } from '../helpers/default-instance-processor.js';
import { Eureka } from 'eureka-js-client';

/**
 * Service responsible for discovering and managing service instances from Eureka
 * Supports both direct Eureka server URLs and eureka-js-client instances
 * 
 * @example
 * ```typescript
 * // With Eureka URL
 * await this.discoveryService.discoverServices(
 *   'http://eureka:8761/eureka/apps',
 *   { debug: true }
 * );
 * 
 * // With Eureka client instance  
 * await this.discoveryService.discoverServices(
 *   eurekaClient,
 *   { debug: true, appsIds: ['USER-SERVICE'] }
 * );
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
   * Discovers services from Eureka server or client and updates internal cache
   * 
   * Supports two operation modes:
   * 1. URL-based discovery: Fetches service information from Eureka server URL
   * 2. Client-based discovery: Uses pre-configured Eureka client instance
   * 
   * @param eureka - The Eureka server URL or Eureka client to fetch services from
   * @param options - Discovery options including debug mode and instance processor
   * @returns Promise that resolves with map of service names to their instances
   */
  async discoverServices(eureka: Eureka, options: { debug?: boolean, instanceProcessor?: InstanceProcessor, appsIds: string[] }): Promise<Map<string, ServiceInstance[]>>
  async discoverServices(eureka: string, options?: { debug?: boolean, instanceProcessor?: InstanceProcessor }): Promise<Map<string, ServiceInstance[]>>
  async discoverServices(eureka: string | Eureka, options?: any): Promise<Map<string, ServiceInstance[]>> {
    const debug = options && !!options.debug;
    const instanceProcessor = options?.instanceProcessor || defaultInstanceProcessor;

    try {
      if (typeof eureka == 'object') {
        const apps = options!.appsIds.map((v: string) => eureka.getInstancesByAppId(v));
        
        this.instances.clear();
        for (let [index, inst] of Object.entries(apps)) {
          const appName = options!.appsIds[+index];

          const instances: ServiceInstance[] = 
            (inst as any)
              .map((i: EurekaInstance) => (instanceProcessor(i, { name: appName })))
              .filter((i: EurekaInstance) => i != null);
          
          this.instances.set(appName, instances);

          debug && this.logger.debug(`Discovered ${appName} service with ${instances.length} instances`);
        }
      } else {
        const response = await firstValueFrom(this.httpService.get(eureka));

        this.instances.clear();
        for (let app of response.data.applications.application as EurekaApp[]) {
          const instances: ServiceInstance[] = 
            (app.instance || [])
              .map((inst: EurekaInstance) => (instanceProcessor(inst, app)))
              .filter(i => i != null);
          
          this.instances.set(app.name, instances);

          debug && this.logger.debug(`Discovered ${app.name} service with ${instances.length} instances`);
        }
      }
      
      debug && this.logger.debug(`Discovered ${this.instances.size} services`);
    } catch (error: any) {
      this.logger.error('Failed to discover services', error.stack);
    }

    return this.instances;
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