interface Port {
  $: number;
  '@enabled': boolean;
}

interface DataCenterInfo {
  '@class': string;
  name: string;
}

interface LeaseInfo {
  renewalIntervalInSecs?: number;
  durationInSecs?: number;
  registrationTimestamp?: number;
  lastRenewalTimestamp?: number;
  evictionTimestamp?: number;
  serviceUpTimestamp?: number;
}

interface Metadata {
  [key: string]: string;
}

export interface EurekaInstance {
  instanceId: string;
  hostName: string;
  app: string;
  ipAddr: string;
  status: 'UP' | 'DOWN' | 'STARTING' | 'OUT_OF_SERVICE' | 'UNKNOWN';
  overriddenstatus?: 'UP' | 'DOWN' | 'STARTING' | 'OUT_OF_SERVICE' | 'UNKNOWN';
  port?: Port;
  securePort?: Port;
  countryId?: number;
  dataCenterInfo: DataCenterInfo;
  leaseInfo?: LeaseInfo;
  metadata?: Metadata;
  homePageUrl?: string;
  statusPageUrl?: string;
  healthCheckUrl?: string;
  vipAddress: string;
  secureVipAddress?: string;
  isCoordinatingDiscoveryServer?: boolean;
  lastUpdatedTimestamp?: number;
  lastDirtyTimestamp?: number;
  actionType?: 'ADDED' | 'MODIFIED' | 'DELETED';
}

export interface EurekaApp {
  name: string;
  instance: EurekaInstance[] | null;
}