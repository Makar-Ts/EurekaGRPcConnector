# NestJS Eureka gRPC Connector

A powerful NestJS module that provides seamless integration between Netflix Eureka service discovery and gRPC clients. Automatically discovers gRPC services registered in Eureka and provides load-balanced client connections.

## Features

- 🔍 **Automatic Service Discovery**: Automatically discovers gRPC services from Eureka registry
- ⚖️ **Load Balancing**: Random load balancing between available service instances  
- 🔄 **Dynamic Updates**: Periodically updates service instances from Eureka
- 🛠 **Type-Safe**: Full TypeScript support with proper type definitions
- ⚡ **Async Configuration**: Support for both synchronous and asynchronous configuration
- 🔌 **Multiple Services**: Support for connecting to multiple gRPC services simultaneously
- 🔧 **Custom Processing**: Extensible instance processing with custom processors
- 📊 **Debug Mode**: Optional debug logging for development
- 🔄 **Eureka Client Support**: Built-in support for eureka-js-client for advanced Eureka integration

## Installation

```bash
npm install nestjs-eureka-grpc-connector
```

## Prerequisites

- NestJS application
- Eureka server running OR eureka-js-client configuration
- Proto files for your gRPC services

## Quick Start

### Basic Setup with Eureka URL

```typescript
import { Module } from '@nestjs/common';
import { join } from 'path';
import { EurekaGRPcConnectorModule } from 'nestjs-eureka-grpc-connector';

@Module({
  imports: [
    EurekaGRPcConnectorModule.register({
      eureka: {
        url: 'http://eureka-server:8761/eureka/apps',
        debug: true, // Optional: enable debug logging
      },
      apps: {
        'USER-SERVICE': { // Eureka app name
          package: 'user',
          protoPath: join(__dirname, './proto/user.proto'),
          serviceName: 'UserService', // Injectable service name
        },
      },
    }),
  ],
})
export class AppModule {}
```

### Setup with Eureka JS Client

```typescript
import { Module } from '@nestjs/common';
import { join } from 'path';
import { EurekaGRPcConnectorModule } from 'nestjs-eureka-grpc-connector';
import { Eureka } from 'eureka-js-client';

// Configure Eureka client
const eurekaClient = new Eureka({
  instance: {
    app: 'my-service',
    hostName: 'localhost',
    ipAddr: '127.0.0.1',
    port: 8080,
    vipAddress: 'my-service',
    dataCenterInfo: {
      name: 'MyOwn',
    },
  },
  eureka: {
    host: 'eureka-server',
    port: 8761,
    servicePath: '/eureka/apps',
  },
});
eurekaClient.start();

@Module({
  imports: [
    EurekaGRPcConnectorModule.register({
      eureka: {
        eureka: eurekaClient,
        debug: true,
      },
      apps: {
        'USER-SERVICE': {
          package: 'user',
          protoPath: join(__dirname, './proto/user.proto'),
          serviceName: 'UserService',
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
          debug: configService.get('EUREKA_DEBUG') === 'true',
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

## Eureka Configuration Options

The module supports two ways to connect to Eureka:

### 1. Direct URL Configuration
```typescript
eureka: {
  url: 'http://eureka-server:8761/eureka/apps',
  pollInterval?: number, // Default: 30000ms
  debug?: boolean
}
```

### 2. Eureka JS Client Configuration  
```typescript
eureka: {
  eureka: EurekaClientInstance,
  pollInterval?: number, // Default: 30000ms
  debug?: boolean
}
```

### Custom Instance Processing

```typescript
import { Module } from '@nestjs/common';
import { EurekaGRPcConnectorModule, InstanceProcessor } from 'nestjs-eureka-grpc-connector';

