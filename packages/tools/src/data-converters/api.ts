/**
 * API & HTTP Tool Converters - JWT, cURL, HTTP Headers
 */

/**
 * Decode JWT token (without verification)
 */
export function decodeJwt(token: string): string {
  try {
    const parts = token.split('.');
    
    if (parts.length !== 3) {
      return JSON.stringify({ error: 'Invalid JWT format - must have 3 parts' });
    }
    
    const [headerB64, payloadB64] = parts;
    
    // Decode base64url
    const decodeBase64Url = (str: string): string => {
      // Convert base64url to base64
      let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
      // Add padding if needed
      while (base64.length % 4) {
        base64 += '=';
      }
      return atob(base64);
    };
    
    const header = JSON.parse(decodeBase64Url(headerB64!));
    const payload = JSON.parse(decodeBase64Url(payloadB64!));
    
    // Add human-readable timestamps
    const result: Record<string, unknown> = {
      header,
      payload: { ...payload }
    };
    
    if (payload.exp) {
      result.expiration = new Date(payload.exp * 1000).toISOString();
      result.expired = Date.now() > payload.exp * 1000;
    }
    
    if (payload.iat) {
      result.issuedAt = new Date(payload.iat * 1000).toISOString();
    }
    
    if (payload.nbf) {
      result.notBefore = new Date(payload.nbf * 1000).toISOString();
    }
    
    return JSON.stringify(result, null, 2);
  } catch (e) {
    return JSON.stringify({ error: (e as Error).message });
  }
}

/**
 * Convert cURL command to fetch code
 */
export function curlToFetch(curl: string): string {
  try {
    // Parse curl command
    const args = parseCurlArgs(curl);
    
    const method = args.method || 'GET';
    const url = args.url || '';
    const headers = args.headers || {};
    const body = args.data;
    
    let code = `const response = await fetch('${url}', {\n`;
    code += `  method: '${method}',\n`;
    
    if (Object.keys(headers).length > 0) {
      code += `  headers: {\n`;
      for (const [key, value] of Object.entries(headers)) {
        code += `    '${key}': '${value}',\n`;
      }
      code += `  },\n`;
    }
    
    if (body) {
      const isJson = headers['Content-Type']?.includes('application/json');
      if (isJson) {
        code += `  body: JSON.stringify(${body}),\n`;
      } else {
        code += `  body: '${body.replace(/'/g, "\\'")}',\n`;
      }
    }
    
    code += `});\n\n`;
    code += `const data = await response.json();`;
    
    return code;
  } catch (e) {
    return `// Error parsing curl: ${(e as Error).message}`;
  }
}

/**
 * Convert cURL command to axios code
 */
export function curlToAxios(curl: string): string {
  try {
    const args = parseCurlArgs(curl);
    
    const method = (args.method || 'get').toLowerCase();
    const url = args.url || '';
    const headers = args.headers || {};
    const body = args.data;
    
    let code = `import axios from 'axios';\n\n`;
    code += `const response = await axios.${method}('${url}'`;
    
    if (body || Object.keys(headers).length > 0) {
      if (body && ['post', 'put', 'patch'].includes(method)) {
        code += `, ${body}`;
      }
      
      if (Object.keys(headers).length > 0) {
        code += `, {\n  headers: {\n`;
        for (const [key, value] of Object.entries(headers)) {
          code += `    '${key}': '${value}',\n`;
        }
        code += `  }\n}`;
      }
    }
    
    code += `);\n\nconsole.log(response.data);`;
    
    return code;
  } catch (e) {
    return `// Error parsing curl: ${(e as Error).message}`;
  }
}

/**
 * Convert fetch code to cURL
 */
