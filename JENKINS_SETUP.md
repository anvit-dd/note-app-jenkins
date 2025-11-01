# Jenkins CI/CD Setup Guide

This guide explains how to set up Jenkins for the note-app project.

## Prerequisites

1. **Jenkins Server** installed and running
2. **Node.js 20+** installed on Jenkins agent/node
3. **npm** installed
4. **Git** installed
5. **GitHub/GitLab/Bitbucket** repository access

## Jenkins Plugins Required

Install the following plugins in Jenkins:

1. **Pipeline Plugin** - For Pipeline as Code support
2. **NodeJS Plugin** - For Node.js version management
3. **Git Plugin** - For Git integration
4. **HTML Publisher Plugin** - For test coverage reports (optional)
5. **Cobertura Plugin** - For code coverage visualization (optional)
6. **Workspace Cleanup Plugin** - For workspace cleanup (optional)

### Installing Plugins

1. Go to **Jenkins Dashboard** → **Manage Jenkins** → **Manage Plugins**
2. Search for each plugin and install
3. Restart Jenkins if required

## Jenkins Configuration

### 1. Configure Node.js

1. Go to **Manage Jenkins** → **Global Tool Configuration**
2. Under **NodeJS**, click **Add NodeJS**
3. Configure:
   - **Name**: `NodeJS-20` (or any name)
   - **Version**: Select Node.js 20.x
   - Check **Install automatically**
4. Click **Save**

### 2. Configure Git (if needed)

1. Under **Git**, configure Git executable path if needed
2. Add Git credentials if using private repositories

## Creating the Jenkins Pipeline Job

### Method 1: Pipeline from SCM (Recommended)

1. In Jenkins Dashboard, click **New Item**
2. Enter job name: `note-app-pipeline`
3. Select **Pipeline** and click **OK**
4. In the job configuration:
   - **Definition**: Select **Pipeline script from SCM**
   - **SCM**: Select **Git**
   - **Repository URL**: Enter your Git repository URL
     ```
     https://github.com/your-username/note-app-jenkins.git
     ```
   - **Credentials**: Add credentials if needed
   - **Branches to build**: 
     - `*/main` for main branch
     - `*/develop` for develop branch
   - **Script Path**: `Jenkinsfile`
   - Click **Save**

### Method 2: Pipeline Script (Direct)

1. Create a new **Pipeline** job
2. In **Pipeline** section, select **Pipeline script**
3. Copy the content from `Jenkinsfile` into the script box
4. Click **Save**

## Pipeline Stages

The Jenkinsfile includes the following stages:

### 1. **Git Code Checkout**
   - Checks out code from the Git repository
   - Cleans workspace

### 2. **Install Dependencies**
   - Installs npm dependencies using `npm ci`

### 3. **Lint Code**
   - Runs ESLint to check code quality

### 4. **Compile & Build**
   - Compiles TypeScript
   - Builds Next.js application
   - Creates build artifacts

### 5. **Unit Testing**
   - Runs Jest unit tests
   - Generates test coverage reports
   - Publishes test results

### 6. **Package**
   - Creates a deployment package (tar.gz)
   - Archives artifacts

### 7. **Deploy to Server** (Main branch only)
   - Deploys application to server
   - **Note**: This stage needs to be configured based on your deployment strategy

## Environment Variables

Create a `.env` file in Jenkins or configure environment variables:

1. Go to job configuration → **Build Environment**
2. Check **Use secret text(s) or file(s)**
3. Add environment variables as needed:
   - `DATABASE_URL` - Database connection string
   - `NEXTAUTH_SECRET` - NextAuth secret key
   - `NEXTAUTH_URL` - Application URL
   - Other required environment variables

### Using Jenkins Credentials

1. Go to **Manage Jenkins** → **Manage Credentials**
2. Add credentials:
   - **Kind**: Secret text or Secret file
   - **Scope**: Global
   - **ID**: `database-url` (or any ID)
3. In Jenkinsfile, reference it:
   ```groovy
   environment {
       DATABASE_URL = credentials('database-url')
   }
   ```

## Running the Pipeline

### Manual Execution

1. Go to the pipeline job
2. Click **Build Now**
3. Monitor the build progress in **Build History**

### Automatic Triggers

