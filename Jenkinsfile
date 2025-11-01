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
        DEPLOY_USER = "${DEPLOY_USER}"
        DEPLOY_HOST = "${DEPLOY_SERVER}"
        DEPLOY_PASSWORD = "${DEPLOY_PASS}"
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

		// stage('Package') {
		// 	steps {
		// 		echo '🔨 Building Next.js app (without Turbopack for arm64 compatibility)...'
		// 		echo '📦 Building and pushing Docker image...'
		// 		sh '''
		// 			# Ensure required environment variables are set
		// 			if [ -z "$DOCKER_USER" ] || [ -z "$DOCKER_PASS" ]; then
		// 				echo "❌ Missing Docker credentials in environment variables (DOCKER_USER / DOCKER_PASS)"
		// 				exit 1
		// 			fi

		// 			echo "🔑 Logging in to Docker registry..."
		// 			echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin docker.io

		// 			echo "🐳 Building Docker image..."
		// 			docker build -t ${DOCKER_IMAGE_NAME}:${BUILD_NUMBER} .
		// 			docker tag ${DOCKER_IMAGE_NAME}:${BUILD_NUMBER} ${DOCKER_IMAGE_NAME}:latest

		// 			echo "⬆️  Pushing image to Docker registry..."
		// 			docker push ${DOCKER_IMAGE_NAME}:${BUILD_NUMBER}
		// 			docker push ${DOCKER_IMAGE_NAME}:latest

		// 			docker logout docker.io
		// 			echo "✅ Docker image pushed successfully: ${DOCKER_IMAGE_NAME}:${BUILD_NUMBER}"
		// 		'''
		// 	}
		// }

		stage('Deploy') {
			steps {
				script {
					if (!env.DEPLOY_HOST?.trim() || !env.DEPLOY_USER?.trim()) {
						echo '⚠️  Skipping deploy because DEPLOY_HOST or DEPLOY_USER is not set.'
						return
					}

					def deployStep = {
						sh '''
							set -eu

							SSH_PORT="${DEPLOY_SSH_PORT:-22}"
							CONTAINER_NAME="${DOCKER_CONTAINER_NAME:-note-app}"
							APP_PORT_VALUE="${APP_PORT:-3000}"
							REMOTE_RUN_COMMAND="${DEPLOY_RUN_COMMAND:-docker run -d --restart unless-stopped --name ${CONTAINER_NAME} -p ${APP_PORT_VALUE}:${APP_PORT_VALUE} ${DOCKER_IMAGE_NAME}:latest}"

							echo "🔐 Connecting to ${DEPLOY_USER}@${DEPLOY_HOST} (port ${SSH_PORT})..."
							if command -v sshpass >/dev/null 2>&1 && [ -n "$DEPLOY_PASSWORD" ]; then
								echo "🔑 Using password authentication with sshpass..."
								ssh -i "$DEPLOY_PASSWORD" -p "${SSH_PORT}" "${DEPLOY_USER}@${DEPLOY_HOST}" <<EOF
set -eu

echo "🛑 Stopping running containers..."
docker ps -q | xargs -r sudo docker stop || true

echo "🧹 Removing container ${CONTAINER_NAME} if it exists..."
sudo docker rm -f ${CONTAINER_NAME} || true

echo "⬇️  Pulling latest image ${DOCKER_IMAGE_NAME}:latest..."
sudo docker pull ${DOCKER_IMAGE_NAME}:latest

echo "🚀 Starting container with latest image..."
${REMOTE_RUN_COMMAND}

sudo docker ps --filter "name=${CONTAINER_NAME}"
EOF
							else
								echo "❌ Neither sshpass nor SSH key credentials are available!"
								echo "   - For password auth: Install sshpass and set DEPLOY_PASSWORD"
								echo "   - For key auth: Set DEPLOY_SSH_CREDENTIALS_ID with SSH private key"
								exit 1
							fi
						'''
					}

					def credentialId = env.DEPLOY_SSH_CREDENTIALS_ID?.trim()
					if (credentialId) {
						sshagent(credentials: [credentialId]) {
							deployStep()
						}
					} else {
						deployStep()
					}
				}
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
