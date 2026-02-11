import { describe, it, expect } from 'vitest';
import {
  lintDockerfile,
  dockerComposeV2ToV3,
  dockerComposeToKubernetes,
  kubernetesToDockerCompose,
  lintKubernetesYaml,
} from '../devops';

// ─── lintDockerfile ──────────────────────────────────────────────────────────

describe('lintDockerfile', () => {
  it('reports no issues for a valid simple Dockerfile', () => {
    const content = 'FROM node:18\nCOPY . .\nRUN npm install';
    const result = JSON.parse(lintDockerfile(content));
    expect(result.valid).toBe(true);
    expect(result.issueCount).toBe(0);
    expect(result.issues).toEqual([]);
  });

  it('errors when Dockerfile has no FROM instruction', () => {
    const content = 'COPY . .\nRUN npm install';
    const result = JSON.parse(lintDockerfile(content));
    expect(result.valid).toBe(false);
    // Each non-comment line triggers "First instruction must be FROM" + final "must contain FROM"
    expect(result.issues.length).toBe(3);
    expect(result.issues.some((i: any) => i.message.includes('must contain at least one FROM'))).toBe(true);
  });

  it('errors on empty Dockerfile', () => {
    const result = JSON.parse(lintDockerfile(''));
    expect(result.valid).toBe(false);
    expect(result.issueCount).toBe(1);
    expect(result.issues[0].message).toContain('must contain at least one FROM');
  });

  it('errors on Dockerfile with only comments', () => {
    const result = JSON.parse(lintDockerfile('# just a comment'));
    expect(result.valid).toBe(false);
    expect(result.issueCount).toBe(1);
  });

  it('warns about using :latest tag', () => {
    const content = 'FROM node:latest\nCOPY . .';
    const result = JSON.parse(lintDockerfile(content));
    expect(result.valid).toBe(true);
    expect(result.issueCount).toBe(1);
    expect(result.issues[0].severity).toBe('warning');
    expect(result.issues[0].message).toContain(':latest');
  });

  it('warns about consecutive RUN instructions', () => {
    const content = 'FROM node:18\nRUN apt-get update\nRUN apt-get install -y curl';
    const result = JSON.parse(lintDockerfile(content));
    expect(result.valid).toBe(true);
    const consecutiveRunIssue = result.issues.find(
      (i: any) => i.message.includes('combining consecutive RUN'),
    );
    expect(consecutiveRunIssue).toBeDefined();
    expect(consecutiveRunIssue.severity).toBe('info');
  });

  it('warns about ADD when not using tar or URL', () => {
    const content = 'FROM node:18\nADD . /app';
    const result = JSON.parse(lintDockerfile(content));
    expect(result.valid).toBe(true);
    const addIssue = result.issues.find((i: any) => i.message.includes('Prefer COPY over ADD'));
    expect(addIssue).toBeDefined();
    expect(addIssue.severity).toBe('warning');
  });

  it('does NOT warn about ADD when using tar file', () => {
    const content = 'FROM node:18\nADD archive.tar.gz /app';
    const result = JSON.parse(lintDockerfile(content));
    expect(result.issues.find((i: any) => i.message.includes('COPY over ADD'))).toBeUndefined();
  });

  it('does NOT warn about ADD when using URL', () => {
    const content = 'FROM node:18\nADD http://example.com/file.txt /app/';
    const result = JSON.parse(lintDockerfile(content));
    expect(result.issues.find((i: any) => i.message.includes('COPY over ADD'))).toBeUndefined();
  });

  it('warns about relative path in WORKDIR', () => {
    const content = 'FROM node:18\nWORKDIR app';
    const result = JSON.parse(lintDockerfile(content));
    const wdIssue = result.issues.find((i: any) => i.message.includes('absolute paths'));
    expect(wdIssue).toBeDefined();
    expect(wdIssue.severity).toBe('warning');
  });

  it('does NOT warn about absolute path in WORKDIR', () => {
    const content = 'FROM node:18\nWORKDIR /app';
    const result = JSON.parse(lintDockerfile(content));
    expect(result.issues.find((i: any) => i.message.includes('absolute paths'))).toBeUndefined();
  });

  it('does NOT warn about WORKDIR with variable path', () => {
    const content = 'FROM node:18\nWORKDIR $APP_DIR';
    const result = JSON.parse(lintDockerfile(content));
    expect(result.issues.find((i: any) => i.message.includes('absolute paths'))).toBeUndefined();
  });

  it('errors on EXPOSE without a port number', () => {
    const content = 'FROM node:18\nEXPOSE';
    const result = JSON.parse(lintDockerfile(content));
    expect(result.valid).toBe(false);
    const exposeIssue = result.issues.find((i: any) => i.message.includes('EXPOSE requires'));
    expect(exposeIssue).toBeDefined();
  });

  it('does NOT error on EXPOSE with a port', () => {
    const content = 'FROM node:18\nEXPOSE 3000';
    const result = JSON.parse(lintDockerfile(content));
    expect(result.issues.find((i: any) => i.message.includes('EXPOSE requires'))).toBeUndefined();
  });

  it('warns on multi-stage build with second FROM without AS', () => {
    const content = 'FROM node:18 AS builder\nCOPY . .\nFROM nginx:1.21\nCOPY --from=builder /dist /usr/share/nginx/html';
    const result = JSON.parse(lintDockerfile(content));
    expect(result.valid).toBe(true);
    const multiStageIssue = result.issues.find(
      (i: any) => i.message.includes('Multiple FROM'),
    );
    expect(multiStageIssue).toBeDefined();
    expect(multiStageIssue.severity).toBe('warning');
  });

  it('allows ARG before FROM without error', () => {
    const content = 'ARG VERSION=18\nFROM node:${VERSION}';
    const result = JSON.parse(lintDockerfile(content));
    expect(result.valid).toBe(true);
    expect(result.issueCount).toBe(0);
  });

  it('skips comment and empty lines', () => {
    const content = '# Base image\n\nFROM node:18\n\n# Copy files\nCOPY . .';
    const result = JSON.parse(lintDockerfile(content));
    expect(result.valid).toBe(true);
    expect(result.issueCount).toBe(0);
  });

  it('returns valid JSON with correct structure', () => {
    const content = 'FROM alpine:3.18';
    const result = JSON.parse(lintDockerfile(content));
    expect(result).toHaveProperty('valid');
    expect(result).toHaveProperty('issueCount');
    expect(result).toHaveProperty('issues');
    expect(Array.isArray(result.issues)).toBe(true);
  });
});

