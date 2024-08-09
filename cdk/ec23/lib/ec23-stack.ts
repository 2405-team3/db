import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as docdb from 'aws-cdk-lib/aws-docdb';


const INSTANCE_NUM = 4;

export class Ec23Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a VPC (Virtual Private Cloud)
    const vpc = new ec2.Vpc(this, `CDKVpc-${INSTANCE_NUM}`, {
      maxAzs: 2, // Default is all AZs in the region
    });


    // Create security group
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
      vpc,
      allowAllOutbound: true,
    });

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22), // Allow SSH access
      'Allow SSH access from anywhere',
    );

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80), // Allow HTTP access
      'Allow HTTP access from anywhere',
    );

    const docDbSecurityGroup = new ec2.SecurityGroup(this, 'DocDbSecurityGroup', {
      vpc,
    });

    docDbSecurityGroup.addIngressRule(
      ec2SecurityGroup, ec2.Port.tcp(27017)
    )

    // const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
    //   vpc,
    // });




    // EC2 instance

    // Define role
    const ec2Role = new iam.Role(this, 'EC2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });

    // Define an Amazon Machine Image (AMI)
    const ubuntuAmi = ec2.MachineImage.lookup({
      name: 'ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*',
      owners: ['099720109477'], // Canonical's AWS account ID
    });

    // Start-up actions (application code)
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'sudo apt update -y',
      'sudo apt upgrade -y',
      'git clone -b cdk1 https://github.com/2405-team3/db.git /home/ubuntu/db',
      'bash /home/ubuntu/db/setup_scripts/setup_ec2.sh',
      '/bin/bash -c "$(curl -fsSL https://github.com/2405-team3/db/blob/cdk1/setup_scripts/setup_ec2.sh)"'
    )

    const keyPair = ec2.KeyPair.fromKeyPairAttributes(this, 'KeyPair', {
    keyPairName: 'aws1',
      type: ec2.KeyPairType.RSA,
    })

    // Create an EC2 instance
    const instance = new ec2.Instance(this, `CDKEC2-${INSTANCE_NUM}`, {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
      machineImage: ubuntuAmi, 
      securityGroup: ec2SecurityGroup,
      role: ec2Role,
      keyPair: keyPair,
      userData,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC, // Ensure the instance is deployed in a public subnet
      },
      associatePublicIpAddress: true, // Ensure the instance gets a public IP address
    });

    // output the instance public DNS
    new cdk.CfnOutput(this, 'InstancePublicDNS', {
      value: instance.instancePublicDnsName,
    });


    // docdb cluster
    const docdbCluster = new docdb.DatabaseCluster(this, `CDKDocDBCluster-${INSTANCE_NUM}`, {
      masterUser: { username: 'docdbadmin' },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.R5, ec2.InstanceSize.LARGE),
      vpc,
      securityGroup: docDbSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    new cdk.CfnOutput(this, 'DocumentDBEndpoint', {
      value: docdbCluster.clusterEndpoint.hostname,
    });
  }
}

const app = new cdk.App();
new Ec23Stack(app, `CDKInstance${INSTANCE_NUM}`, {
  env: {
    account: '891377036664',
    region: 'us-east-1'
  }
});
app.synth();
