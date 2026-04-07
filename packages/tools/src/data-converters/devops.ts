/**
 * DevOps Tool Converters - Dockerfile, Kubernetes, Docker Compose
 */

/**
 * Basic Dockerfile linting
 */
export function lintDockerfile(content: string): string {
  const lines = content.split('\n');
  const issues: { line: number; severity: string; message: string }[] = [];
  
  let hasFrom = false;
  let lastInstruction = '';
  let runCount = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const lineNum = i + 1;
    const trimmed = line.trim();
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    const instruction = trimmed.split(/\s+/)[0]?.toUpperCase();
    
    // Check for FROM instruction
    if (instruction === 'FROM') {
      if (hasFrom && !trimmed.toLowerCase().includes(' as ')) {
        issues.push({
          line: lineNum,
          severity: 'warning',
          message: 'Multiple FROM instructions detected (multi-stage build)'
        });
      }
      hasFrom = true;
      
      // Check for latest tag
      if (trimmed.includes(':latest')) {
        issues.push({
          line: lineNum,
          severity: 'warning',
          message: 'Avoid using :latest tag, specify explicit version'
        });
      }
    }
    
    // Check first instruction is FROM
    if (!hasFrom && instruction !== 'ARG') {
      issues.push({
        line: lineNum,
        severity: 'error',
        message: 'First instruction must be FROM (or ARG before FROM)'
      });
    }
    
    // Check for multiple RUN commands that could be combined
    if (instruction === 'RUN') {
      runCount++;
      if (lastInstruction === 'RUN') {
        issues.push({
          line: lineNum,
          severity: 'info',
          message: 'Consider combining consecutive RUN instructions'
        });
      }
    }
    
    // Check for ADD vs COPY
    if (instruction === 'ADD' && !trimmed.includes('.tar') && !trimmed.includes('http')) {
      issues.push({
        line: lineNum,
        severity: 'warning',
        message: 'Prefer COPY over ADD unless you need tar extraction or URL fetching'
      });
    }
    
    // Check for WORKDIR with relative path
    if (instruction === 'WORKDIR') {
      const path = trimmed.substring(7).trim();
      if (!path.startsWith('/') && !path.startsWith('$')) {
        issues.push({
          line: lineNum,
          severity: 'warning',
          message: 'Use absolute paths in WORKDIR'
        });
      }
    }
    
    // Check for EXPOSE without port
    if (instruction === 'EXPOSE' && trimmed === 'EXPOSE') {
      issues.push({
        line: lineNum,
        severity: 'error',
        message: 'EXPOSE requires a port number'
      });
    }
    
    lastInstruction = instruction || '';
  }
  
  if (!hasFrom) {
    issues.push({
      line: 1,
      severity: 'error',
      message: 'Dockerfile must contain at least one FROM instruction'
    });
  }
  
  return JSON.stringify({
    valid: issues.filter(i => i.severity === 'error').length === 0,
    issueCount: issues.length,
    issues
  }, null, 2);
}

/**
 * Convert Docker Compose v2 to v3 (basic migration)
 */
