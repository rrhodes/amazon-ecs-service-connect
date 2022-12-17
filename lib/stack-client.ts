import { Fn, Stack, StackProps } from "aws-cdk-lib";
import {
  Peer,
  Port,
  Protocol as Ec2Protocol,
  SecurityGroup,
  Vpc
} from "aws-cdk-lib/aws-ec2";
import { DockerImageAsset } from "aws-cdk-lib/aws-ecr-assets";
import {
  Cluster,
  ContainerImage,
  FargateService,
  FargateTaskDefinition,
  ListenerConfig,
  LogDrivers
} from "aws-cdk-lib/aws-ecs";
import {
  NetworkLoadBalancer,
  Protocol as ElbProtocol
} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { PrivateDnsNamespace } from "aws-cdk-lib/aws-servicediscovery";
import { Construct } from "constructs";

export class StackClient extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = Vpc.fromLookup(this, "VpcDefault", {
      isDefault: true,
    });

    const appName = "client";

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

    const loadBalancer = new NetworkLoadBalancer(this, "Load Balancer", {
      internetFacing: true,
      vpc,
    });

    const listener = loadBalancer.addListener("HttpListener", { port: 80 });

    const taskDefinition = new FargateTaskDefinition(this, "TaskDefinition");

    const dockerImageAsset = new DockerImageAsset(this, "DockerImageAsset", {
      directory: ".",
      file: "client.Dockerfile",
    });

    const containerPort = 5000;

    const container = taskDefinition.addContainer("Container", {
      image: ContainerImage.fromDockerImageAsset(dockerImageAsset),
      logging: LogDrivers.awsLogs({
        logRetention: RetentionDays.ONE_DAY,
        streamPrefix: `/aws/ecs/${appName}`,
      }),
      portMappings: [
        {
          containerPort,
          name: appName,
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
        fromPort: containerPort,
        protocol: Ec2Protocol.TCP,
        stringRepresentation: "ServiceIngressPort",
        toPort: containerPort,
      }),
      "Allow ingress TCP traffic from port 5000."
    );

    const service = new FargateService(this, "Service", {
      assignPublicIp: true,
      cluster,
      enableExecuteCommand: true,
      securityGroups: [serviceSecurityGroup],
      serviceConnectConfiguration: {
        logDriver: LogDrivers.awsLogs({
          logRetention: RetentionDays.ONE_DAY,
          streamPrefix: `/aws/ecs/${appName}/service-connect`,
        }),
        namespace: privateDnsNamespace.namespaceName,
      },
      taskDefinition,
    });

    service.registerLoadBalancerTargets({
      containerName: container.containerName,
      listener: ListenerConfig.networkListener(listener, {
        healthCheck: {
          port: String(containerPort),
          protocol: ElbProtocol.TCP,
        },
        port: containerPort,
        protocol: ElbProtocol.TCP,
      }),
      newTargetGroupId: "TargetGroup",
    });
  }
}
