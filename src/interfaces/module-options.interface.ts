import { Metadata } from "@grpc/grpc-js";
import type { ModuleMetadata, Type } from "@nestjs/common";
import { InstanceProcessor } from "./instance-processor.type";

/**
 * Configuration options for setting up a gRPC client
 */
export interface GRPcClientSetupOptions {
  /** The package name from the proto file */
  package: string;
  /** Path to the proto file */
  protoPath: string;
  /** Service name as registered in Eureka */
  serviceName: string;
}

/**
 * Main configuration options for the Eureka gRPC connector module
 */
export interface EurekaGRPcConnectorModuleOptions {
  /** Eureka server configuration */
  eureka: {
    /** Eureka server URL */
    url: string;
    /** [not working] Polling interval in milliseconds (optional, defaults to 30000) */
    pollInterval?: number;
    /** Additional metadata for Eureka requests (optional) */
    metadata?: Metadata;

    debug?: boolean;
  };
  instanceProcessor?: InstanceProcessor;
  /** Mapping of service names to their gRPC configuration */
  apps: Record<string, GRPcClientSetupOptions>;
}

/**
 * Factory interface for creating module options asynchronously
 */
export interface EurekaGRPcConnectorModuleOptionsFactory {
  /**
   * Creates Eureka gRPC connector module options
   * @returns Promise or direct value of module options
   */
  createGrpcDiscoveryOptions(): 
    Promise<EurekaGRPcConnectorModuleOptions> | EurekaGRPcConnectorModuleOptions;
}

/**
 * Asynchronous configuration options for the module
 */
export interface EurekaGRPcConnectorModuleAsyncOptions 
  extends Pick<ModuleMetadata, 'imports'> {
  /** Use an existing options provider */
  useExisting?: Type<EurekaGRPcConnectorModuleOptionsFactory>;
  /** Use a class as options provider */
  useClass?: Type<EurekaGRPcConnectorModuleOptionsFactory>;
  /** Factory function for creating options */
  useFactory?: (
    ...args: any[]
  ) => Promise<EurekaGRPcConnectorModuleOptions> | EurekaGRPcConnectorModuleOptions;
  /** Dependencies to inject into the factory */
  inject?: any[];
  /** Additional providers */
  extraProviders?: any[];
}