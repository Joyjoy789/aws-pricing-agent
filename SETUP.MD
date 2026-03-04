# Project Setup Guide

This guide will walk you through setting up and deploying the project to your AWS environment.

## Table of Contents

- [Project Setup Guide](#project-setup-guide)
  - [Table of Contents](#table-of-contents)
  - [Prerequisites](#prerequisites)
    - [AWS CLI](#aws-cli)
    - [Node.js](#nodejs)
      - [Option 1: Using Volta (Recommended)](#option-1-using-volta-recommended)
      - [Option 2: Alternative Methods](#option-2-alternative-methods)
    - [Python](#python)
    - [Docker](#docker)
    - [IDE](#ide)
    - [AWS Account Settings](#aws-account-settings)
  - [Getting Started](#getting-started)
    - [Project Installation](#project-installation)
    - [Deployment](#deployment)
  - [Accessing the Application](#accessing-the-application)
    - [Finding Your CloudFront URL](#finding-your-cloudfront-url)
    - [Creating Users](#creating-users)
  - [Local Development](#local-development)
    - [Quick Start](#quick-start)
    - [Advanced Commands](#advanced-commands)
    - [Generate GraphQL Code](#generate-graphql-code)
    - [Build Frontend](#build-frontend)
    - [Start Development Server](#start-development-server)

## Prerequisites

### AWS CLI

1. **Install AWS CLI**
   - Download and install from the [AWS CLI installation page](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)

2. **Configure AWS CLI**

   ```bash
   aws configure
   ```

   - Enter your AWS Access Key ID and Secret Access Key
   - Set default region (recommended: `us-west-2`)
   - Set output format to `json`

3. **Session Token (if applicable)**

   ```bash
   aws configure set aws_session_token <SESSION_TOKEN>
   ```

### Node.js

#### Option 1: Using Volta (Recommended)

Install Volta first from <https://docs.volta.sh/guide/understanding>

```bash
# install NodeJS via Volta
volta install node@22.8.0

# Verify installation
node --version  # Should show v22.8.0
```

#### Option 2: Alternative Methods

- Use [nvm](https://github.com/nvm-sh/nvm)
- Install directly from [nodejs.org](https://nodejs.org/en)

### Python

1. **Install Python Version Manager**
   - For Mac/Linux: [pyenv](https://github.com/pyenv/pyenv)
   - For Windows: [pyenv-win](https://github.com/pyenv-win/pyenv-win)

2. **Install Required Python Version**

   ```bash
   pyenv install 3.12.5
   ```

   - This matches the version in the `.python-version` file

3. **Set Python Version**

   ```bash
   # Set locally for this project
   pyenv local 3.12.5
   
   # Or globally (optional)
   pyenv global 3.12.5
   ```

### Docker

1. **Install Docker Desktop**
   - Download from [docker.com](https://www.docker.com/) (for Mac/Windows users)

2. **Optimize Docker Configuration** (recommended)
   - Open Docker Desktop
   - Click the gear icon ⚙️ in top right
   - Select **Docker Engine**
   - Replace configuration with:

   ```json
   {
       "builder": {
           "gc": {
               "defaultKeepStorage": "20GB",
               "enabled": true
           }
       },
       "experimental": false,
       "log-driver": "json-file",
       "log-format": "text",
       "log-level": "info",
       "log-opts": {
           "cache-compress": "true",
           "cache-disabled": "false",
           "cache-max-file": "5",
           "cache-max-size": "20m",
           "env": "os,customer",
           "labels": "somelabel",
           "max-file": "5",
           "max-size": "10m"
       },
       "max-concurrent-downloads": 1
   }
   ```

   - Click **Apply & restart**

### IDE

[Visual Studio Code](https://code.visualstudio.com/) is recommended, but you may use any IDE of your choice.

### AWS Account Settings

- For Gen-AI projects, ensure to enable model access for the account
  - Navigate to the AWS Management Console
  - Search for "Bedrock" and navigate to the service
  - Select "Model access" under "Model settings"
  - Enable "Allow access to all models"

## Getting Started

### Project Installation

1. **Extract Project Files**
   - Unzip the project archive to your desired location

2. **Install Dependencies**

   ```bash
   # From the project root directory
   npm run setup
   ```

### Deployment

1. **Deploy to your AWS account**

   ```bash
   # From the project root directory
   npm run -w backend cdk deploy -- --all   
   ```

   > ☕ First deployment may take 10-15 minutes

## Accessing the Application

### Finding Your CloudFront URL

**Option 1: AWS Console**

1. Log in to the AWS Management Console
2. Search for "CloudFront" and navigate to the service
3. Find the distribution that begins with `<your_app_name>frontend`
4. Copy the **Domain Name** value

**Option 2: AWS CLI**

```bash
aws cloudfront list-distributions
```

### Creating Users

1. **Access Cognito in AWS Console**
   - Search for "Cognito" and navigate to the service
   - Find the UserPool that begins with `authuserPool`
   - Click on the user pool name

2. **Create a New User**
   - Under "User management" select "Users"
   - Click "Create user"
   - Enter your email as the username
   - Enter your email address and check "Mark email address as verified"
   - Set a secure password
   - Click "Create user"

3. **First Login**
   - Use your email and password to log in
   - Follow the prompts to create a new password
   - Complete account recovery setup (optional)

## Local Development

### Quick Start

```bash
# From project root
npm run develop
```

Then access the site at <http://localhost:3000/>

### Advanced Commands

At times you may need tio perform some advanced operations depending on your project such as refreshing Amazon AppSync configurations, generating environment variables and test building the front end app locally before deploying.

### Generate GraphQL Code

```bash
npm run generate -w frontend
```

### Build Frontend

```bash
npm run build -w frontend
```

### Start Development Server

```bash
npm run dev -w frontend
```
