# Notes App — Multi-Node Kubernetes Deployment

A three-tier Notes application (frontend, backend, MongoDB) deployed on a self-managed, multi-node Kubernetes cluster built from scratch with **kubeadm** — no managed Kubernetes service, no Minikube.

## Architecture
Browser
│ NodePort :30080
▼
Frontend (2 replicas)
│ NodePort :30500
▼
Backend (2 replicas, Node.js/Express)
│ ClusterIP (mongo-service, internal DNS)
▼
MongoDB (1 replica, PersistentVolumeClaim)

## Cluster

- **Control plane**: `deployment-vm` — created via `kubeadm init`, running the API server, etcd, scheduler, and controller-manager.
- **Worker**: `k8s-worker` — joined via `kubeadm join`, runs all application pods. The control-plane node is tainted (`NoSchedule`) to keep application workloads off it.
- **CNI**: Calico (IP-in-IP mode).
- **Storage**: `local-path-provisioner`, providing PVC-backed storage on the node the pod is scheduled to.

## Components

- **Frontend** — static HTML/CSS/JS, served via Nginx.
- **Backend** — Node.js/Express REST API (`/api/notes`), connects to MongoDB using credentials from a Kubernetes Secret and MongoDB's internal Service DNS name.
- **MongoDB** — official `mongo:7` image, credentials in a Secret, data in a PersistentVolumeClaim.

## Kubernetes objects (`k8s/`)

| File | Purpose |
|---|---|
| `mongo-secret.yaml` | MongoDB root credentials (base64-encoded) |
| `mongo-pvc.yaml` | 1Gi persistent storage for MongoDB |
| `mongo-deployment.yaml` | MongoDB pod, references the Secret and PVC |
| `mongo-service.yaml` | ClusterIP — internal-only, reachable as `mongo-service` |
| `backend-deployment.yaml` | Backend pods (2 replicas) |
| `backend-service.yaml` | NodePort `:30500` — externally reachable |
| `frontend-deployment.yaml` | Frontend pods (2 replicas) |
| `frontend-service.yaml` | NodePort `:30080` — externally reachable |

## Why NodePort instead of ClusterIP for frontend/backend

Browser-side JavaScript cannot resolve Kubernetes' internal DNS names (`mongo-service`, etc.) — those only resolve from inside the cluster. `NodePort` opens a fixed port on the node itself, giving the browser an ordinary IP:port address to reach.

## Real issues hit and fixed

- **MongoDB auth failure** — the root user lives in MongoDB's `admin` database, not the app's own database. Fixed by adding `?authSource=admin` to the connection string.
- **PVC node affinity conflict** — after adding a second node and re-scheduling pods onto it, the original PVC (provisioned via `local-path` on the first node) couldn't be used by a pod scheduled elsewhere. `local-path` storage is tied to the specific node it was created on. Fixed by deleting and recreating the PVC so it provisioned fresh on the correct node.
- **Cross-node networking failure** — after joining a second node, pod-to-pod traffic and cluster DNS (CoreDNS) failed across nodes despite open ports. Root cause: `firewalld` blocking Calico's IP-in-IP encapsulated traffic between nodes, confirmed by testing with `firewalld` stopped. Resolved by disabling `firewalld` between the two (private, trusted) nodes.
- **Backend OOM crash loop** — running a second node's full workload alongside an existing Jenkins install exceeded available memory, causing repeated `exit code 137` (OOM-killed) restarts. Resolved by freeing memory (stopping the unused Jenkins service) and forcing a clean pod restart.

