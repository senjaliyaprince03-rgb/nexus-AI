FROM alpine:3.20

LABEL org.opencontainers.image.title="NexusAI root Dockerfile"
LABEL org.opencontainers.image.description="This repository uses the compose files under nexusai/ for development and deployment."

ENTRYPOINT ["sh", "-c", "echo 'Use nexusai/docker-compose.yml or the root compose.yaml for this project.' >&2; exit 1"]
