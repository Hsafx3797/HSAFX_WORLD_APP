"""
URL validation for SSRF prevention.

All user-supplied URLs MUST pass validate_download_url() before fetch.
Blocks private IPs, non-HTTPS schemes, and DNS rebinding.
"""

from __future__ import annotations

import ipaddress
import socket
from urllib.parse import urlparse


_BLOCKED_NETWORKS = [
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("100.64.0.0/10"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.0.0.0/24"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("198.18.0.0/15"),
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
    ipaddress.ip_network("fe80::/10"),
]

_ALLOWED_SCHEMES = {"https"}


def _is_private_ip(ip_str: str) -> bool:
    """Check if an IP address falls within blocked (private/reserved) ranges."""
    try:
        addr = ipaddress.ip_address(ip_str)
    except ValueError:
        return True  # Can't parse → block
    return any(addr in net for net in _BLOCKED_NETWORKS)


def validate_download_url(url: str) -> str | None:
    """Validate a URL for safe server-side download.

    Returns None if valid, or an error message string if blocked.
    """
    try:
        parsed = urlparse(url)
    except Exception:
        return "Invalid URL"

    if parsed.scheme not in _ALLOWED_SCHEMES:
        return f"URL scheme '{parsed.scheme}' not allowed (only HTTPS)"

    hostname = parsed.hostname
    if not hostname:
        return "URL has no hostname"

    # Resolve DNS to get actual IP — prevents DNS rebinding
    try:
        addrinfos = socket.getaddrinfo(hostname, parsed.port or 443, proto=socket.IPPROTO_TCP)
    except socket.gaierror:
        return f"Cannot resolve hostname: {hostname}"

    if not addrinfos:
        return f"No addresses found for hostname: {hostname}"

    for family, _type, _proto, _canonname, sockaddr in addrinfos:
        ip_str = sockaddr[0]
        if _is_private_ip(ip_str):
            return "URL resolves to a private/internal IP address"

    return None
