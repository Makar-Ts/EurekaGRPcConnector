import { Inject, Injectable } from "@nestjs/common";
import { GrpcClientService } from "./grpc-client.service";
import { EurekaGRPcConnectorModuleOptions } from "../interfaces/module-options.interface";

@Injectable()
export class GrpcServices {
  constructor(
    @Inject(GrpcClientService)
    private readonly clientService: GrpcClientService,
    @Inject('GRPC_DISCOVERY_OPTIONS')
    private readonly options: EurekaGRPcConnectorModuleOptions,
  ) {}

  getService<T extends Object>(serviceName: string, protobufService?: string) {
    if (!protobufService) protobufService = serviceName

    return this.clientService.getClient(serviceName).getService<T>(protobufService);
  }
}