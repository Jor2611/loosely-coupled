# Loosely Coupled Service Replicas

### About

This repository demonstrates a sample implementation of loosely coupled replicas of the same service using Express.js. The service is connected to PostgreSQL via Sequelize ORM and uses RabbitMQ as a message broker. It allows for creating, assigning, deleting, and reassigning tasks among replicas.

### Features
- **Task Management:**  Create tasks that act as cron jobs, specifying the duration of the job and its interval.
- **Task Assingnment:** You can specify a replica to assign a task to; otherwise, it will be automatically assigned to a random or least loaded replica.
- **Multiple Assignment:**  Enables the assignment and execution of multiple tasks to a single or multiple replicas. If tasks are unassigned, they will be distributed to replicas in a round-robin fashion.
- **Reassignment:** Tasks can be reassigned when not currently processing.
- **Replica Shutdown:** Upon closing a replica, all tasks assigned to it will be deleted.
- **Cron State Management:** Utilizes Redis for managing the states of cron jobs.

## Setup

### Prerequisites
Before running the app, make sure you have the following:
- Minikube
- Kubectl

### On Local Environment
```bash
# 1.Clone the repository
$ git clone <repository_url>

#  2.Start Minikube Cluster
$ minikube start

# 3.Enable Nginx Ingress 
$ minikube addons enable ingress

# 4.Create Secret for PostgreSQL Password
$ kubectl create secret generic credentials --from-literal=POSTGRES_PASSWORD=[YOUR_PG_PASSWORD]
# Note: This password is added as an environment variable to services and configured for the PostgreSQL instance in the cluster.

# 5.Apply System Elements to Cluster
$ kubectl apply -f infra/
# Note: Ensure that all deployments work correctly. Alternatively, apply declaration files of the infra directory in the order (RabbitMQ, PostgreSQL, Redis, Service, Ingress).

## Optional Configurations

# 6.Configure Local DNS (Example for linux)
$ echo "192.168.49.2 looselycoupled.net" | sudo tee -a /etc/hosts
# Replace IP with your kuberentes cluster ip. You can retrieve it using `minikube ip`.

# 7.RabbitMQ UI Tool Access
$ kubectl port-forward <pod-name> 15672:15672
# Access at `localhost:15672` with username and password as `guest`.
```

### Final Reflections
You can scale the number of replicas up or down using the `app-depl.yaml` file or through the dashboard, accessible via the `minikube dashboard` command. A `Cluster-IP` service is configured in front of the replicas to load balance incoming requests among them. This setup is effective because the replicas are `Loosely Coupled`, allowing different replicas to handle the requests. `PostgreSQL` is configured with a `Persistent Volume Claim` to ensure data persistence, which is not the case for `Redis & RabbitMQ`.
This setup is a demonstration and not intended for production use. It serves as a starting point for loosely coupled service architectures.
