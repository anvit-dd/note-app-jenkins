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

        stage('Setup Node.js and Install Dependencies') {
            steps {
                script {
                    echo '🔧 Setting up Node.js and installing dependencies...'
                    sh '''
                        # Function to setup Node.js
                        setup_nodejs() {
                            # Check if Node.js is already installed
                            if command -v node &> /dev/null; then
                                echo "✅ Node.js found: $(node --version)"
                                echo "✅ npm found: $(npm --version)"
                                return 0
                            fi
                            
                            echo "📥 Node.js not found. Attempting installation..."
                            
                            # Try to use nvm if it exists
                            if [ -d "$HOME/.nvm" ]; then
                                export NVM_DIR="$HOME/.nvm"
                                [ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
                                if command -v nvm &> /dev/null; then
                                    echo "Using existing nvm..."
                                    nvm install 20 || nvm install --lts || {
                                        echo "⚠️  nvm install failed"
                                        return 1
                                    }
                                    nvm use 20 || nvm use --lts || {
                                        echo "⚠️  nvm use failed"
                                        return 1
                                    }
                                    return 0
                                fi
                            fi
                            
                            # Try to install nvm
                            echo "Installing nvm..."
                            curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash || {
                                echo "⚠️  nvm installation failed, trying direct Node.js installation..."
                                
                                # Try direct installation for Debian/Ubuntu
                                if command -v apt-get &> /dev/null; then
                                    echo "Attempting to install Node.js via apt-get..."
                                    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - || {
                                        echo "❌ Failed to setup Node.js repository"
                                        return 1
                                    }
                                    apt-get install -y nodejs || {
                                        echo "❌ Failed to install Node.js via apt-get"
                                        return 1
                                    }
                                    return 0
                                # Try direct installation for RHEL/CentOS
                                elif command -v yum &> /dev/null; then
                                    echo "Attempting to install Node.js via yum..."
                                    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash - || {
                                        echo "❌ Failed to setup Node.js repository"
                                        return 1
                                    }
                                    yum install -y nodejs npm || {
                                        echo "❌ Failed to install Node.js via yum"
                                        return 1
                                    }
                                    return 0
                                else
                                    echo "❌ Unsupported system. Please install Node.js manually on the Jenkins agent."
                                    echo "Or install NodeJS Plugin in Jenkins and configure it."
                                    return 1
                                fi
                            }
                            
                            # Source nvm after installation
                            export NVM_DIR="$HOME/.nvm"
                            [ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
                            
                            # Install Node.js via nvm
                            nvm install 20 || nvm install --lts || {
                                echo "❌ Failed to install Node.js via nvm"
                                return 1
                            }
                            nvm use 20 || nvm use --lts || {
                                echo "❌ Failed to use Node.js via nvm"
                                return 1
                            }
                            
                            return 0
                        }
                        
                        # Setup Node.js
                        if ! setup_nodejs; then
                            echo "❌ Node.js setup failed. Please install Node.js manually or use Jenkins Node.js Plugin."
                            exit 1
                        fi
                        
                        # Ensure Node.js is in PATH (for nvm installations)
                        if [ -d "$HOME/.nvm" ]; then
                            export NVM_DIR="$HOME/.nvm"
                            [ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
                            nvm use 20 2>/dev/null || nvm use --lts 2>/dev/null || true
                        fi
                        
                        # Verify Node.js is available
                        if ! command -v node &> /dev/null; then
                            echo "❌ Node.js is still not available after setup. Check installation."
                            exit 1
                        fi
                        
                        echo "✅ Using Node.js: $(node --version)"
                        echo "✅ Using npm: $(npm --version)"
                        
                        # Install dependencies
                        echo "📦 Checking for package-lock.json..."
                        if [ ! -f package-lock.json ]; then
                            echo "⚠️  package-lock.json not found, generating it..."
                            npm install --package-lock-only || {
                                echo "⚠️  Failed to generate package-lock.json, continuing with npm install..."
                            }
                        fi
                        
                        echo "Installing dependencies with npm ci..."
                        npm ci --prefer-offline --no-audit || {
                            echo "⚠️  npm ci failed, trying npm install as fallback..."
                            npm install --no-audit || {
                                echo "❌ npm install also failed"
                                exit 1
                            }
                        }
                        
                        echo "✅ Dependencies installed successfully"
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

