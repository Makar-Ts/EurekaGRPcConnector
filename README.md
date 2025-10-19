# NestJS Eureka gRPC Connector

A powerful NestJS module that provides seamless integration between Netflix Eureka service discovery and gRPC clients. Automatically discovers gRPC services registered in Eureka and provides load-balanced client connections.

## Features

- 🔍 **Automatic Service Discovery**: Automatically discovers gRPC services from Eureka registry
- ⚖️ **Load Balancing**: Random load balancing between available service instances
- 🔄 **Dynamic Updates**: Periodically updates service instances from Eureka
- 🛠 **Type-Safe**: Full TypeScript support with proper type definitions
- ⚡ **Async Configuration**: Support for both synchronous and asynchronous configuration
- 🔌 **Multiple Services**: Support for connecting to multiple gRPC services simultaneously

## Installation

```bash
npm install nestjs-eureka-grpc-connector
```

## Quick Start

### Basic Setup

```typescript
import { Module } from '@nestjs/common';
import { EurekaGRPcConnectorModule } from 'nestjs-eureka-grpc-connector';

@Module({
  imports: [
    EurekaGRPcConnectorModule.register({
      eureka: {
        url: 'http://eureka-server:8761/eureka/apps',
      },
      apps: {
        'USER-SERVICE': { // < eureka app name
          package: 'user',
          protoPath: join(__dirname, './proto/user.proto'),
          serviceName: 'UserService', // < injectable name
        },
        'ORDER-SERVICE': {
          package: 'order',
          protoPath: join(__dirname, './proto/order.proto'),
          serviceName: 'OrderService',
        },
      },
    }),
  ],
})
export class AppModule {}
```

### Async Configuration

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EurekaGRPcConnectorModule } from 'nestjs-eureka-grpc-connector';

@Module({
  imports: [
    EurekaGRPcConnectorModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        eureka: {
          url: configService.get('EUREKA_URL'),
        },
        apps: {
          [configService.get('USER_SERVICE_NAME')]: {
            package: 'user',
            protoPath: configService.get('USER_PROTO_PATH'),
            serviceName: 'UserService',
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

## Usage

### Using the GrpcServices Service

```typescript
import { Injectable } from '@nestjs/common';
import { GrpcServices } from 'nestjs-eureka-grpc-connector';

interface UserService {
  getUser(request: { id: string }): Promise<{ user: any }>;
  createUser(request: { name: string; email: string }): Promise<{ user: any }>;
}

@Injectable()
export class UserClientService {
  constructor(private readonly grpcServices: GrpcServices) {}

  async getUser(id: string) {
    const userService = this.grpcServices.getService<UserService>('UserService');
    return userService.getUser({ id });
  }

  async createUser(name: string, email: string) {
    const userService = this.grpcServices.getService<UserService>('UserService');
    return userService.createUser({ name, email });
  }
}
```

## API Documentation

### EurekaGRPcConnectorModule

The main module that provides Eureka gRPC connectivity.

#### Static Methods

- `register(options: EurekaGRPcConnectorModuleOptions)`: Synchronous configuration
- `registerAsync(options: EurekaGRPcConnectorModuleAsyncOptions)`: Asynchronous configuration

### GrpcServices Service

Main service for accessing gRPC services.

#### Methods

- `getService<T>(serviceName: string, protobufService?: string): T`: Get a gRPC service client

### GrpcClientService

Low-level service for managing gRPC clients.

#### Methods

- `getClient(serviceName: string): ClientGrpc`: Get the gRPC client for a service

### EurekaDiscoveryService

Service responsible for Eureka service discovery.

#### Methods

- `discoverServices(eurekaUrl: string): Promise<void>`: Discover services from Eureka
- `getServiceInstances(serviceName: string): ServiceInstance[]`: Get instances for a service
- `get allServices`: Get all discovered services

## Interfaces

### EurekaGRPcConnectorModuleOptions

```typescript
interface EurekaGRPcConnectorModuleOptions {
  eureka: {
    url: string;
    pollInterval?: number;
    metadata?: Metadata;
  };
  apps: Record<string, GRPcClientSetupOptions>;
}
```

### GRPcClientSetupOptions

```typescript
interface GRPcClientSetupOptions {
  package: string;
  protoPath: string;
  serviceName: string;
}
```

### ServiceInstance

```typescript
interface ServiceInstance {
  app: string;
  instanceId: string;
  hostName: string;
  ipAddr: string;
  port: number;
  status: string;
}
```

## Configuration

### Eureka Setup

Ensure your gRPC services register with Eureka and include the gRPC port in metadata:

```yaml
# Example Spring Boot application.yml
eureka:
  instance:
    metadata-map:
      gRPC_port: 6565
```

### Proto File Requirements

Your proto files should be accessible at the specified `protoPath`. The library uses the package name from the proto file to create the service client.

## License

MIT License - see the [LICENSE](LICENCE) file for details.
