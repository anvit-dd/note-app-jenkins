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

    // ============================================================================
    // IMPORTANT: Node.js Setup
    // ============================================================================
    // 
    // METHOD 1 (RECOMMENDED - Most Reliable): Use Jenkins Node.js Plugin
    // 1. Install "NodeJS Plugin": Manage Jenkins → Plugins → Search "NodeJS Plugin"
    // 2. Configure: Manage Jenkins → Global Tool Configuration → NodeJS → Add NodeJS
    //    - Name: NodeJS-20
    //    - Check "Install automatically" → Select Node.js 20.x
    // 3. Uncomment the tools block below:
    //
    // Uncomment the tools block below after installing and configuring NodeJS Plugin:
    // tools {
    //     nodejs 'NodeJS-20'  // Replace 'NodeJS-20' with your Node.js installation name
    // }
    //
    // METHOD 2: Automatic installation (may require sudo/admin permissions)
    // The pipeline will attempt to install Node.js automatically if plugin is not used
    // ============================================================================

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
                        # Check if Node.js is available (from Jenkins plugin or system)
                        if command -v node &> /dev/null; then
                            echo "✅ Node.js found: $(node --version)"
                            echo "✅ npm found: $(npm --version)"
                            NODE_AVAILABLE=true
                        else
                            echo "⚠️  Node.js not found in PATH. Checking common locations..."
                            
                            # Check if nvm is installed and source it
                            if [ -d "$HOME/.nvm" ]; then
                                export NVM_DIR="$HOME/.nvm"
                                [ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
                                if command -v nvm &> /dev/null && command -v node &> /dev/null; then
                                    echo "✅ Node.js found via nvm: $(node --version)"
                                    NODE_AVAILABLE=true
                                fi
                            fi
                            
                            # Check common installation paths
                            for NODE_PATH in /usr/bin/node /usr/local/bin/node "$HOME/.local/bin/node"; do
                                if [ -f "$NODE_PATH" ] && [ -x "$NODE_PATH" ]; then
                                    export PATH="$(dirname $NODE_PATH):$PATH"
                                    if command -v node &> /dev/null; then
                                        echo "✅ Node.js found at $NODE_PATH: $(node --version)"
                                        NODE_AVAILABLE=true
                                        break
                                    fi
                                fi
                            done
                            
                            # Final check
                            if ! command -v node &> /dev/null; then
                                echo ""
                                echo "❌❌❌ Node.js is not installed or not in PATH ❌❌❌"
                                echo ""
                                echo "SOLUTION 1 (Recommended): Use Jenkins Node.js Plugin"
                                echo "  1. Go to: Manage Jenkins → Manage Plugins → Available"
                                echo "  2. Search and install: 'NodeJS Plugin'"
                                echo "  3. Go to: Manage Jenkins → Global Tool Configuration → NodeJS"
                                echo "  4. Click 'Add NodeJS' → Name: NodeJS-20"
                                echo "  5. Check 'Install automatically' → Select Node.js 20.x → Save"
                                echo "  6. In Jenkinsfile, uncomment: tools { nodejs 'NodeJS-20' }"
                                echo ""
                                echo "SOLUTION 2: Install Node.js on Jenkins agent manually:"
                                echo "  For Ubuntu/Debian:"
                                echo "    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
                                echo "    sudo apt-get install -y nodejs"
                                echo ""
                                echo "  For CentOS/RHEL:"
                                echo "    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -"
                                echo "    sudo yum install -y nodejs npm"
                                echo ""
                                echo "  Or download from: https://nodejs.org/"
                                echo ""
                                exit 1
                            fi
                        fi
                        
                        # Final verification
                        if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
                            echo "❌ Node.js or npm is not available"
                            exit 1
                        fi
                        
                        echo "✅ Using Node.js: $(node --version)"
                        echo "✅ Using npm: $(npm --version)"
                        echo ""
                        
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
                                echo "❌ npm install failed. Check error messages above."
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

