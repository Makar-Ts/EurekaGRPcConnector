import { EurekaApp, EurekaInstance } from "../interfaces/eureka-instance.interface";
import { ServiceInstance } from "../interfaces/server-instance.interface";

/**
 * Default processor for converting Eureka instances to service instances.
 * 
 * Extracts gRPC port from Eureka instance metadata and creates a ServiceInstance.
 * Only processes instances that have 'gRPC_port' in their metadata.
 * 
 * @param eurekaInstance - The raw Eureka instance from discovery
 * @param eurekaApp - The parent Eureka application
 * @returns Processed ServiceInstance or null if invalid
 * 
 * @example
 * ```typescript
 * const instance = defaultInstanceProcessor(eurekaInstance, eurekaApp);
 * if (instance) {
 *   // Use the valid gRPC service instance
 * }
 * ```
 */
export function defaultInstanceProcessor(eurekaInstance: EurekaInstance, eurekaApp: EurekaApp): ServiceInstance | null {
  if (!eurekaInstance.metadata?.gRPC_port) return null;
  
  return {
    app: eurekaApp.name,
    instanceId: eurekaInstance.instanceId,
    hostName: eurekaInstance.hostName,
    ipAddr: eurekaInstance.ipAddr,
    port: +eurekaInstance.metadata.gRPC_port,
    status: eurekaInstance.status
  }
}