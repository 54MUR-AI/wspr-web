# AWS Infrastructure Setup Guide

## Overview
This guide details the AWS infrastructure setup required for deploying the WSPR web application.

## Prerequisites
- AWS Account with administrative access
- AWS CLI installed and configured
- Domain name registered (preferably in Route 53)

## Infrastructure Components

### S3 Buckets
1. Staging Bucket
```bash
aws s3api create-bucket \
  --bucket wspr-staging \
  --region us-west-2 \
  --create-bucket-configuration LocationConstraint=us-west-2
```

2. Production Bucket
```bash
aws s3api create-bucket \
  --bucket wspr-production \
  --region us-west-2 \
  --create-bucket-configuration LocationConstraint=us-west-2
```

3. Configure Static Website Hosting
```bash
aws s3 website s3://wspr-production/ --index-document index.html --error-document index.html
```

4. Bucket Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::wspr-production/*"
    }
  ]
}
```

### CloudFront Distribution

1. Create SSL Certificate
```bash
aws acm request-certificate \
  --domain-name wspr.app \
  --validation-method DNS \
  --subject-alternative-names *.wspr.app
```

2. Create Distribution
```bash
aws cloudfront create-distribution \
  --origin-domain-name wspr-production.s3.us-west-2.amazonaws.com \
  --default-root-object index.html \
  --enabled
```

3. Configure Custom Domain
```bash
aws cloudfront create-distribution \
  --distribution-config file://distribution-config.json
```

distribution-config.json:
```json
{
  "CallerReference": "wspr-app",
  "Aliases": {
    "Quantity": 2,
    "Items": ["wspr.app", "www.wspr.app"]
  },
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-wspr-production",
        "DomainName": "wspr-production.s3.us-west-2.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-wspr-production",
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    },
    "TrustedSigners": {
      "Enabled": false,
      "Quantity": 0
    },
    "ViewerProtocolPolicy": "redirect-to-https",
    "MinTTL": 0
  },
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": 200,
        "ErrorCachingMinTTL": 300
      }
    ]
  },
  "Comment": "WSPR Web Application",
  "Enabled": true
}
```

### Route 53

1. Create Hosted Zone
```bash
aws route53 create-hosted-zone \
  --name wspr.app \
  --caller-reference wspr-$(date +%s)
```

2. Add CloudFront Alias Records
```bash
aws route53 change-resource-record-sets \
  --hosted-zone-id YOUR_ZONE_ID \
  --change-batch file://route53-records.json
```

route53-records.json:
```json
{
  "Changes": [
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "wspr.app",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "YOUR_CLOUDFRONT_DOMAIN",
          "EvaluateTargetHealth": false
        }
      }
    }
  ]
}
```

## IAM Configuration

### CI/CD User
1. Create User
```bash
aws iam create-user --user-name github-actions
```

2. Create Policy
```bash
aws iam create-policy \
  --policy-name WSPRDeploymentPolicy \
  --policy-document file://deployment-policy.json
```

deployment-policy.json:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::wspr-staging/*",
        "arn:aws:s3:::wspr-production/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation"
      ],
      "Resource": "*"
    }
  ]
}
```

3. Attach Policy
```bash
aws iam attach-user-policy \
  --user-name github-actions \
  --policy-arn arn:aws:iam::YOUR_ACCOUNT_ID:policy/WSPRDeploymentPolicy
```

4. Create Access Keys
```bash
aws iam create-access-key --user-name github-actions
```

## GitHub Secrets

Add the following secrets to your GitHub repository:

```bash
AWS_ACCESS_KEY_ID=<access-key-from-previous-step>
AWS_SECRET_ACCESS_KEY=<secret-key-from-previous-step>
AWS_S3_BUCKET_STAGING=wspr-staging
AWS_S3_BUCKET_PROD=wspr-production
AWS_CLOUDFRONT_DISTRIBUTION_ID_STAGING=<staging-distribution-id>
AWS_CLOUDFRONT_DISTRIBUTION_ID_PROD=<production-distribution-id>
```

## Monitoring Setup

### CloudWatch Alarms

1. S3 Error Rate Alarm
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name WSPR-S3-Errors \
  --metric-name 4xxErrors \
  --namespace AWS/S3 \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:us-west-2:YOUR_ACCOUNT_ID:alerts
```

2. CloudFront Latency Alarm
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name WSPR-CF-Latency \
  --metric-name TotalErrorRate \
  --namespace AWS/CloudFront \
  --statistic Average \
  --period 300 \
  --threshold 1 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:us-west-2:YOUR_ACCOUNT_ID:alerts
```

## Security Considerations

1. Enable S3 Bucket Encryption
```bash
aws s3api put-bucket-encryption \
  --bucket wspr-production \
  --server-side-encryption-configuration '{
    "Rules": [
      {
        "ApplyServerSideEncryptionByDefault": {
          "SSEAlgorithm": "AES256"
        }
      }
    ]
  }'
```

2. Enable CloudFront Security Headers
```bash
aws cloudfront update-distribution \
  --id YOUR_DISTRIBUTION_ID \
  --distribution-config file://security-headers.json
```

security-headers.json:
```json
{
  "ResponseHeadersPolicyConfig": {
    "Name": "WSPRSecurityHeaders",
    "SecurityHeadersConfig": {
      "ContentSecurityPolicy": {
        "Override": true,
        "ContentSecurityPolicy": "default-src 'self'"
      },
      "StrictTransportSecurity": {
        "Override": true,
        "AccessControlMaxAgeSec": 31536000
      }
    }
  }
}
```

## Maintenance

### Rotating Access Keys
```bash
# List current keys
aws iam list-access-keys --user-name github-actions

# Create new key
aws iam create-access-key --user-name github-actions

# Delete old key
aws iam delete-access-key \
  --user-name github-actions \
  --access-key-id OLD_KEY_ID
```

### Updating SSL Certificates
```bash
# Request new certificate
aws acm request-certificate \
  --domain-name wspr.app \
  --validation-method DNS \
  --subject-alternative-names *.wspr.app

# Update CloudFront distribution
aws cloudfront update-distribution \
  --id YOUR_DISTRIBUTION_ID \
  --distribution-config file://updated-cert-config.json
```
