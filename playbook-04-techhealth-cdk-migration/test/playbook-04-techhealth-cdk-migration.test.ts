import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { Playbook04TechhealthCdkMigrationStack } from '../lib/playbook-04-techhealth-cdk-migration-stack';

describe('TechHealth network foundation', () => {
  const app = new cdk.App();

  const stack = new Playbook04TechhealthCdkMigrationStack(
    app,
    'TestTechHealthStack'
  );

  const template = Template.fromStack(stack);

  test('creates one VPC', () => {
    template.resourceCountIs('AWS::EC2::VPC', 1);
  });

  test('creates four subnets across the network tiers', () => {
    template.resourceCountIs('AWS::EC2::Subnet', 4);
  });

  test('creates two public subnets', () => {
    template.hasResourceProperties('AWS::EC2::Subnet', {
      MapPublicIpOnLaunch: true,
    });

    const publicSubnets = template.findResources('AWS::EC2::Subnet', {
      Properties: {
        MapPublicIpOnLaunch: true,
      },
    });

    expect(Object.keys(publicSubnets)).toHaveLength(2);
  });

  test('creates two isolated database subnets', () => {
    const isolatedSubnets = template.findResources('AWS::EC2::Subnet', {
      Properties: {
        MapPublicIpOnLaunch: false,
      },
    });

    expect(Object.keys(isolatedSubnets)).toHaveLength(2);
  });

  test('does not create a NAT gateway', () => {
    template.resourceCountIs('AWS::EC2::NatGateway', 0);
  });

  test('creates an internet gateway for public subnets', () => {
    template.resourceCountIs('AWS::EC2::InternetGateway', 1);
  });
  test('creates one t3.micro EC2 instance', () => {
  template.hasResourceProperties('AWS::EC2::Instance', {
    InstanceType: 't3.micro',
  });

  template.resourceCountIs('AWS::EC2::Instance', 1);
});

test('requires IMDSv2 on the EC2 instance', () => {
  template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
    LaunchTemplateData: {
      MetadataOptions: {
        HttpTokens: 'required',
      },
    },
  });
});

test('allows public HTTP access to the application', () => {
  template.hasResourceProperties('AWS::EC2::SecurityGroup', {
    SecurityGroupIngress: [
      {
        CidrIp: '0.0.0.0/0',
        Description:
          'Allow public HTTP traffic to the demonstration application',
        FromPort: 80,
        IpProtocol: 'tcp',
        ToPort: 80,
      },
    ],
  });
});

test('allows MySQL access only from the application security group', () => {
  template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
    Description: 'Allow MySQL only from the application security group',
    FromPort: 3306,
    IpProtocol: 'tcp',
    SourceSecurityGroupId: Match.anyValue(),
    ToPort: 3306,
  });

  const ingressRules = template.findResources(
    'AWS::EC2::SecurityGroupIngress',
    {
      Properties: {
        FromPort: 3306,
        ToPort: 3306,
      },
    }
  );

  for (const rule of Object.values(ingressRules) as any[]) {
    expect(rule.Properties.CidrIp).toBeUndefined();
    expect(rule.Properties.CidrIpv6).toBeUndefined();
    expect(rule.Properties.SourceSecurityGroupId).toBeDefined();
  }
});

test('does not open inbound SSH', () => {
  const synthesizedTemplate = JSON.stringify(template.toJSON());

  expect(synthesizedTemplate).not.toContain('"FromPort":22');
  expect(synthesizedTemplate).not.toContain('"ToPort":22');
});

test('creates an IAM role assumed by EC2', () => {
  template.hasResourceProperties('AWS::IAM::Role', {
    AssumeRolePolicyDocument: {
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'ec2.amazonaws.com',
          },
        },
      ],
    },
  });
});

test('creates one private encrypted MySQL database', () => {
  template.resourceCountIs('AWS::RDS::DBInstance', 1);

  template.hasResourceProperties('AWS::RDS::DBInstance', {
    DBInstanceClass: 'db.t3.micro',
    DBName: 'techhealth',
    Engine: 'mysql',
    EngineVersion: '8.0.43',
    PubliclyAccessible: false,
    StorageEncrypted: true,
    StorageType: 'gp3',
  });
});

test('creates an RDS subnet group', () => {
  template.resourceCountIs('AWS::RDS::DBSubnetGroup', 1);
});

test('creates generated database credentials in Secrets Manager', () => {
  template.resourceCountIs('AWS::SecretsManager::Secret', 1);

  template.hasResourceProperties('AWS::SecretsManager::Secret', {
    GenerateSecretString: {
      ExcludeCharacters: '"@/\\',
      GenerateStringKey: 'password',
      PasswordLength: 30,
      SecretStringTemplate:
        '{"username":"techhealthadmin"}',
    },
  });
});

test('grants the application role permission to read the database secret', () => {
  template.hasResourceProperties('AWS::IAM::Policy', {
    PolicyDocument: {
      Statement: Match.arrayWith([
        Match.objectLike({
          Action: [
            'secretsmanager:GetSecretValue',
            'secretsmanager:DescribeSecret',
          ],
          Effect: 'Allow',
        }),
      ]),
    },
  });
});

test('configures the lab database for deletion with the stack', () => {
  template.hasResource('AWS::RDS::DBInstance', {
    DeletionPolicy: 'Delete',
    UpdateReplacePolicy: 'Delete',
  });
});

});