export function fetchToCurl(fetchCode: string): string {
  try {
    // Extract URL
    const urlMatch = fetchCode.match(/fetch\(['"`]([^'"`]+)['"`]/);
    if (!urlMatch) {
      return '# Could not parse fetch URL';
    }
    
    const url = urlMatch[1];
    let curl = `curl '${url}'`;
    
    // Extract method
    const methodMatch = fetchCode.match(/method:\s*['"`](\w+)['"`]/);
    if (methodMatch) {
      curl += ` -X ${methodMatch[1]!.toUpperCase()}`;
    }
    
    // Extract headers
    const headerMatches = fetchCode.matchAll(/['"`]([^'"`]+)['"`]:\s*['"`]([^'"`]+)['"`]/g);
    for (const match of headerMatches) {
      if (match[1] && !['method', 'body', 'mode', 'credentials', 'cache'].includes(match[1])) {
        curl += ` \\\n  -H '${match[1]}: ${match[2]}'`;
      }
    }
    
    // Extract body
    const bodyMatch = fetchCode.match(/body:\s*(?:JSON\.stringify\()?([{[][\s\S]*?[}\]])\)?/);
    if (bodyMatch) {
      curl += ` \\\n  -d '${bodyMatch[1]?.replace(/'/g, "\\'")}'`;
    }
    
    return curl;
  } catch (e) {
    return `# Error: ${(e as Error).message}`;
  }
}

/**
 * Parse HTTP headers string to JSON
 */
export function parseHttpHeaders(headers: string): string {
  try {
    const result: Record<string, string> = {};
    const lines = headers.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      // Skip status line
      if (trimmed.startsWith('HTTP/')) continue;
      
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex > 0) {
        const key = trimmed.substring(0, colonIndex).trim();
        const value = trimmed.substring(colonIndex + 1).trim();
        result[key] = value;
      }
    }
    
    return JSON.stringify(result, null, 2);
  } catch (e) {
    return JSON.stringify({ error: (e as Error).message });
  }
}

/**
 * Format JSON object as HTTP headers
 */
export function jsonToHttpHeaders(json: string): string {
  try {
    const obj = JSON.parse(json);
    
    return Object.entries(obj)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
  } catch (e) {
    return `# Error: ${(e as Error).message}`;
  }
}

/**
 * Generate OpenAPI path from URL template
 */
export function urlToOpenApiPath(url: string): string {
  try {
    const urlObj = new URL(url);
    let path = urlObj.pathname;
    
    // Convert common ID patterns to path parameters
    path = path.replace(/\/\d+/g, '/{id}');
    path = path.replace(/\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, '/{uuid}');
    path = path.replace(/\/[a-f0-9]{24}/gi, '/{objectId}');
    
    const openApiPath = {
      [path]: {
        get: {
          summary: 'Get resource',
          parameters: [] as object[],
          responses: {
            '200': { description: 'Success' },
            '404': { description: 'Not found' }
          }
        }
      }
    };
    
    // Add query parameters
    for (const [key] of urlObj.searchParams) {
      openApiPath[path].get.parameters.push({
        name: key,
        in: 'query',
        schema: { type: 'string' }
      });
    }
    
    // Add path parameters
    const pathParams = path.match(/\{(\w+)\}/g);
    if (pathParams) {
      for (const param of pathParams) {
        const name = param.slice(1, -1);
        openApiPath[path].get.parameters.push({
          name,
          in: 'path',
          required: true,
          schema: { type: 'string' }
        });
      }
    }
    
    return JSON.stringify(openApiPath, null, 2);
  } catch (e) {
    return JSON.stringify({ error: (e as Error).message });
  }
}

/**
 * Parse URL and extract components
 */
export function parseUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    
    const result = {
      href: urlObj.href,
      protocol: urlObj.protocol,
      host: urlObj.host,
      hostname: urlObj.hostname,
      port: urlObj.port || 'default',
      pathname: urlObj.pathname,
      search: urlObj.search,
      hash: urlObj.hash,
      origin: urlObj.origin,
      username: urlObj.username || undefined,
      password: urlObj.password ? '***' : undefined,
      searchParams: Object.fromEntries(urlObj.searchParams)
    };
    
    return JSON.stringify(result, null, 2);
  } catch (e) {
    return JSON.stringify({ error: (e as Error).message });
  }
}

/**
 * Build URL from components
 */
export function buildUrl(baseUrl: string, params: Record<string, string>): string {
  try {
    const url = new URL(baseUrl);
    
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    
    return url.toString();
  } catch (e) {
    return `Error: ${(e as Error).message}`;
  }
}

// Helper: Parse curl command arguments
function parseCurlArgs(curl: string): {
  method?: string;
  url?: string;
  headers: Record<string, string>;
  data?: string;
} {
  const result: {
    method?: string;
    url?: string;
    headers: Record<string, string>;
    data?: string;
  } = { headers: {} };
  
  // Remove 'curl' prefix and handle line continuations
  let normalized = curl.replace(/^curl\s+/i, '').replace(/\\\n/g, ' ');
  
  // Extract URL (usually unquoted or in quotes)
  const urlMatch = normalized.match(/['"]?(https?:\/\/[^\s'"]+)['"]?/);
  if (urlMatch) {
    result.url = urlMatch[1];
  }
  
  // Extract method
  const methodMatch = normalized.match(/-X\s+['"]?(\w+)['"]?/);
  if (methodMatch) {
    result.method = methodMatch[1];
  }
  
  // Extract headers
  const headerMatches = normalized.matchAll(/-H\s+['"]([^'"]+)['"]/g);
  for (const match of headerMatches) {
    const header = match[1]!;
    const colonIdx = header.indexOf(':');
    if (colonIdx > 0) {
      const key = header.substring(0, colonIdx).trim();
      const value = header.substring(colonIdx + 1).trim();
      result.headers[key] = value;
    }
  }
  
  // Extract data
  const dataMatch = normalized.match(/(?:-d|--data|--data-raw)\s+['"](.+?)['"]\s*(?:-|$)/);
  if (dataMatch) {
    result.data = dataMatch[1];
  }
  
  // Infer method from data
  if (!result.method && result.data) {
    result.method = 'POST';
  }
  
  return result;
}
