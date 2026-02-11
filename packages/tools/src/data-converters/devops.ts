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
 * Generate Kubernetes deployment from Docker Compose service
 */
export function dockerComposeToKubernetes(compose: string, serviceName: string): string {
  try {
    // Very basic YAML parsing for demo
    const lines = compose.split('\n');
    let inService = false;
    let image = '';
    let ports: string[] = [];
    let envVars: { name: string; value: string }[] = [];
    
    for (const line of lines) {
      if (line.includes(`${serviceName}:`)) {
        inService = true;
        continue;
      }
      
      if (inService) {
        if (line.match(/^\s{2}\w/) && !line.includes(serviceName)) {
          break; // Exit when reaching next service
        }
        
        if (line.includes('image:')) {
          image = line.split('image:')[1]?.trim() || '';
        }
        
        if (line.includes('- "') && line.includes(':')) {
          const portMatch = line.match(/"?(\d+):(\d+)"?/);
          if (portMatch) {
            ports.push(portMatch[2]!);
          }
        }
        
        const envMatch = line.match(/^\s+-\s+([A-Z_]+)=(.+)/);
        if (envMatch) {
          envVars.push({ name: envMatch[1]!, value: envMatch[2]! });
        }
      }
    }
    
    const deployment = {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        name: serviceName,
        labels: { app: serviceName }
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: { app: serviceName }
        },
        template: {
          metadata: {
            labels: { app: serviceName }
          },
          spec: {
            containers: [{
              name: serviceName,
              image: image || `${serviceName}:latest`,
              ports: ports.map(p => ({ containerPort: parseInt(p, 10) })),
              env: envVars.length ? envVars : undefined
            }]
          }
        }
      }
    };
    
    // Simple YAML stringification
    return toYamlString(deployment);
  } catch (e) {
    return `# Error converting: ${(e as Error).message}`;
  }
}

/**
 * Generate Docker Compose from Kubernetes deployment
 */
export function kubernetesToDockerCompose(k8sYaml: string): string {
  try {
    // Basic YAML parsing
    const lines = k8sYaml.split('\n');
    let name = '';
    let image = '';
    const ports: string[] = [];
    const envVars: string[] = [];
    
    for (const line of lines) {
      if (line.match(/^\s{2}name:/) || line.match(/^name:/)) {
        if (!name) name = line.split('name:')[1]?.trim() || '';
      }
      if (line.includes('image:')) {
        image = line.split('image:')[1]?.trim() || '';
      }
      if (line.includes('containerPort:')) {
        const port = line.split('containerPort:')[1]?.trim();
        if (port) ports.push(port);
      }
      // Simple env var extraction
      const envMatch = line.match(/^\s+-\s+name:\s+([A-Z_]+)/);
      if (envMatch) {
        envVars.push(envMatch[1]!);
      }
    }
    
    const service = {
      image,
      ports: ports.map(p => `${p}:${p}`),
      environment: envVars.length ? envVars.map(e => `${e}=`) : undefined
    };
    
    const compose = {
      version: '3.8',
      services: {
        [name || 'app']: service
      }
    };
    
    return toYamlString(compose);
  } catch (e) {
    return `# Error converting: ${(e as Error).message}`;
  }
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
