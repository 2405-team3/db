import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

import * as ec2 from 'aws-cdk-lib/aws-ec2';

const INSTANCE_NUM = 4;

export class Ec23Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a VPC (Virtual Private Cloud)
    const vpc = new ec2.Vpc(this, 'CDKVpc', {
      maxAzs: 2, // Default is all AZs in the region
    });

    const securityGroup = new ec2.SecurityGroup(this, 'CDKSecurityGroup', {
      vpc,
      allowAllOutbound: true,
    });

    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22), // Allow SSH access
      'Allow SSH access from anywhere',
    );

    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80), // Allow HTTP access
      'Allow HTTP access from anywhere',
    );

    const ubuntuAmi = ec2.MachineImage.lookup({
      name: 'ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*',
      owners: ['099720109477'], // Canonical's AWS account ID
    });

    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'sudo apt update -y',
      'sudo apt upgrade -y',
      'git clone -b cdk1 https://github.com/2405-team3/db.git /home/ubuntu/db',
      'bash /home/ubuntu/db/setup_scripts/setup_ec2.sh'
      // 'curl https://pyenv.run | bash',
      // 'export PYENV_ROOT="$HOME/.pyenv',
      // '[[ -d $PYENV_ROOT/bin ]] && export PATH="$PYENV_ROOT/bin:$PATH"',
      // 'eval "$(pyenv init -)"',
//       'sudo apt install build-essential libssl-dev zlib1g-dev \
// libbz2-dev libreadline-dev libsqlite3-dev curl \
// libncursesw5-dev xz-utils tk-dev libxml2-dev libxmlsec1-dev libffi-dev liblzma-dev -y',
    )

    // Define an Amazon Machine Image (AMI)
    // const ami = new ec2.AmazonLinuxImage();

    const keyPair = ec2.KeyPair.fromKeyPairAttributes(this, 'KeyPair', {
    keyPairName: 'aws1',
      type: ec2.KeyPairType.RSA,
    })

    // Create an EC2 instance
    const instance = new ec2.Instance(this, `CDKEC2-${INSTANCE_NUM}`, {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
      machineImage: ubuntuAmi, securityGroup,
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
