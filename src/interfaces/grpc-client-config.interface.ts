/**
 * Configuration for a gRPC client connection
 */
export interface GrpcClientConfig {
  /** The package name from the proto file */
  package: string;
  /** Path to the proto file */
  protoPath: string;
  /** gRPC server URL */
  url: string;
}