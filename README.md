# Amazon ECS Service Connect

This is an ECS Service Connect proof-of-concept using CDK with TypeScript.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template

## Usage

## Development

### Deployment Order

[Deployment order](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/service-connect.html#service-connect-concepts-deploy) is an important consideration for ECS Service Connect. If a logical service in task A wants to reference another logical service in task B, then task B must launch first, otherwise logical services in task A will not recognise logical services in task B.

Deployment order is as follows:

1. `StackShared` to provision the ECS cluster and Cloud Map namespace,
1. `StackWorker` to define two Service Connect client-server tasks within a single ECS service, then
1. `StackIngress`, to create one Service Connect client task, which will recognise logical services from aforementioned client-server tasks.