// ─── dockerComposeV2ToV3 ────────────────────────────────────────────────────

describe('dockerComposeV2ToV3', () => {
  it('updates version from 2 to 3.8', () => {
    const input = 'version: "2"\nservices:\n  app:\n    image: nginx';
    const result = dockerComposeV2ToV3(input);
    expect(result).toContain("version: '3.8'");
    expect(result).not.toMatch(/version:\s*['"]?2/);
  });

  it('updates version 2.1 to 3.8', () => {
    const input = "version: '2.1'\nservices:\n  app:\n    image: nginx";
    const result = dockerComposeV2ToV3(input);
    expect(result).toContain("version: '3.8'");
  });

  it('comments out volumes_from as deprecated', () => {
    const input = 'version: "2"\nservices:\n  app:\n    volumes_from:\n      - data';
    const result = dockerComposeV2ToV3(input);
    expect(result).toContain('# volumes_from (deprecated, use named volumes):');
    expect(result).not.toContain('\nvolumes_from:');
  });

  it('migrates net: to network_mode:', () => {
    const input = 'version: "2"\nservices:\n  app:\n    net: host';
    const result = dockerComposeV2ToV3(input);
    expect(result).toContain('network_mode: host');
    expect(result).toContain('# migrated from net:');
  });

  it('preserves content that does not need migration', () => {
    const input = 'version: "2"\nservices:\n  app:\n    image: nginx\n    ports:\n      - "80:80"';
    const result = dockerComposeV2ToV3(input);
    expect(result).toContain('image: nginx');
    expect(result).toContain('- "80:80"');
  });

  it('handles compose without version field gracefully', () => {
    const input = 'services:\n  app:\n    image: nginx';
    const result = dockerComposeV2ToV3(input);
    // No version to replace, content should remain unchanged
    expect(result).toContain('services:');
    expect(result).toContain('image: nginx');
  });
});

// ─── dockerComposeToKubernetes ──────────────────────────────────────────────

describe('dockerComposeToKubernetes', () => {
  it('generates a Kubernetes Deployment YAML', () => {
    const compose = [
      'services:',
      '  web:',
      '    image: nginx:1.19',
      '    ports:',
      '      - "80:80"',
    ].join('\n');
    const result = dockerComposeToKubernetes(compose, 'web');
    expect(result).toContain('apiVersion: apps/v1');
    expect(result).toContain('kind: Deployment');
    expect(result).toContain('name: web');
    expect(result).toContain('image: "nginx:1.19"');
  });

  it('extracts container ports from quoted port mappings', () => {
    const compose = [
      'services:',
      '  api:',
      '    image: myapi:latest',
      '    ports:',
      '      - "3000:3000"',
      '      - "3001:3001"',
    ].join('\n');
    const result = dockerComposeToKubernetes(compose, 'api');
    expect(result).toContain('containerPort: 3000');
    expect(result).toContain('containerPort: 3001');
  });

  it('extracts environment variables', () => {
    const compose = [
      'services:',
      '  app:',
      '    image: myapp:1.0',
      '    environment:',
      '      - NODE_ENV=production',
      '      - DB_HOST=localhost',
    ].join('\n');
    const result = dockerComposeToKubernetes(compose, 'app');
    expect(result).toContain('name: NODE_ENV');
    expect(result).toContain('value: production');
    expect(result).toContain('name: DB_HOST');
    expect(result).toContain('value: localhost');
  });

  it('uses serviceName:latest as default image if none found', () => {
    const compose = [
      'services:',
      '  myservice:',
      '    ports:',
      '      - "80:80"',
    ].join('\n');
    const result = dockerComposeToKubernetes(compose, 'myservice');
    expect(result).toContain('image: "myservice:latest"');
  });

  it('uses serviceName:latest for a service not in compose', () => {
    const compose = 'services:\n  db:\n    image: postgres';
    const result = dockerComposeToKubernetes(compose, 'web');
    expect(result).toContain('image: "web:latest"');
    expect(result).toContain('name: web');
  });

  it('includes labels with the service name', () => {
    const compose = 'services:\n  api:\n    image: myapi:2.0';
    const result = dockerComposeToKubernetes(compose, 'api');
    expect(result).toContain('app: api');
  });

  it('sets replicas to 1', () => {
    const compose = 'services:\n  web:\n    image: nginx:1.19';
    const result = dockerComposeToKubernetes(compose, 'web');
    expect(result).toContain('replicas: 1');
  });

  it('generates valid YAML structure (contains required Deployment keys)', () => {
    const compose = 'services:\n  web:\n    image: nginx:1.19';
    const result = dockerComposeToKubernetes(compose, 'web');
    expect(result).toContain('apiVersion:');
    expect(result).toContain('kind:');
    expect(result).toContain('metadata:');
    expect(result).toContain('spec:');
    expect(result).toContain('selector:');
    expect(result).toContain('template:');
    expect(result).toContain('containers:');
  });
});

// ─── kubernetesToDockerCompose ──────────────────────────────────────────────

describe('kubernetesToDockerCompose', () => {
  it('converts basic K8s deployment to Docker Compose', () => {
    const k8s = [
      'apiVersion: apps/v1',
      'kind: Deployment',
      'metadata:',
      '  name: web',
      'spec:',
      '  template:',
      '    spec:',
      '      containers:',
      '        - name: web',
      '          image: nginx:1.19',
    ].join('\n');
    const result = kubernetesToDockerCompose(k8s);
    expect(result).toContain('version: 3.8');
    expect(result).toContain('image: "nginx:1.19"');
  });

  it('extracts container ports into compose port mappings', () => {
    const k8s = [
      'apiVersion: apps/v1',
      'kind: Deployment',
      'metadata:',
      '  name: api',
      'spec:',
      '  template:',
      '    spec:',
      '      containers:',
      '        - name: api',
      '          image: myapi:1.0',
      '          ports:',
      '            - containerPort: 3000',
    ].join('\n');
    const result = kubernetesToDockerCompose(k8s);
    expect(result).toContain('3000:3000');
  });

  it('extracts the service name from metadata.name', () => {
    const k8s = [
      'apiVersion: apps/v1',
      'kind: Deployment',
      'metadata:',
      '  name: myservice',
      'spec:',
      '  template:',
      '    spec:',
      '      containers:',
      '        - image: myimg:1.0',
    ].join('\n');
    const result = kubernetesToDockerCompose(k8s);
    expect(result).toContain('myservice:');
  });

  it('falls back to "app" if no name is found', () => {
    const k8s = [
      'apiVersion: apps/v1',
      'kind: Deployment',
      'spec:',
      '  template:',
      '    spec:',
      '      containers:',
      '        - image: myimg:2.0',
    ].join('\n');
    const result = kubernetesToDockerCompose(k8s);
    expect(result).toContain('app:');
  });

  it('extracts env var names from K8s env spec', () => {
    const k8s = [
      'apiVersion: apps/v1',
      'kind: Deployment',
      'metadata:',
      '  name: web',
      'spec:',
      '  containers:',
      '    - name: web',
      '      image: nginx',
      '      env:',
      '        - name: NODE_ENV',
      '          value: production',
    ].join('\n');
    const result = kubernetesToDockerCompose(k8s);
    expect(result).toContain('NODE_ENV=');
  });

  it('outputs version 3.8 in the compose', () => {
    const k8s = 'apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: x\nspec:\n  containers:\n    - image: img';
    const result = kubernetesToDockerCompose(k8s);
    expect(result).toContain('version:');
    expect(result).toContain('3.8');
  });

  it('includes services key in output', () => {
    const k8s = 'apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: web\nspec:\n  containers:\n    - image: nginx';
    const result = kubernetesToDockerCompose(k8s);
    expect(result).toContain('services:');
  });
});

// ─── lintKubernetesYaml ─────────────────────────────────────────────────────

describe('lintKubernetesYaml', () => {
  it('reports no errors for a valid manifest with all best practices', () => {
    const k8s = [
      'apiVersion: apps/v1',
      'kind: Deployment',
      'metadata:',
      '  name: test',
      'spec:',
      '  containers:',
      '    - image: nginx:1.19',
      '      resources:',
      '        limits:',
      '          memory: "128Mi"',
      '      livenessProbe:',
      '        httpGet:',
      '          path: /health',
    ].join('\n');
    const result = JSON.parse(lintKubernetesYaml(k8s));
    expect(result.valid).toBe(true);
    expect(result.issueCount).toBe(0);
  });

  it('errors when apiVersion is missing', () => {
    const k8s = 'kind: Deployment\nmetadata:\n  name: x';
    const result = JSON.parse(lintKubernetesYaml(k8s));
    expect(result.issues.some((i: any) => i.message.includes('apiVersion'))).toBe(true);
    expect(result.issues.find((i: any) => i.message.includes('apiVersion'))!.severity).toBe('error');
  });

  it('errors when kind is missing', () => {
    const k8s = 'apiVersion: apps/v1\nmetadata:\n  name: x';
    const result = JSON.parse(lintKubernetesYaml(k8s));
    expect(result.issues.some((i: any) => i.message.includes('kind'))).toBe(true);
  });

  it('errors when metadata is missing', () => {
    const k8s = 'apiVersion: apps/v1\nkind: Deployment';
    const result = JSON.parse(lintKubernetesYaml(k8s));
    expect(result.issues.some((i: any) => i.message.includes('metadata'))).toBe(true);
  });

  it('marks as invalid when any required field is missing', () => {
    const k8s = 'spec:\n  replicas: 1';
    const result = JSON.parse(lintKubernetesYaml(k8s));
    expect(result.valid).toBe(false);
    // Missing apiVersion, kind, metadata → 3 errors + warnings/info
    expect(result.issues.filter((i: any) => i.severity === 'error').length).toBe(3);
  });

  it('warns about :latest tag in images', () => {
    const k8s = 'apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: x\nspec:\n  containers:\n    - image: nginx:latest';
    const result = JSON.parse(lintKubernetesYaml(k8s));
    const latestIssue = result.issues.find((i: any) => i.message.includes(':latest'));
    expect(latestIssue).toBeDefined();
    expect(latestIssue.severity).toBe('warning');
  });

  it('warns when resource limits are missing', () => {
    const k8s = 'apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: x\nspec:\n  containers:\n    - image: nginx:1.19';
    const result = JSON.parse(lintKubernetesYaml(k8s));
    const resourceIssue = result.issues.find((i: any) => i.message.includes('resource limits'));
    expect(resourceIssue).toBeDefined();
    expect(resourceIssue.severity).toBe('warning');
  });

  it('suggests adding health probes when missing', () => {
    const k8s = 'apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: x\nspec:\n  containers:\n    - image: nginx:1.19';
    const result = JSON.parse(lintKubernetesYaml(k8s));
    const probeIssue = result.issues.find((i: any) => i.message.includes('health probes'));
    expect(probeIssue).toBeDefined();
    expect(probeIssue.severity).toBe('info');
  });

  it('does NOT suggest probes when livenessProbe is present', () => {
    const k8s = [
      'apiVersion: apps/v1',
      'kind: Deployment',
      'metadata:',
      '  name: x',
      'spec:',
      '  containers:',
      '    - image: nginx:1.19',
      '      resources:',
      '        limits: {}',
      '      livenessProbe:',
      '        httpGet:',
      '          path: /health',
    ].join('\n');
    const result = JSON.parse(lintKubernetesYaml(k8s));
    expect(result.issues.find((i: any) => i.message.includes('health probes'))).toBeUndefined();
  });

  it('warns about hostNetwork: true', () => {
    const k8s = 'apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: x\nspec:\n  hostNetwork: true';
    const result = JSON.parse(lintKubernetesYaml(k8s));
    const hostIssue = result.issues.find((i: any) => i.message.includes('hostNetwork'));
    expect(hostIssue).toBeDefined();
    expect(hostIssue.severity).toBe('warning');
  });

  it('warns about privileged: true', () => {
    const k8s = 'apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: x\nspec:\n  containers:\n    - privileged: true';
    const result = JSON.parse(lintKubernetesYaml(k8s));
    const privIssue = result.issues.find((i: any) => i.message.includes('Privileged'));
    expect(privIssue).toBeDefined();
    expect(privIssue.severity).toBe('warning');
  });

  it('returns valid JSON with correct structure', () => {
    const k8s = 'apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: x';
    const result = JSON.parse(lintKubernetesYaml(k8s));
    expect(result).toHaveProperty('valid');
    expect(result).toHaveProperty('issueCount');
    expect(result).toHaveProperty('issues');
    expect(Array.isArray(result.issues)).toBe(true);
  });

  it('counts total issues correctly', () => {
    // hostNetwork + privileged + :latest + no resources + no probes = 5 issues
    const k8s = [
      'apiVersion: apps/v1',
      'kind: Deployment',
      'metadata:',
      '  name: x',
      'spec:',
      '  hostNetwork: true',
      '  containers:',
      '    - image: nginx:latest',
      '      privileged: true',
    ].join('\n');
    const result = JSON.parse(lintKubernetesYaml(k8s));
    expect(result.valid).toBe(true);
    expect(result.issueCount).toBe(5);
  });
});
