import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { Vpc } from "aws-cdk-lib/aws-ec2";
import { Cluster } from "aws-cdk-lib/aws-ecs";
import { PrivateDnsNamespace } from "aws-cdk-lib/aws-servicediscovery";
import { Construct } from "constructs";

export class StackShared extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = Vpc.fromLookup(this, "VpcDefault", {
      isDefault: true,
    });

    const cluster = new Cluster(this, "Cluster", {
      defaultCloudMapNamespace: {
        name: "hello-world.com",
      },
      vpc,
    });

    const privateDnsNamespace =
      cluster.defaultCloudMapNamespace as PrivateDnsNamespace;

    new CfnOutput(this, "ClusterName", {
      exportName: "cluster-name",
      value: cluster.clusterName,
    });

    new CfnOutput(this, "NamespaceArn", {
      exportName: "namespace-arn",
      value: privateDnsNamespace.namespaceArn,
    });

    new CfnOutput(this, "NamespaceId", {
      exportName: "namespace-id",
      value: privateDnsNamespace.namespaceId,
    });

    new CfnOutput(this, "NamespaceName", {
      exportName: "namespace-name",
      value: privateDnsNamespace.namespaceName,
    });
  }
}
