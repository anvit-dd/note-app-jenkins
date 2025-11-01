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

    // IMPORTANT: Configure Node.js using one of these methods:
    // 
    // METHOD 1 (Recommended): Use Jenkins Node.js Plugin
    // 1. Install "NodeJS Plugin" in Jenkins: Manage Jenkins → Plugins
    // 2. Configure Node.js: Manage Jenkins → Global Tool Configuration → NodeJS
    // 3. Uncomment and configure the tools block below:
    // tools {
    //     nodejs 'NodeJS-20'  // Replace with your Node.js installation name
    // }
    //
    // METHOD 2: Ensure Node.js is installed on Jenkins agent and in PATH
    // The pipeline will attempt to install Node.js automatically if not found

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

        stage('Setup Node.js') {
            steps {
                script {
                    echo '🔧 Setting up Node.js...'
                    sh '''
                        # Check if Node.js is already installed
                        if command -v node &> /dev/null; then
                            echo "✅ Node.js found: $(node --version)"
                            echo "✅ npm found: $(npm --version)"
                        else
                            echo "📥 Installing Node.js via nvm..."
                            
                            # Install nvm if not present
                            if [ ! -d "$HOME/.nvm" ]; then
                                curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash || {
                                    echo "⚠️  nvm installation failed, trying direct Node.js installation..."
                                    
                                    # Alternative: Install Node.js directly
                                    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - || {
                                        echo "❌ Failed to install Node.js setup script"
                                        exit 1
                                    }
                                    
                                    # For Debian/Ubuntu
                                    if command -v apt-get &> /dev/null; then
                                        apt-get install -y nodejs || {
                                            echo "❌ Failed to install Node.js via apt-get"
                                            exit 1
                                        }
                                    # For RHEL/CentOS
                                    elif command -v yum &> /dev/null; then
                                        yum install -y nodejs npm || {
                                            echo "❌ Failed to install Node.js via yum"
                                            exit 1
                                        }
                                    else
                                        echo "❌ Unsupported package manager. Please install Node.js manually."
                                        exit 1
                                    fi
                                }
                            fi
                            
                            # Source nvm and install Node.js
                            if [ -d "$HOME/.nvm" ]; then
                                export NVM_DIR="$HOME/.nvm"
                                [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
                                nvm install 20 || {
                                    echo "❌ Failed to install Node.js 20 via nvm"
                                    exit 1
                                }
                                nvm use 20
                            fi
                            
                            # Verify installation
                            if ! command -v node &> /dev/null; then
                                echo "❌ Node.js installation failed. Please install Node.js manually on the Jenkins agent."
                                exit 1
                            fi
                            
                            echo "✅ Node.js installed: $(node --version)"
                            echo "✅ npm installed: $(npm --version)"
                        fi
                    '''
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                script {
                    echo '📦 Installing Node.js dependencies...'
                    sh '''
                        # Ensure Node.js is available (source nvm if it was installed)
                        if [ -d "$HOME/.nvm" ]; then
                            export NVM_DIR="$HOME/.nvm"
                            [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
                            nvm use 20 2>/dev/null || true
                        fi
                        
                        echo "Using Node.js: $(node --version)"
                        echo "Using npm: $(npm --version)"
                        
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

