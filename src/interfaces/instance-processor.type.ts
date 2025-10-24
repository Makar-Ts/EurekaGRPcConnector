import { EurekaApp, EurekaInstance } from "./eureka-instance.interface";
import { ServiceInstance } from "./server-instance.interface";

export type InstanceProcessor = (eurekaInstance: EurekaInstance, eurekaApp: EurekaApp) => ServiceInstance | null;