Configure automatic builds on:

#### GitHub Webhook (Recommended)

1. In Jenkins job configuration → **Build Triggers**
2. Check **GitHub hook trigger for GITScm polling**

3. In GitHub repository:
   - Go to **Settings** → **Webhooks**
   - Add webhook:
     - **Payload URL**: `http://your-jenkins-url/github-webhook/`
     - **Content type**: `application/json`
     - **Events**: Select **Just the push event**
     - Click **Add webhook**

#### Poll SCM

1. In job configuration → **Build Triggers**
2. Check **Poll SCM**
3. Enter schedule: `H/5 * * * *` (every 5 minutes)

#### Build on Push

1. In job configuration → **Build Triggers**
2. Check **Build when a change is pushed to GitLab** (if using GitLab)

## Viewing Results

### Build Status

- **Blue**: Success
- **Red**: Failed
- **Yellow**: Unstable
- **Gray**: In progress or aborted

### Test Results

1. Click on a build number
2. Navigate to **Test Result** link
3. View test summary and details

### Coverage Reports

1. After build completion
2. Click on build number → **Coverage Report**
3. View line coverage, branch coverage, etc.

### Console Output

1. Click on build number → **Console Output**
2. View detailed build logs

## Troubleshooting

### Common Issues

#### 1. Node.js Not Found
```
Solution: Configure Node.js in Global Tool Configuration
```

#### 2. npm ci Fails
```
Solution: Ensure package-lock.json exists and is committed
```

#### 3. Tests Fail
```
Solution: Check test results in build output
- Review failing tests
- Ensure test environment is properly configured
```

#### 4. Build Fails on TypeScript Errors
```
Solution: Fix TypeScript compilation errors locally first
Run: npm run build
```

#### 5. Deployment Stage Fails
```
Solution: Configure deployment credentials and paths
- Add SSH keys for server access
- Configure deployment script
- Update Jenkinsfile deployment stage
```

### Debugging Tips

1. **Check Console Output**: Detailed logs for each stage
2. **Run Locally**: Reproduce issues locally
3. **Check Environment**: Ensure all environment variables are set
4. **Permissions**: Ensure Jenkins user has required permissions

## Deployment Configuration

The deployment stage in the Jenkinsfile is currently a placeholder. Configure it based on your infrastructure:

### Option 1: Docker Deployment

```groovy
stage('Deploy to Server') {
    steps {
        sh 'docker build -t note-app:${BUILD_NUMBER} .'
        sh 'docker tag note-app:${BUILD_NUMBER} note-app:latest'
        sh 'docker push your-registry/note-app:${BUILD_NUMBER}'
        sh 'ssh user@server "cd /app && docker-compose pull && docker-compose up -d"'
    }
}
```

### Option 2: SSH Deployment

```groovy
stage('Deploy to Server') {
    steps {
        sshagent(['ssh-credentials-id']) {
            sh '''
                scp dist/*.tar.gz user@server:/var/www/
                ssh user@server "cd /var/www && tar -xzf *.tar.gz && pm2 restart note-app"
            '''
        }
    }
}
```

### Option 3: Cloud Platform (AWS/GCP/Azure)

Use platform-specific deployment tools:
- AWS: AWS CLI, CodeDeploy, Elastic Beanstalk
- GCP: gcloud CLI, Cloud Build
- Azure: Azure CLI, Azure DevOps

## Best Practices

1. **Use Pipeline from SCM**: Keep Jenkinsfile in repository
2. **Version Control**: Always commit Jenkinsfile changes
3. **Credentials**: Use Jenkins credentials, never hardcode secrets
4. **Testing**: Run tests before deployment
5. **Rollback**: Plan for rollback strategy
6. **Monitoring**: Set up alerts for build failures
7. **Documentation**: Keep deployment documentation updated

## Additional Resources

- [Jenkins Pipeline Documentation](https://www.jenkins.io/doc/book/pipeline/)
- [Pipeline Syntax Reference](https://www.jenkins.io/doc/book/pipeline/syntax/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Jest Documentation](https://jestjs.io/docs/getting-started)

## Support

For issues or questions:
1. Check Jenkins console output
2. Review test results
3. Consult project documentation
4. Contact DevOps team

