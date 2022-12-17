import { Fn, Stack, StackProps } from "aws-cdk-lib";
import { Peer, Port, Protocol, SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";
import { DockerImageAsset } from "aws-cdk-lib/aws-ecr-assets";
import {
  Cluster,
  ContainerImage,
  FargateService,
  FargateTaskDefinition,
  LogDrivers,
} from "aws-cdk-lib/aws-ecs";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { PrivateDnsNamespace } from "aws-cdk-lib/aws-servicediscovery";
import { Construct } from "constructs";

export class StackClientServer extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = Vpc.fromLookup(this, "VpcDefault", {
      isDefault: true,
    });

    const serviceName = "client-server";

    const appConfig = [
      {
        name: "hello",
        port: 5000,
      },
      {
        name: "world",
        port: 5001,
      },
    ];

    const cluster = Cluster.fromClusterAttributes(this, "Cluster", {
      clusterName: Fn.importValue("cluster-name"),
      securityGroups: [],
      vpc,
    });

    const privateDnsNamespace =
      PrivateDnsNamespace.fromPrivateDnsNamespaceAttributes(this, "Namespace", {
        namespaceArn: Fn.importValue("namespace-arn"),
        namespaceId: Fn.importValue("namespace-id"),
        namespaceName: Fn.importValue("namespace-name"),
      });

    const taskDefinition = new FargateTaskDefinition(this, "TaskDefinition");

    const dockerImageAssetHello = new DockerImageAsset(
      this,
      "DockerImageAssetHello",
      {
        directory: ".",
        file: "serverHello.Dockerfile",
      }
    );

    taskDefinition.addContainer("ContainerHello", {
      image: ContainerImage.fromDockerImageAsset(dockerImageAssetHello),
      logging: LogDrivers.awsLogs({
        logRetention: RetentionDays.ONE_DAY,
        streamPrefix: `/aws/ecs/${serviceName}/${appConfig[0].name}`,
      }),
      portMappings: [
        {
          containerPort: appConfig[0].port,
          name: appConfig[0].name,
        },
      ],
    });

    const dockerImageAssetWorld = new DockerImageAsset(
      this,
      "DockerImageAssetWorld",
      {
        directory: ".",
        file: "serverWorld.Dockerfile",
      }
    );

    taskDefinition.addContainer("ContainerWorld", {
      image: ContainerImage.fromDockerImageAsset(dockerImageAssetWorld),
      logging: LogDrivers.awsLogs({
        logRetention: RetentionDays.ONE_DAY,
        streamPrefix: `/aws/ecs/${serviceName}/${appConfig[1].name}`,
      }),
      portMappings: [
        {
          containerPort: appConfig[1].port,
          name: appConfig[1].name,
        },
      ],
    });

    const serviceSecurityGroup = new SecurityGroup(
      this,
      "ServiceSecurityGroup",
      { vpc }
    );

    serviceSecurityGroup.addIngressRule(
      Peer.anyIpv4(),
      new Port({
        fromPort: appConfig[0].port,
        protocol: Protocol.TCP,
        stringRepresentation: "ServiceIngressPorts",
        toPort: appConfig[1].port,
      }),
      "Allow ingress TCP traffic from ports 5000-5001."
    );

    new FargateService(this, "Service", {
      assignPublicIp: true,
      cluster,
      securityGroups: [serviceSecurityGroup],
      serviceConnectConfiguration: {
        logDriver: LogDrivers.awsLogs({
          logRetention: RetentionDays.ONE_DAY,
          streamPrefix: `/aws/ecs/${serviceName}/service-connect`,
        }),
        namespace: privateDnsNamespace.namespaceName,
        services: appConfig.map((config) => ({ portMappingName: config.name })),
      },
      taskDefinition,
    });
  }
}
