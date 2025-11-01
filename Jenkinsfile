pipeline {
    agent any

    tools {
        nodejs 'NodeJS-24'
    }

    environment {
        NODE_ENV = 'production'
        NEXT_SWC_PATH = "${WORKSPACE}/node_modules/@next/swc-wasm-nodejs/wasm.js"
    }

    options {
        timeout(time: 20, unit: 'MINUTES')
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {
        stage('Checkout') {
            steps {
                echo '📥 Checking out source code...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo '📦 Installing dependencies (including dev)...'
                sh 'npm i --include=dev'
            }
        }

        stage('Lint') {
            steps {
                echo '🔍 Running ESLint...'
                sh 'npm run lint'
            }
        }

        stage('Test') {
            steps {
                echo '🧪 Running tests...'
                sh 'npm test -- --ci --coverage'
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: '**/junit.xml'
                    script {
                        if (fileExists('coverage/lcov.info')) {
                            archiveArtifacts artifacts: 'coverage/**', allowEmptyArchive: true
                        }
                    }
                }
            }
        }

        stage('Build') {
            steps {
                echo '🔨 Building Next.js app...'
                sh 'npm run build'
            }
        }

        stage('Package') {
            steps {
                echo '📦 Packaging application...'
                sh '''
                    mkdir -p dist
                    tar -czf dist/nextjs-app-${BUILD_NUMBER}.tar.gz \
                        .next public package.json package-lock.json next.config.* tsconfig.* \
                        --exclude=node_modules --exclude=.git
                '''
                archiveArtifacts artifacts: 'dist/*.tar.gz', fingerprint: true
            }
        }
    }

    post {
        success {
            echo "🎉 Build #${BUILD_NUMBER} succeeded!"
        }
        failure {
            echo "💥 Build #${BUILD_NUMBER} failed."
        }
        always {
            cleanWs()
        }
    }
}
