pipeline {
    agent any

    environment {
        DOCKERHUB_CREDS = credentials('dockerhub-creds')
        BACKEND_IMAGE = 'abdullahamjad2129/notes-backend:latest'
        FRONTEND_IMAGE = 'abdullahamjad2129/notes-frontend:latest'
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/AbdullahAmjad-29/notes-app-k8s.git'
            }
        }

        stage('Build Backend Image') {
            steps {
                dir('backend') {
                    sh 'docker build -t $BACKEND_IMAGE .'
                }
            }
        }

        stage('Build Frontend Image') {
            steps {
                dir('frontend') {
                    sh 'docker build -t $FRONTEND_IMAGE .'
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                sh 'echo $DOCKERHUB_CREDS_PSW | docker login -u $DOCKERHUB_CREDS_USR --password-stdin'
                sh 'docker push $BACKEND_IMAGE'
                sh 'docker push $FRONTEND_IMAGE'
            }
        }

        stage('Deploy') {
            steps {
                sh 'ansible-playbook -i /var/lib/jenkins/ansible-deploy/inventory.ini /var/lib/jenkins/ansible-deploy/notes-deploy.yml'
            }
        }
    }
}
