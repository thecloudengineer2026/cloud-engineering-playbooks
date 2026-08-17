import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as iam from 'aws-cdk-lib/aws-iam';

export class Playbook04TechhealthCdkMigrationStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props?: cdk.StackProps
  ) {
    super(scope, id, props);

    // ------------------------------------------------------------
    // Network foundation
    // ------------------------------------------------------------

    const vpc = new ec2.Vpc(this, 'TechHealthVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.20.0.0/16'),
      maxAzs: 2,
      natGateways: 0,

      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // ------------------------------------------------------------
    // Security groups
    // ------------------------------------------------------------

    const applicationSecurityGroup = new ec2.SecurityGroup(
      this,
      'ApplicationSecurityGroup',
      {
        vpc,
        description: 'Security group for the TechHealth application server',
        allowAllOutbound: true,
      }
    );

    applicationSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow public HTTP traffic to the demonstration application'
    );

    /*
     * No inbound SSH rule is created.
     * Administrative access will use AWS Systems Manager
     * Session Manager.
     */
    const databaseSecurityGroup = new ec2.SecurityGroup(
      this,
      'DatabaseSecurityGroup',
      {
        vpc,
        description: 'Security group for the TechHealth RDS database',
        allowAllOutbound: false,
      }
    );

    databaseSecurityGroup.addIngressRule(
      applicationSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL only from the application security group'
    );

    // ------------------------------------------------------------
    // EC2 IAM role
    // ------------------------------------------------------------

    const applicationRole = new iam.Role(this, 'ApplicationInstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description:
        'Allows the TechHealth application instance to use Systems Manager',
    });

    applicationRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'AmazonSSMManagedInstanceCore'
      )
    );

    // ------------------------------------------------------------
    // EC2 application instance
    // ------------------------------------------------------------

    const applicationInstance = new ec2.Instance(
      this,
      'ApplicationInstance',
      {
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2023({
          cpuType: ec2.AmazonLinuxCpuType.X86_64,
        }),
        securityGroup: applicationSecurityGroup,
        role: applicationRole,
        requireImdsv2: true,
      }
    );

    /*
     * User data creates a simple demonstration web page and installs
     * the MariaDB client required for the EC2-to-RDS connectivity test.
     */
    applicationInstance.userData.addCommands(
      'dnf install -y httpd mariadb105',
      'systemctl enable httpd',
      'systemctl start httpd',
      `echo '<h1>TechHealth Infrastructure Migration</h1><p>Managed with AWS CDK</p>' > /var/www/html/index.html`
    );

    // ------------------------------------------------------------
    // RDS MySQL database
    // ------------------------------------------------------------

    const database = new rds.DatabaseInstance(this, 'PatientDatabase', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0_43,
      }),

      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },

      securityGroups: [databaseSecurityGroup],

      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE3,
        ec2.InstanceSize.MICRO
      ),

      credentials: rds.Credentials.fromGeneratedSecret(
        'techhealthadmin',
        {
          excludeCharacters: '"@/\\',
        }
      ),

      databaseName: 'techhealth',
      allocatedStorage: 20,
      storageType: rds.StorageType.GP3,
      storageEncrypted: true,

      publiclyAccessible: false,
      multiAz: false,

      backupRetention: cdk.Duration.days(0),
      deletionProtection: false,
      deleteAutomatedBackups: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    /*
     * The EC2 role may retrieve only the secret associated with this
     * database. It does not receive broad Secrets Manager access.
     */
    database.secret?.grantRead(applicationRole);
    // ------------------------------------------------------------
    // Project tags
    // ------------------------------------------------------------

    cdk.Tags.of(this).add('Project', 'TechHealthMigration');
    cdk.Tags.of(this).add('ManagedBy', 'AWS-CDK');
    cdk.Tags.of(this).add('Environment', 'Development');

    // ------------------------------------------------------------
    // Outputs
    // ------------------------------------------------------------

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'TechHealth migration VPC ID',
    });

    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: vpc.publicSubnets
        .map((subnet) => subnet.subnetId)
        .join(','),
      description: 'Public subnet IDs',
    });

    new cdk.CfnOutput(this, 'DatabaseSubnetIds', {
      value: vpc.isolatedSubnets
        .map((subnet) => subnet.subnetId)
        .join(','),
      description: 'Private isolated database subnet IDs',
    });

    new cdk.CfnOutput(this, 'ApplicationInstanceId', {
      value: applicationInstance.instanceId,
      description: 'TechHealth application EC2 instance ID',
    });

    new cdk.CfnOutput(this, 'ApplicationPublicIp', {
      value: applicationInstance.instancePublicIp,
      description: 'Public IP address of the demonstration application',
    });

        new cdk.CfnOutput(this, 'ApplicationSecurityGroupId', {
      value: applicationSecurityGroup.securityGroupId,
    });

    new cdk.CfnOutput(this, 'DatabaseSecurityGroupId', {
      value: databaseSecurityGroup.securityGroupId,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.dbInstanceEndpointAddress,
      description: 'Private RDS MySQL endpoint',
    });

    new cdk.CfnOutput(this, 'DatabasePort', {
      value: database.dbInstanceEndpointPort,
      description: 'RDS MySQL listener port',
    });

    if (database.secret) {
      new cdk.CfnOutput(this, 'DatabaseSecretName', {
        value: database.secret.secretName,
        description:
          'Secrets Manager secret containing the database credentials',
      });
    }
  }
}