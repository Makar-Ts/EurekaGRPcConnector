import { Metadata } from "@grpc/grpc-js";
import type { ModuleMetadata, Type } from "@nestjs/common";


export interface GRPcClientSetupOptions {
  package: string;
  protoPath: string;
  serviceName: string;
}

export interface EurekaGRPcConnectorModuleOptions {
  eureka: {
    url: string;
    pollInterval?: number;
    metadata?: Metadata;
  };
  apps: Record<string, GRPcClientSetupOptions>;
}


export interface EurekaGRPcConnectorModuleOptionsFactory {
  createGrpcDiscoveryOptions(): 
    Promise<EurekaGRPcConnectorModuleOptions> | EurekaGRPcConnectorModuleOptions;
}

export interface EurekaGRPcConnectorModuleAsyncOptions 
  extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<EurekaGRPcConnectorModuleOptionsFactory>;
  useClass?: Type<EurekaGRPcConnectorModuleOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<EurekaGRPcConnectorModuleOptions> | EurekaGRPcConnectorModuleOptions;
  inject?: any[];
  extraProviders?: any[];
}