const customInstanceProcessor: InstanceProcessor = (eurekaInstance, eurekaApp) => {
  // Custom logic to process Eureka instances
  if (eurekaInstance.metadata?.customGrpcPort) {
    return {
      app: eurekaApp.name,
      instanceId: eurekaInstance.instanceId,
      hostName: eurekaInstance.hostName,
      ipAddr: eurekaInstance.ipAddr,
      port: +eurekaInstance.metadata.customGrpcPort,
      status: eurekaInstance.status
    };
  }
  return null;
};

@Module({
  imports: [
    EurekaGRPcConnectorModule.register({
      eureka: {
        url: 'http://eureka-server:8761/eureka/apps',
      },
      instanceProcessor: customInstanceProcessor,
      apps: {
        'USER-SERVICE': {
          package: 'user',
          protoPath: join(__dirname, './proto/user.proto'),
          serviceName: 'UserService',
        },
      },
    }),
  ],
})
export class AppModule {}
```

## Usage

### Using the GrpcServices Service (Recommended)

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

### Using GrpcClientService Directly

```typescript
import { Injectable } from '@nestjs/common';
import { GrpcClientService } from 'nestjs-eureka-grpc-connector';

@Injectable()
export class UserClientService {
  constructor(private readonly grpcClientService: GrpcClientService) {}

  async getUser(id: string) {
    const client = this.grpcClientService.getClient('UserService');
    const userService = client.getService<any>('user'); // 'user' is the proto package name
    return userService.getUser({ id });
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

- `discoverServices(eurekaUrl: string, options?: { debug?: boolean, instanceProcessor?: InstanceProcessor }): Promise<Map<string, ServiceInstance[]>`: Discover services from Eureka
- `getServiceInstances(serviceName: string): ServiceInstance[]`: Get instances for a service
- `get allServices`: Get all discovered services

## Interfaces

### EurekaGRPcConnectorModuleOptions

```typescript
interface EurekaGRPcConnectorModuleOptions {
  eureka: {
    url: string;
    pollInterval?: number; // Note: Currently not implemented
    metadata?: Metadata;
    debug?: boolean;
  };
  instanceProcessor?: InstanceProcessor; // Custom instance processing
  apps: Record<string, GRPcClientSetupOptions>;
}
```

### GRPcClientSetupOptions

```typescript
interface GRPcClientSetupOptions {
  package: string;        // Proto package name
  protoPath: string;      // Path to proto file
  serviceName: string;    // Injectable service name
}
```

### ServiceInstance

```typescript
interface ServiceInstance {
  app: string;           // Application name in Eureka
  instanceId: string;    // Unique instance identifier
  hostName: string;      // Hostname of the instance
  ipAddr: string;       // IP address of the instance
  port: number;         // gRPC port number
  status: string;       // Instance status (UP, DOWN, etc.)
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

Example proto file:

```proto
syntax = "proto3";

package user;

service UserService {
  rpc GetUser (GetUserRequest) returns (UserResponse);
  rpc CreateUser (CreateUserRequest) returns (UserResponse);
}

message GetUserRequest {
  string id = 1;
}

message CreateUserRequest {
  string name = 1;
  string email = 2;
}

message UserResponse {
  User user = 1;
}

message User {
  string id = 1;
  string name = 2;
  string email = 3;
}
```

## Error Handling

The module includes comprehensive error handling:

- Failed Eureka discovery attempts are logged but don't crash the application
- Missing services throw clear error messages
- Invalid configurations are validated on startup

## Best Practices

1. **Service Naming**: Use consistent naming between Eureka app names and service configurations
2. **Error Handling**: Always wrap gRPC calls in try-catch blocks
3. **Health Checks**: Monitor service health through Eureka status
4. **Debug Mode**: Enable debug mode during development for better visibility

## Common Issues

1. **Service Not Found**: Ensure the Eureka app name matches exactly in your configuration
2. **Port Issues**: Verify that `gRPC_port` is set in Eureka metadata
3. **Proto Path**: Use absolute paths for proto files to avoid path resolution issues

## License

MIT License - see the [LICENSE](LICENCE) file for details.