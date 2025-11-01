pipeline {
    agent any

    tools {
        nodejs 'NodeJS-20'
    }

    environment {
        NODE_ENV = 'production'
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
                echo '📦 Installing dependencies...'
                sh 'npm i'
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
                    publishCoverage adapters: [
                        coberturaAdapter('coverage/cobertura-coverage.xml'),
                        lcovAdapter('coverage/lcov.info')
                    ]
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
