pipeline {
    agent any

    tools {
        nodejs 'NodeJS-24'
    }

    environment {
        NODE_ENV = 'production'
        NEXT_SWC_PATH = "${WORKSPACE}/node_modules/@next/swc-wasm-nodejs/wasm.js"
        CSS_TRANSFORMER_WASM = '1'
        DOCKER_REGISTRY = 'docker.io'
        DOCKER_IMAGE_NAME = "${DOCKER_REGISTRY}/${DOCKER_USER}/${JOB_NAME}"
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

        stage('Package') {
    steps {
        echo '🔨 Building Next.js app (without Turbopack for arm64 compatibility)...'
        echo '📦 Building and pushing Docker image...'
        sh '''
            # Ensure required environment variables are set
            if [ -z "$DOCKER_USER" ] || [ -z "$DOCKER_PASS" ]; then
                echo "❌ Missing Docker credentials in environment variables (DOCKER_USER / DOCKER_PASS)"
                exit 1
            fi

            echo "🔑 Logging in to Docker registry..."
            echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin docker.io

            echo "🐳 Building Docker image..."
            docker build -t ${DOCKER_IMAGE_NAME}:${BUILD_NUMBER} .
            docker tag ${DOCKER_IMAGE_NAME}:${BUILD_NUMBER} ${DOCKER_IMAGE_NAME}:latest

            echo "⬆️  Pushing image to Docker registry..."
            docker push ${DOCKER_IMAGE_NAME}:${BUILD_NUMBER}
            docker push ${DOCKER_IMAGE_NAME}:latest

            docker logout docker.io
            echo "✅ Docker image pushed successfully: ${DOCKER_IMAGE_NAME}:${BUILD_NUMBER}"
        '''
    }
}

        stage('Deploy') {
            steps {
                echo '🚀 Deploying to production server...'
                sh '''
                    # SSH into server with username/password and deploy Docker container
                    sshpass -p "${DEPLOY_PASSWORD}" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${DEPLOY_USER}@${DEPLOY_SERVER} << 'EOF'
                        echo "🐳 Pulling latest Docker image..."
                        docker pull ${DOCKER_IMAGE_NAME}:latest
                        
                        echo "🛑 Stopping old container..."
                        docker stop note-app-container || true
                        docker rm note-app-container || true
                        
                        echo "🚀 Starting new container..."
                        docker run -d \
                            --name note-app-container \
                            -p 3000:3000 \
                            --restart unless-stopped \
                            --env-file /etc/note-app/.env.production \
                            ${DOCKER_IMAGE_NAME}:latest
                        
                        echo "✅ Container deployed successfully!"
                        docker ps | grep note-app-container
EOF
                '''
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
