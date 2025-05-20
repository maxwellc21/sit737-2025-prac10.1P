# Auth-Service: Cloud-Native Deployment

Welcome to the **Auth-Service** repository! This README guides you through building, deploying, and verifying a cloud-native authentication microservice on Google Kubernetes Engine (GKE), complete with logging and metrics.

---

## 🚀 Prerequisites

- **Git**  
- **Docker**  
- **Google Cloud SDK** (`gcloud`, `kubectl`)  
- **GCP Project** with billing enabled  
- **Artifact Registry** repository (`my-docker-repo`) in `australia-southeast2`  
- **GKE Autopilot** cluster (or Standard) named `sit737-cluster`  

---

## 🛠️ Local Build & Push

1. **Clone this repo**  
   ```bash
   git clone https://github.com/maxwellc21/sit737-2025-prac10.1P.git
   cd auth-service
   ```

2. **Build Docker image**  
   ```bash
   docker build -t auth-service:latest .
   ```

3. **Tag & push to Artifact Registry**  
   ```bash
   PROJECT_ID=nth-wording-384907
   IMAGE=auth-service
   REG=australia-southeast2-docker.pkg.dev
   REPO=my-docker-repo

   docker tag auth-service:latest \
     ${REG}/${PROJECT_ID}/${REPO}/${IMAGE}:latest

   docker push ${REG}/${PROJECT_ID}/${REPO}/${IMAGE}:latest
   ```

---

## ☸️ Kubernetes Deployment

1. **Create namespace**  
   ```bash
   kubectl create namespace edugo-auth
   ```

2. **Apply secrets**  
   ```bash
   kubectl -n edugo-auth apply -f k8s/auth-secret.yaml
   kubectl -n edugo-auth apply -f k8s/registry-secret.yaml
   ```

3. **Deploy MongoDB**  
   ```bash
   kubectl -n edugo-auth apply -f k8s/mongo-pvc.yaml
   kubectl -n edugo-auth apply -f k8s/mongo-standalone.yaml
   ```

4. **Deploy Auth-Service**  
   ```bash
   kubectl -n edugo-auth apply -f k8s/auth-deployment.yaml
   kubectl -n edugo-auth apply -f k8s/auth-service.yaml
   kubectl -n edugo-auth rollout status deployment/auth-deployment
   ```

---

## 🧪 Verification & Testing

### Health & Readiness
```bash
kubectl -n edugo-auth port-forward svc/auth-service 5000:4000
curl http://localhost:5000/health    # OK
curl http://localhost:5000/ready     # OK
```

### Metrics (Prometheus)
```bash
curl http://localhost:5000/metrics | head -n 20
```

### Logs (GCP & kubectl)
- **Terminal:**  
  ```bash
  kubectl -n edugo-auth logs -l app=auth --follow
  ```
- **GCP Console:**  
  Navigate to **Logging → Logs Explorer**, filter `namespace="edugo-auth"`.

---

## 📈 Monitoring & Logging

- Integrated **Winston + Stackdriver** for structured logs.
- Exposed **Prometheus** metrics via `/metrics`.
- Enabled GKE **Managed Prometheus** on the cluster.

---

## 📸 Screenshots

_Add console and GCP screenshots here to prove each step._

---

## 📝 Notes & Challenges

During implementation, setting IAM roles for Artifact Registry and Cloud Logging required fine-tuning. Resolving port conflicts for local port‑forward and annotating ServiceAccount for Workload Identity were key tasks.

---

Thank you for following along! Contributions and feedback are welcome.