export function dockerComposeV2ToV3(compose: string): string {
  // This is a simplified conversion
  let result = compose;
  
  // Update version
  result = result.replace(/version:\s*['"]?2(\.\d)?['"]?/gi, "version: '3.8'");
  
  // Remove links (deprecated in v3)
  result = result.replace(/^\s*-?\s*links:\s*\n(\s+-\s+.+\n)*/gm, '');
  
  // Convert volumes_from to volumes with named volumes
  result = result.replace(/volumes_from:/g, '# volumes_from (deprecated, use named volumes):');
  
  // Add network_mode note for container linking
  if (result.includes('net:')) {
    result = result.replace(/net:\s*(.+)/g, 'network_mode: $1 # migrated from net:');
  }
  
  return result;
}

/**
 * Generate Kubernetes deployment from Docker Compose service.
 *
 * Uses indentation-aware YAML parsing to correctly extract service
 * definitions including image, ports, environment, volumes, command,
 * and restart policy.
 */
export function dockerComposeToKubernetes(compose: string, serviceName: string): string {
  try {
    const service = extractComposeService(compose, serviceName);

    const container: Record<string, unknown> = {
      name: serviceName,
      image: service.image || `${serviceName}:latest`,
    };

    if (service.ports.length > 0) {
      container.ports = service.ports.map(p => ({ containerPort: p.container }));
    }
    if (service.env.length > 0) {
      container.env = service.env.map(e => ({ name: e.name, value: e.value }));
    }
    if (service.command) {
      container.command = service.command;
    }
    if (service.volumes.length > 0) {
      container.volumeMounts = service.volumes.map((v, i) => ({
        name: `vol-${i}`,
        mountPath: v.container,
      }));
    }

    const podSpec: Record<string, unknown> = {
      containers: [container],
    };
    if (service.restartPolicy) {
      podSpec.restartPolicy = service.restartPolicy;
    }
    if (service.volumes.length > 0) {
      podSpec.volumes = service.volumes.map((v, i) => {
        if (v.host.startsWith('.') || v.host.startsWith('/')) {
          return { name: `vol-${i}`, hostPath: { path: v.host } };
        }
        return { name: `vol-${i}`, emptyDir: {} };
      });
    }

    const deployment = {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        name: serviceName,
        labels: { app: serviceName },
      },
      spec: {
        replicas: 1,
        selector: { matchLabels: { app: serviceName } },
        template: {
          metadata: { labels: { app: serviceName } },
          spec: podSpec,
        },
      },
    };

    let output = toYamlString(deployment);

    // If there are ports, also generate a Service manifest
    if (service.ports.length > 0) {
      const svc = {
        apiVersion: 'v1',
        kind: 'Service',
        metadata: {
          name: serviceName,
          labels: { app: serviceName },
        },
        spec: {
          selector: { app: serviceName },
          ports: service.ports.map(p => ({
            port: p.host,
            targetPort: p.container,
            protocol: 'TCP',
          })),
          type: 'ClusterIP',
        },
      };
      output += '\n---\n' + toYamlString(svc);
    }

    return output;
  } catch (e) {
    return `# Error converting: ${(e as Error).message}`;
  }
}

/**
 * Generate Docker Compose from Kubernetes deployment.
 *
 * Extracts containers, ports, env vars, and volume mounts from a
 * Kubernetes Deployment manifest and builds a Docker Compose v3.8 file.
 */
export function kubernetesToDockerCompose(k8sYaml: string): string {
  try {
    const k8s = extractK8sDeployment(k8sYaml);

    const services: Record<string, unknown> = {};

    for (const container of k8s.containers) {
      const svc: Record<string, unknown> = {};
      if (container.image) svc.image = container.image;
      if (container.ports.length > 0) {
        svc.ports = container.ports.map(p => `${p}:${p}`);
      }
      if (container.env.length > 0) {
        svc.environment = container.env.map(e => `${e.name}=${e.value}`);
      }
      if (container.command) {
        svc.command = container.command;
      }
      if (container.volumeMounts.length > 0) {
        svc.volumes = container.volumeMounts.map(vm => `.${vm.mountPath}:${vm.mountPath}`);
      }
      if (k8s.restartPolicy) {
        const policyMap: Record<string, string> = {
          Always: 'always',
          OnFailure: 'on-failure',
          Never: 'no',
        };
        svc.restart = policyMap[k8s.restartPolicy] || 'always';
      }
      services[container.name || k8s.name || 'app'] = svc;
    }

    // Fallback: if no containers found, create a stub entry
    if (k8s.containers.length === 0) {
      services[k8s.name || 'app'] = {
        image: k8s.name ? `${k8s.name}:latest` : 'app:latest',
      };
    }

    const compose = {
      version: '3.8',
      services,
    };

    return toYamlString(compose);
  } catch (e) {
    return `# Error converting: ${(e as Error).message}`;
  }
}

// ---------------------------------------------------------------------------
// Internal — Docker Compose YAML parser (indentation-aware)
// ---------------------------------------------------------------------------

interface ComposeService {
  image: string;
  ports: { host: number; container: number }[];
  env: { name: string; value: string }[];
  volumes: { host: string; container: string }[];
  command: string[] | null;
  restartPolicy: string | null;
  dependsOn: string[];
}

function extractComposeService(yaml: string, serviceName: string): ComposeService {
  const lines = yaml.split('\n');
  const result: ComposeService = {
    image: '',
    ports: [],
    env: [],
    volumes: [],
    command: null,
    restartPolicy: null,
    dependsOn: [],
  };

  // Find the service block. We look for `services:` first, then `<serviceName>:` indented under it.
  let servicesIndent = -1;
  let serviceIndent = -1;
  let inService = false;
  let currentKey = '';
  let keyIndent = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const trimmed = line.trimStart();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const indent = line.length - trimmed.length;

    // Find `services:` at the top level
    if (trimmed === 'services:' || trimmed.startsWith('services:')) {
      servicesIndent = indent;
      continue;
    }

    // Find our target service under services
    if (servicesIndent >= 0 && !inService) {
      if (indent > servicesIndent && trimmed.startsWith(`${serviceName}:`)) {
        inService = true;
        serviceIndent = indent;
        continue;
      }
    }

    if (!inService) continue;

    // If we've de-indented back to the service indent or less, we've left the service block
    if (indent <= serviceIndent) {
      break;
    }

    // Key: value lines (at service-child indent)
    const kvMatch = trimmed.match(/^([a-z_-]+):\s*(.*)$/i);
    if (kvMatch && indent === serviceIndent + 2) {
      // This is a direct key under the service (like image:, ports:, etc.)
      currentKey = kvMatch[1]!.toLowerCase();
      keyIndent = indent;
      const val = kvMatch[2]!.trim();

      if (currentKey === 'image' && val) {
        result.image = val.replace(/^['"]|['"]$/g, '');
      } else if (currentKey === 'restart' && val) {
        const rMap: Record<string, string> = {
          always: 'Always',
          'on-failure': 'OnFailure',
          no: 'Never',
          'unless-stopped': 'Always',
        };
        result.restartPolicy = rMap[val] || 'Always';
      } else if (currentKey === 'command' && val) {
        // command: ["npm", "start"] or command: npm start
        if (val.startsWith('[')) {
          try {
            result.command = JSON.parse(val);
          } catch {
            result.command = val.replace(/[\[\]"']/g, '').split(',').map(s => s.trim());
          }
        } else {
          result.command = val.split(/\s+/);
        }
      }
      continue;
    }

    // List items under a known key
    const listMatch = trimmed.match(/^-\s+(.+)$/);
    if (listMatch && indent > keyIndent) {
      const val = listMatch[1]!.trim().replace(/^['"]|['"]$/g, '');

      if (currentKey === 'ports') {
        const portMatch = val.match(/^(\d+):(\d+)$/);
        if (portMatch) {
          result.ports.push({
            host: parseInt(portMatch[1]!, 10),
            container: parseInt(portMatch[2]!, 10),
          });
        }
      } else if (currentKey === 'environment') {
        const envMatch = val.match(/^([^=]+)=(.*)$/);
        if (envMatch) {
          result.env.push({ name: envMatch[1]!, value: envMatch[2]! });
        }
      } else if (currentKey === 'volumes') {
        const volMatch = val.match(/^([^:]+):(.+)$/);
        if (volMatch) {
          result.volumes.push({ host: volMatch[1]!, container: volMatch[2]! });
        }
      } else if (currentKey === 'depends_on') {
        result.dependsOn.push(val);
      }
      continue;
    }

    // Environment as key: value map (instead of list)
    if (currentKey === 'environment' && indent > keyIndent) {
      const mapMatch = trimmed.match(/^([A-Z_a-z0-9]+):\s*(.*)$/);
      if (mapMatch) {
        result.env.push({ name: mapMatch[1]!, value: mapMatch[2]!.replace(/^['"]|['"]$/g, '') });
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Internal — Kubernetes Deployment YAML parser (indentation-aware)
// ---------------------------------------------------------------------------

interface K8sContainer {
  name: string;
  image: string;
  ports: number[];
  env: { name: string; value: string }[];
  command: string[] | null;
  volumeMounts: { name: string; mountPath: string }[];
}

interface K8sDeployment {
  name: string;
  containers: K8sContainer[];
  restartPolicy: string | null;
}

function extractK8sDeployment(yaml: string): K8sDeployment {
  const lines = yaml.split('\n');
  const result: K8sDeployment = {
    name: '',
    containers: [],
    restartPolicy: null,
  };

  // Extract metadata.name
  let inMetadata = false;
  let metadataIndent = -1;
  for (const line of lines) {
    const trimmed = line.trimStart();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const indent = line.length - trimmed.length;

    if (trimmed === 'metadata:' || trimmed.startsWith('metadata:')) {
      inMetadata = true;
      metadataIndent = indent;
      continue;
    }
    if (inMetadata) {
      if (indent <= metadataIndent) {
        inMetadata = false;
        continue;
      }
      const nameMatch = trimmed.match(/^name:\s*(.+)$/);
      if (nameMatch && indent === metadataIndent + 2) {
        if (!result.name) result.name = nameMatch[1]!.trim().replace(/^['"]|['"]$/g, '');
      }
    }
  }

  // Extract restartPolicy
  for (const line of lines) {
    const match = line.match(/restartPolicy:\s*(.+)/);
    if (match) {
      result.restartPolicy = match[1]!.trim();
    }
  }

  // Extract containers — find lines with `- name:` or `- image:` under `containers:`
  let inContainers = false;
  let containersIndent = -1;
  let containerItemIndent = -1;  // indent of `- name:` items (first `-` under containers)
  let currentContainer: K8sContainer | null = null;
  let currentContainerKey = '';
  let envName = '';

  for (const line of lines) {
    const trimmed = line.trimStart();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const indent = line.length - trimmed.length;

    if (trimmed === 'containers:' || trimmed.startsWith('containers:')) {
      inContainers = true;
      containersIndent = indent;
      containerItemIndent = -1;
      continue;
    }

    if (!inContainers) continue;

    // Exited containers block
    if (indent <= containersIndent && !trimmed.startsWith('-')) {
      if (currentContainer) {
        result.containers.push(currentContainer);
        currentContainer = null;
      }
      inContainers = false;
      continue;
    }

    // New container (list item at the direct child indent of containers:)
    if (trimmed.startsWith('- ') && (containerItemIndent === -1 || indent === containerItemIndent)) {
      if (currentContainer) {
        result.containers.push(currentContainer);
      }
      containerItemIndent = indent;
      currentContainer = { name: '', image: '', ports: [], env: [], command: null, volumeMounts: [] };
      currentContainerKey = '';

      // Parse inline key: `- name: xxx` or `- image: xxx`
      const inline = trimmed.substring(2).trim();
      const inlineKV = inline.match(/^([a-zA-Z]+):\s*(.+)$/);
      if (inlineKV) {
        const k = inlineKV[1]!.toLowerCase();
        const v = inlineKV[2]!.trim().replace(/^['"]|['"]$/g, '');
        if (k === 'name') currentContainer.name = v;
        else if (k === 'image') currentContainer.image = v;
      }
      continue;
    }

    if (!currentContainer) continue;

    // Sub-list items (ports, env entries) — `- ` at deeper indent than container items
    if (trimmed.startsWith('- ') && indent > containerItemIndent && currentContainerKey) {
      const inner = trimmed.substring(2).trim();
      const innerKV = inner.match(/^([a-zA-Z]+):\s*(.+)$/);
      if (innerKV) {
        const k = innerKV[1]!.toLowerCase();
        const v = innerKV[2]!.trim().replace(/^['"]|['"]$/g, '');
        if (currentContainerKey === 'env' && k === 'name') {
          envName = v;
        } else if (k === 'containerport') {
          currentContainer.ports.push(parseInt(v, 10));
        } else if (k === 'name' && currentContainerKey === 'volumeMounts') {
          currentContainer.volumeMounts.push({ name: v, mountPath: '' });
        }
      }
      continue;
    }

    // Keys under a container item
    const kvMatch = trimmed.match(/^([a-zA-Z]+):\s*(.*)$/);
    if (kvMatch) {
      const key = kvMatch[1]!.toLowerCase();
      const val = kvMatch[2]!.trim().replace(/^['"]|['"]$/g, '');

      if (key === 'name' && !val.match(/^\d+$/)) {
        // Could be container name or env var name — differentiate by context
        if (currentContainerKey === 'env') {
          envName = val;
        } else {
          if (!currentContainer.name) currentContainer.name = val;
          currentContainerKey = '';
        }
      } else if (key === 'image') {
        currentContainer.image = val;
        currentContainerKey = '';
      } else if (key === 'value' && currentContainerKey === 'env') {
        currentContainer.env.push({ name: envName, value: val });
        envName = '';
      } else if (key === 'containerport') {
        currentContainer.ports.push(parseInt(val, 10));
      } else if (key === 'mountpath') {
        if (currentContainer.volumeMounts.length > 0) {
          const last = currentContainer.volumeMounts[currentContainer.volumeMounts.length - 1]!;
          if (!last.mountPath) last.mountPath = val;
        }
      } else if (key === 'ports' || key === 'env' || key === 'volumemounts') {
        currentContainerKey = key === 'volumemounts' ? 'volumeMounts' : key;
      } else if (key === 'command') {
        if (val.startsWith('[')) {
          try {
            currentContainer.command = JSON.parse(val);
          } catch {
            currentContainer.command = val.replace(/[\[\]"']/g, '').split(',').map(s => s.trim());
          }
        } else if (val) {
          currentContainer.command = val.split(/\s+/);
        }
      }
      continue;
    }
  }

  // Push the last container
  if (currentContainer) {
    result.containers.push(currentContainer);
  }

  return result;
}

/**
 * Lint Kubernetes YAML
 */
export function lintKubernetesYaml(k8sYaml: string): string {
  const issues: { severity: string; message: string }[] = [];
  
  // Check for required fields
  if (!k8sYaml.includes('apiVersion:')) {
    issues.push({ severity: 'error', message: 'Missing apiVersion field' });
  }
  if (!k8sYaml.includes('kind:')) {
    issues.push({ severity: 'error', message: 'Missing kind field' });
  }
  if (!k8sYaml.includes('metadata:')) {
    issues.push({ severity: 'error', message: 'Missing metadata field' });
  }
  
  // Check for best practices
  if (k8sYaml.includes('image:') && k8sYaml.includes(':latest')) {
    issues.push({ severity: 'warning', message: 'Avoid using :latest tag in production' });
  }
  
  if (!k8sYaml.includes('resources:')) {
    issues.push({ severity: 'warning', message: 'Consider adding resource limits' });
  }
  
  if (!k8sYaml.includes('livenessProbe:') && !k8sYaml.includes('readinessProbe:')) {
    issues.push({ severity: 'info', message: 'Consider adding health probes' });
  }
  
  if (k8sYaml.includes('hostNetwork: true')) {
    issues.push({ severity: 'warning', message: 'hostNetwork: true can be a security risk' });
  }
  
  if (k8sYaml.includes('privileged: true')) {
    issues.push({ severity: 'warning', message: 'Privileged containers are a security risk' });
  }
  
  return JSON.stringify({
    valid: issues.filter(i => i.severity === 'error').length === 0,
    issueCount: issues.length,
    issues
  }, null, 2);
}

// Helper: Simple YAML stringification (for objects)
function toYamlString(obj: unknown, indent = 0): string {
  const spaces = '  '.repeat(indent);
  
  if (obj === null || obj === undefined) {
    return 'null';
  }
  
  if (typeof obj === 'string') {
    if (obj.includes('\n') || obj.includes(':') || obj.includes('#')) {
      return `"${obj.replace(/"/g, '\\"')}"`;
    }
    return obj;
  }
  
  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return String(obj);
  }
  
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    return obj.map(item => {
      if (typeof item === 'object' && item !== null) {
        const inner = toYamlString(item, indent + 1);
        const firstLine = inner.split('\n')[0];
        const rest = inner.split('\n').slice(1).join('\n');
        return `${spaces}- ${firstLine?.trim()}${rest ? '\n' + rest : ''}`;
      }
      return `${spaces}- ${toYamlString(item, indent)}`;
    }).join('\n');
  }
  
  if (typeof obj === 'object') {
    const entries = Object.entries(obj).filter(([_, v]) => v !== undefined);
    if (entries.length === 0) return '{}';
    
    return entries.map(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        const inner = toYamlString(value, indent + 1);
        return `${spaces}${key}:\n${inner}`;
      }
      return `${spaces}${key}: ${toYamlString(value, indent)}`;
    }).join('\n');
  }
  
  return String(obj);
}
