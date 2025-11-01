pipeline {
    agent any

    // Automatic build triggers
    // Note: GitHub webhook is configured in Jenkins job settings (Build Triggers section)
    // After configuring webhook in Jenkins UI, builds will trigger automatically on push
    // 
    // Alternative: Uncomment below to use SCM polling instead of webhook
    // triggers {
    //     pollSCM('H/5 * * * *') // Poll every 5 minutes
    // }

    environment {
        NODE_VERSION = '20'
        NPM_REGISTRY = 'https://registry.npmjs.org/'
    }

    tools {
        // Uncomment and configure if Node.js plugin is installed in Jenkins
        // Replace 'NodeJS-20' with the name of your Node.js installation in Jenkins
        // nodejs 'NodeJS-20'
    }

    stages {
        stage('Git Code Checkout') {
            steps {
                script {
                    echo '📥 Checking out code from Git repository...'
                    checkout([
                        $class: 'GitSCM',
                        branches: [[name: '*/main']],
                        doGenerateSubmoduleConfigurations: false,
                        extensions: [],
                        submoduleCfg: [],
                        userRemoteConfigs: scm.userRemoteConfigs
                    ])
                    sh 'git clean -fd'
                    sh 'git reset --hard'
                }
            }
            post {
                success {
                    echo '✅ Code checkout successful'
                    sh 'git log -1 --oneline'
                }
                failure {
                    echo '❌ Code checkout failed'
                    error('Failed to checkout code')
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                script {
                    echo '📦 Installing Node.js dependencies...'
                    sh '''
                        echo "Checking Node.js and npm versions..."
                        node --version || { echo "ERROR: Node.js not found!"; exit 1; }
                        npm --version || { echo "ERROR: npm not found!"; exit 1; }
                        
                        echo "Checking for package-lock.json..."
                        if [ ! -f package-lock.json ]; then
                            echo "⚠️  package-lock.json not found, generating it..."
                            npm install --package-lock-only
                        fi
                        
                        echo "Installing dependencies with npm ci..."
                        npm ci --prefer-offline --no-audit || {
                            echo "⚠️  npm ci failed, trying npm install as fallback..."
                            npm install --no-audit
                        }
                    '''
                }
            }
            post {
                success {
                    echo '✅ Dependencies installed successfully'
                }
                failure {
                    echo '❌ Failed to install dependencies'
                    echo 'Please check the console output above for detailed error messages'
                    echo 'Common issues:'
                    echo '  - Node.js/npm not installed or not in PATH'
                    echo '  - Missing package-lock.json file'
                    echo '  - Network connectivity issues'
                    echo '  - Disk space issues'
                    error('Dependency installation failed')
                }
            }
        }

        stage('Build') {
            steps {
                script {
                    echo '🔨 Building Next.js application...'
                    sh 'npm run build'
                }
            }
            post {
                success {
                    echo '✅ Build successful'
                }
                failure {
                    echo '❌ Build failed'
                    error('Build process failed')
                }
            }
        }

        stage('Lint Code') {
            steps {
                script {
                    echo '🔍 Running ESLint...'
                    sh 'npm run lint'
                }
            }
            post {
                success {
                    echo '✅ Lint passed'
                }
                failure {
                    echo '❌ Lint failed'
                    error('Lint check failed')
                }
            }
        }

        stage('Test') {
            steps {
                script {
                    echo '🧪 Running unit tests...'
                    sh 'npm test -- --coverage --watchAll=false --ci'
                }
            }
            post {
                always {
                    echo '📊 Publishing test results...'
                    // Publish test results
                    publishTestResults(
                        testResultsPattern: 'test-results.xml',
                        allowEmptyResults: true
                    )
                    // Publish coverage reports
                    publishCoverageReports(
                        adapters: [
                            coberturaAdapter('coverage/cobertura-coverage.xml'),
                            lcovAdapter('coverage/lcov.info')
                        ],
                        sourceFileResolver: sourceFiles('STORE_ALL_BUILD')
                    )
                }
                success {
                    echo '✅ All tests passed'
                }
                failure {
                    echo '❌ Tests failed'
                    error('Unit tests failed')
                }
            }
        }

        stage('Production Build') {
            when {
                expression { 
                    return currentBuild.result == null || currentBuild.result == 'SUCCESS'
                }
            }
            steps {
                script {
                    echo '🔨 Creating production build...'
                    sh 'npm run build'
                    archiveArtifacts artifacts: '.next/**', fingerprint: true
                }
            }
            post {
                success {
                    echo '✅ Production build successful'
                }
                failure {
                    echo '❌ Production build failed'
                    error('Production build failed')
                }
            }
        }

        stage('Package') {
            when {
                expression { 
                    return currentBuild.result == null || currentBuild.result == 'SUCCESS'
                }
            }
            steps {
                script {
                    echo '📦 Packaging application...'
                    sh '''
                        mkdir -p dist
                        tar -czf dist/note-app-${BUILD_NUMBER}.tar.gz \
                            .next \
                            public \
                            src \
                            package.json \
                            package-lock.json \
                            next.config.ts \
                            tsconfig.json \
                            prisma \
                            --exclude=node_modules \
                            --exclude=.git
                    '''
                }
            }
            post {
                success {
                    echo '✅ Package created successfully'
                    archiveArtifacts artifacts: 'dist/**', fingerprint: true
                }
            }
        }
    }

    post {
        always {
            script {
                echo '📋 Build Summary:'
                echo "Build Number: ${BUILD_NUMBER}"
                echo "Build Status: ${currentBuild.currentResult}"
                echo "Branch: ${env.BRANCH_NAME}"
                echo "Commit: ${env.GIT_COMMIT}"
            }
            // Clean up workspace
            cleanWs()
        }
        success {
            echo '🎉 Pipeline executed successfully!'
            // You can add notifications here (Slack, Email, etc.)
            // slackSend(channel: '#devops', color: 'good', message: "Build ${BUILD_NUMBER} succeeded")
        }
        failure {
            echo '💥 Pipeline failed!'
            // You can add notifications here
            // slackSend(channel: '#devops', color: 'danger', message: "Build ${BUILD_NUMBER} failed")
        }
        unstable {
            echo '⚠️ Pipeline is unstable'
        }
    }

    options {
        // Build timeout
        timeout(time: 30, unit: 'MINUTES')
        // Retry build if failed
        retry(2)
        // Disable concurrent builds for the same branch
        disableConcurrentBuilds()
        // Keep build logs
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }
}

