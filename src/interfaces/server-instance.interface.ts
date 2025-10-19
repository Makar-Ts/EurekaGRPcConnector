/**
 * Represents a service instance discovered from Eureka
 */
export interface ServiceInstance {
  /** Application name in Eureka */
  app: string;
  /** Unique instance identifier */
  instanceId: string;
  /** Hostname of the instance */
  hostName: string;
  /** IP address of the instance */
  ipAddr: string;
  /** gRPC port number */
  port: number;
  /** Instance status (UP, DOWN, etc.) */
  status: string;
}