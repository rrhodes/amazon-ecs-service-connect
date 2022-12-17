#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import "source-map-support/register";
import { StackClient } from "../lib/stack-client";
import { StackClientServer } from "../lib/stack-client-server";
import { StackShared } from "../lib/stack-shared";

const app = new cdk.App();

new StackShared(app, "StackShared", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

new StackClient(app, "StackClient", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

new StackClientServer(app, "StackClientServer", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
