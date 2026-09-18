import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), ".tssb-data.json");

interface DataSchema {
  users: any[];
  servers: any[];
  services: any[];
  networkConfigurations: any[];
  documentations: any[];
  activityLogs: any[];
  files: any[];
  fileTransfers: any[];
  mailMessages: any[];
  systemSettings: any;
  tickets: any[];
  ticketMessages: any[];
}

const defaultData: DataSchema = {
  users: [
    {
      id: "usr_admin_01",
      name: "System Administrator",
      username: "admin",
      email: "admin@tssb.local",
      passwordHash: "$2b$10$xVQAQG0K8Z1cSUjUayH/9eKGR3ZLLif/it8QsOX0xn0qjTml8jIYq", // Admin123!
      role: "ADMIN",
      status: "ACTIVE",
      bio: "Lead Infrastructure Architect and System Administrator for TSSB Platform.",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      securitySettings: {
        requireTransferApproval: false,
        requireMailApproval: false,
        twoFactorEnabled: false,
      },
      createdAt: new Date("2026-09-01T08:00:00Z").toISOString(),
      updatedAt: new Date("2026-09-01T08:00:00Z").toISOString(),
    },
    {
      id: "usr_user_01",
      name: "Kaiti Mckin",
      username: "kaiti",
      email: "user@tssb.local",
      passwordHash: "$2b$10$3d5nV7liIeM.rKoH2Uv.EOAu97iPXPJTOKWMTkT0GbNZTNjGW4cXi", // User123!
      role: "USER",
      status: "ACTIVE",
      bio: "Junior DevOps engineer managing service configurations and network telemetry.",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      securitySettings: {
        requireTransferApproval: false,
        requireMailApproval: false,
        twoFactorEnabled: false,
      },
      createdAt: new Date("2026-09-02T09:30:00Z").toISOString(),
      updatedAt: new Date("2026-09-02T09:30:00Z").toISOString(),
    },
  ],
  servers: [
    {
      id: "srv_01",
      name: "Web Gateway Alpha",
      hostname: "serve-client1",
      ipAddress: "122.188.123.45",
      operatingSystem: "Ubuntu 24.04 LTS",
      serverType: "WEB",
      location: "US-East (Virginia - Rack A1)",
      status: "ONLINE",
      description: "Edge reverse proxy and SSL termination server for incoming web traffic.",
      createdById: "usr_admin_01",
      createdAt: new Date("2026-09-05T10:00:00Z").toISOString(),
      updatedAt: new Date("2026-09-05T10:00:00Z").toISOString(),
    },
    {
      id: "srv_02",
      name: "Application Node 01",
      hostname: "serve-client2",
      ipAddress: "122.128.18.238",
      operatingSystem: "Debian 12 Bookworm",
      serverType: "APPLICATION",
      location: "US-East (Virginia - Rack A2)",
      status: "MAINTENANCE",
      description: "Primary microservices and API application runner node.",
      createdById: "usr_admin_01",
      createdAt: new Date("2026-09-06T11:00:00Z").toISOString(),
      updatedAt: new Date("2026-09-06T11:00:00Z").toISOString(),
    },
    {
      id: "srv_03",
      name: "Database Primary Cluster",
      hostname: "db-cluster-beta",
      ipAddress: "10.0.4.15",
      operatingSystem: "Rocky Linux 9",
      serverType: "DATABASE",
      location: "US-East (Internal Secure Enclave)",
      status: "ONLINE",
      description: "High-performance transactional database node running PostgreSQL.",
      createdById: "usr_admin_01",
      createdAt: new Date("2026-09-07T12:00:00Z").toISOString(),
      updatedAt: new Date("2026-09-07T12:00:00Z").toISOString(),
    },
    {
      id: "srv_04",
      name: "Authoritative DNS Resolver",
      hostname: "serve-client3",
      ipAddress: "198.51.100.12",
      operatingSystem: "Alpine Linux 3.20",
      serverType: "DNS",
      location: "EU-West (Frankfurt - Zone 1)",
      status: "ONLINE",
      description: "Primary internal and external authoritative DNS routing name server.",
      createdById: "usr_user_01",
      createdAt: new Date("2026-09-08T13:00:00Z").toISOString(),
      updatedAt: new Date("2026-09-08T13:00:00Z").toISOString(),
    },
    {
      id: "srv_05",
      name: "Mail Relay Gateway",
      hostname: "mail-edge-01",
      ipAddress: "203.0.113.88",
      operatingSystem: "Ubuntu 22.04 LTS",
      serverType: "MAIL",
      location: "AP-Southeast (Singapore - DC2)",
      status: "OFFLINE",
      description: "Outbound transactional email routing and spam filtering relay node.",
      createdById: "usr_admin_01",
      createdAt: new Date("2026-09-09T14:00:00Z").toISOString(),
      updatedAt: new Date("2026-09-09T14:00:00Z").toISOString(),
    },
  ],
  services: [
    {
      id: "svc_01",
      name: "Nginx Ingress Proxy",
      serverId: "srv_01",
      port: 443,
      protocol: "TCP/HTTPS",
      version: "1.26.1",
      status: "ACTIVE",
      description: "Handles HTTP/3 and HTTPS ingress routing with TLS certbot certificates.",
      createdById: "usr_admin_01",
      createdAt: new Date("2026-09-10T08:00:00Z").toISOString(),
      updatedAt: new Date("2026-09-10T08:00:00Z").toISOString(),
    },
    {
      id: "svc_02",
      name: "OpenSSH Daemon",
      serverId: "srv_01",
      port: 22,
      protocol: "TCP",
      version: "9.6p1",
      status: "ACTIVE",
      description: "Hardened SSH daemon accepting ed25519 key authentication only.",
      createdById: "usr_admin_01",
      createdAt: new Date("2026-09-10T08:15:00Z").toISOString(),
      updatedAt: new Date("2026-09-10T08:15:00Z").toISOString(),
    },
    {
      id: "svc_03",
      name: "Next.js Application Engine",
      serverId: "srv_02",
      port: 3000,
      protocol: "HTTP",
      version: "15.2.1",
      status: "DEGRADED",
      description: "Node.js cluster executing server-side rendering and API actions.",
      createdById: "usr_admin_01",
      createdAt: new Date("2026-09-10T08:30:00Z").toISOString(),
      updatedAt: new Date("2026-09-10T08:30:00Z").toISOString(),
    },
    {
      id: "svc_04",
      name: "Redis Session Cache",
      serverId: "srv_02",
      port: 6379,
      protocol: "TCP",
      version: "7.2.4",
      status: "ACTIVE",
      description: "In-memory caching and session store with persistent RDB snapshots.",
      createdById: "usr_admin_01",
      createdAt: new Date("2026-09-10T08:45:00Z").toISOString(),
      updatedAt: new Date("2026-09-10T08:45:00Z").toISOString(),
    },
    {
      id: "svc_05",
      name: "PostgreSQL Database Engine",
      serverId: "srv_03",
      port: 5432,
      protocol: "TCP",
      version: "16.2",
      status: "ACTIVE",
      description: "Primary relational database storing system tables, users, and audit records.",
      createdById: "usr_admin_01",
      createdAt: new Date("2026-09-10T09:00:00Z").toISOString(),
      updatedAt: new Date("2026-09-10T09:00:00Z").toISOString(),
    },
    {
      id: "svc_06",
      name: "PgBouncer Connection Pooler",
      serverId: "srv_03",
      port: 6432,
      protocol: "TCP",
      version: "1.22.0",
      status: "ACTIVE",
      description: "Lightweight connection pooler managing serverless transaction queries.",
      createdById: "usr_admin_01",
      createdAt: new Date("2026-09-10T09:15:00Z").toISOString(),
      updatedAt: new Date("2026-09-10T09:15:00Z").toISOString(),
    },
    {
      id: "svc_07",
      name: "BIND9 DNS Nameserver",
      serverId: "srv_04",
      port: 53,
      protocol: "UDP/TCP",
      version: "9.18.24",
      status: "ACTIVE",
      description: "Domain Name System daemon serving zone records and DNSSEC validation.",
      createdById: "usr_user_01",
      createdAt: new Date("2026-09-10T09:30:00Z").toISOString(),
      updatedAt: new Date("2026-09-10T09:30:00Z").toISOString(),
    },
    {
      id: "svc_08",
      name: "Postfix SMTP Relay",
      serverId: "srv_05",
      port: 25,
      protocol: "TCP",
      version: "3.8.1",
      status: "STOPPED",
      description: "Mail transfer agent pending scheduled security patch installation.",
      createdById: "usr_admin_01",
      createdAt: new Date("2026-09-10T09:45:00Z").toISOString(),
      updatedAt: new Date("2026-09-10T09:45:00Z").toISOString(),
    },
    {
      id: "svc_09",
      name: "Dovecot IMAP Server",
      serverId: "srv_05",
      port: 993,
      protocol: "TCP/SSL",
      version: "2.3.21",
      status: "STOPPED",
      description: "Secure mailbox retrieval server currently offline for maintenance.",
      createdById: "usr_admin_01",
      createdAt: new Date("2026-09-10T10:00:00Z").toISOString(),
      updatedAt: new Date("2026-09-10T10:00:00Z").toISOString(),
    },
    {
      id: "svc_10",
      name: "Prometheus Node Exporter",
      serverId: "srv_01",
      port: 9100,
      protocol: "HTTP",
      version: "1.7.0",
      status: "ACTIVE",
      description: "Telemetry collector exposing CPU, RAM, disk, and network interface metrics.",
      createdById: "usr_admin_01",
      createdAt: new Date("2026-09-10T10:15:00Z").toISOString(),
      updatedAt: new Date("2026-09-10T10:15:00Z").toISOString(),
    },
  ],
  networkConfigurations: [
    {
      id: "net_01",
      serverId: "srv_01",
      interfaceName: "eth0",
      ipAddress: "122.188.123.45",
      subnetMask: "255.255.255.0",
      gateway: "122.188.123.1",
      dnsPrimary: "1.1.1.1",
      dnsSecondary: "8.8.8.8",
      vlan: 100,
      description: "Primary public uplink for edge ingress traffic.",
      createdById: "usr_admin_01",
      createdAt: new Date("2026-09-11T08:00:00Z").toISOString(),
      updatedAt: new Date("2026-09-11T08:00:00Z").toISOString(),
    },
    {
      id: "net_02",
      serverId: "srv_02",
      interfaceName: "ens192",
      ipAddress: "122.128.18.238",
      subnetMask: "255.255.255.192",
      gateway: "122.128.18.193",
      dnsPrimary: "1.1.1.1",
      dnsSecondary: "1.0.0.1",
      vlan: 120,
      description: "DMZ application interface connecting to frontend proxy.",
      createdById: "usr_admin_01",
      createdAt: new Date("2026-09-11T08:15:00Z").toISOString(),
      updatedAt: new Date("2026-09-11T08:15:00Z").toISOString(),
    },
    {
      id: "net_03",
      serverId: "srv_03",
      interfaceName: "bond0.200",
      ipAddress: "10.0.4.15",
      subnetMask: "255.255.248.0",
      gateway: "10.0.4.1",
      dnsPrimary: "10.0.0.2",
      dnsSecondary: "10.0.0.3",
      vlan: 200,
      description: "Isolated database VLAN with 10GbE bonded NIC aggregation.",
      createdById: "usr_admin_01",
      createdAt: new Date("2026-09-11T08:30:00Z").toISOString(),
      updatedAt: new Date("2026-09-11T08:30:00Z").toISOString(),
    },
    {
      id: "net_04",
      serverId: "srv_04",
      interfaceName: "eth0",
      ipAddress: "198.51.100.12",
      subnetMask: "255.255.255.0",
      gateway: "198.51.100.1",
      dnsPrimary: "127.0.0.1",
      dnsSecondary: "9.9.9.9",
      vlan: 53,
      description: "Anycast public interface for DNS query routing.",
      createdById: "usr_user_01",
      createdAt: new Date("2026-09-11T08:45:00Z").toISOString(),
      updatedAt: new Date("2026-09-11T08:45:00Z").toISOString(),
    },
    {
      id: "net_05",
      serverId: "srv_05",
      interfaceName: "eth0",
      ipAddress: "203.0.113.88",
      subnetMask: "255.255.255.240",
      gateway: "203.0.113.81",
      dnsPrimary: "1.1.1.1",
      dnsSecondary: "8.8.4.4",
      vlan: 25,
      description: "Reverse-DNS PTR verified interface for mail exchange.",
      createdById: "usr_admin_01",
      createdAt: new Date("2026-09-11T09:00:00Z").toISOString(),
      updatedAt: new Date("2026-09-11T09:00:00Z").toISOString(),
    },
  ],
  documentations: [
    {
      id: "doc_01",
      title: "Ubuntu Server Installation and Base Hardening Guide",
      category: "INSTALLATION",
      content:
        "### Initial Provisioning\n\n1. Boot the official Ubuntu 24.04 LTS minimal ISO image.\n2. Partition disk with LVM over LUKS encryption for at-rest data protection.\n3. Configure static IP addressing on interface eth0.\n4. Create non-root administration account with sudo access.\n5. Disable root password authentication via OpenSSH config.",
      serverId: "srv_01",
      authorId: "usr_admin_01",
      createdAt: new Date("2026-09-12T10:00:00Z").toISOString(),
      updatedAt: new Date("2026-09-12T10:00:00Z").toISOString(),
    },
    {
      id: "doc_02",
      title: "Nginx Reverse Proxy & HTTP/3 Configuration Protocol",
      category: "CONFIGURATION",
      content:
        "### Ingress Architecture\n\n- Deploy Nginx with HTTP/2 and HTTP/3 QUIC support.\n- Configure upstream proxy pass to Next.js server on port 3000.\n- Enable Brotli and Gzip compression for static assets.\n- Enforce HSTS (Strict-Transport-Security) header with 2-year max-age.\n- Set client body buffer limits to mitigate DDoS vectors.",
      serverId: "srv_01",
      authorId: "usr_admin_01",
      createdAt: new Date("2026-09-12T11:00:00Z").toISOString(),
      updatedAt: new Date("2026-09-12T11:00:00Z").toISOString(),
    },
    {
      id: "doc_03",
      title: "Isolated Database VLAN 200 Security Segmentation",
      category: "NETWORKING",
      content:
        "### Network Segregation\n\nDatabase servers reside exclusively inside isolated VLAN 200 without direct public internet exposure. Route ingress traffic exclusively through the internal load balancer and pgBouncer proxy.\n\nFirewall rules restrict inbound port 5432 to whitelisted application node IP blocks.",
      serverId: "srv_03",
      authorId: "usr_admin_01",
      createdAt: new Date("2026-09-12T12:00:00Z").toISOString(),
      updatedAt: new Date("2026-09-12T12:00:00Z").toISOString(),
    },
    {
      id: "doc_04",
      title: "Zero-Trust SSH Access & ED25519 Key Enactment",
      category: "SECURITY",
      content:
        "### SSH Hardening Checklist\n\n- PermitRootLogin no\n- PasswordAuthentication no\n- KbdInteractiveAuthentication no\n- MaxAuthTries 3\n- X11Forwarding no\n- AllowAgentForwarding no\n- Implement Fail2ban with 5-minute jail for failed attempts.",
      serverId: "srv_01",
      authorId: "usr_admin_01",
      createdAt: new Date("2026-09-12T13:00:00Z").toISOString(),
      updatedAt: new Date("2026-09-12T13:00:00Z").toISOString(),
    },
    {
      id: "doc_05",
      title: "High-Availability PostgreSQL Failover & Backup Strategy",
      category: "MAINTENANCE",
      content:
        "### Automated Backup Runbook\n\n1. Continuous WAL archiving to S3-compatible encrypted cold storage.\n2. Nightly physical pg_basebackup with 30-day retention policy.\n3. Weekly automated test restoration in staging environment.\n4. Latency monitoring via Prometheus PostgreSQL exporter alerts.",
      serverId: "srv_03",
      authorId: "usr_admin_01",
      createdAt: new Date("2026-09-12T14:00:00Z").toISOString(),
      updatedAt: new Date("2026-09-12T14:00:00Z").toISOString(),
    },
    {
      id: "doc_06",
      title: "BIND9 DNS Authoritative Zone Setup & DNSSEC Validation",
      category: "CONFIGURATION",
      content:
        "### DNS Zone Administration\n\nConfigure authoritative zone records for primary domain. Generate KSK (Key Signing Key) and ZSK (Zone Signing Key) using algorithm 13 (ECDSA P-256 with SHA-256). Submit DS records to parent registrar.",
      serverId: "srv_04",
      authorId: "usr_user_01",
      createdAt: new Date("2026-09-12T15:00:00Z").toISOString(),
      updatedAt: new Date("2026-09-12T15:00:00Z").toISOString(),
    },
    {
      id: "doc_07",
      title: "Troubleshooting High Memory Utilization on Node Runners",
      category: "TROUBLESHOOTING",
      content:
        "### Diagnostic Workflow\n\n1. Inspect system memory usage with `free -m` and `htop`.\n2. Inspect top consumer processes with `ps aux --sort=-%mem | head -n 10`.\n3. Generate heap snapshot using Node.js inspector protocol.\n4. Check kernel dmesg logs for OOM killer trigger entries.\n5. Adjust max-old-space-size parameters in systemd service definition.",
      serverId: "srv_02",
      authorId: "usr_user_01",
      createdAt: new Date("2026-09-12T16:00:00Z").toISOString(),
      updatedAt: new Date("2026-09-12T16:00:00Z").toISOString(),
    },
    {
      id: "doc_08",
      title: "Mail Server Postfix SPF, DKIM, and DMARC Policy Enactment",
      category: "SECURITY",
      content:
        "### Email Deliverability & Anti-Spoofing\n\n- Deploy OpenDKIM milter listening on localhost socket.\n- Publish TXT record for SPF: `v=spf1 mx ip4:203.0.113.88 ~all`.\n- Configure DMARC with rejection policy and aggregate forensic reporting email.",
      serverId: "srv_05",
      authorId: "usr_admin_01",
      createdAt: new Date("2026-09-12T17:00:00Z").toISOString(),
      updatedAt: new Date("2026-09-12T17:00:00Z").toISOString(),
    },
  ],
  activityLogs: [
    { id: "act_01", action: "USER_REGISTERED", entity: "USER", entityId: "usr_admin_01", description: "Administrator account provisioned in primary auth realm.", ipAddress: "192.168.1.100", userId: "usr_admin_01", createdAt: new Date("2026-09-01T08:00:00Z").toISOString() },
    { id: "act_02", action: "USER_LOGIN", entity: "AUTH", entityId: "usr_admin_01", description: "Administrator logged in via interactive swap-card portal.", ipAddress: "192.168.1.100", userId: "usr_admin_01", createdAt: new Date("2026-09-01T08:05:00Z").toISOString() },
    { id: "act_03", action: "SERVER_CREATED", entity: "SERVER", entityId: "srv_01", description: "Provisioned edge server serve-client1 with Ubuntu 24.04.", ipAddress: "192.168.1.100", userId: "usr_admin_01", createdAt: new Date("2026-09-05T10:00:00Z").toISOString() },
    { id: "act_04", action: "SERVICE_CREATED", entity: "SERVICE", entityId: "svc_01", description: "Configured Nginx reverse proxy service on port 443.", ipAddress: "192.168.1.100", userId: "usr_admin_01", createdAt: new Date("2026-09-10T08:00:00Z").toISOString() },
    { id: "act_05", action: "NETWORK_CREATED", entity: "NETWORK", entityId: "net_01", description: "Bound interface eth0 with public IP 122.188.123.45.", ipAddress: "192.168.1.100", userId: "usr_admin_01", createdAt: new Date("2026-09-11T08:00:00Z").toISOString() },
    { id: "act_06", action: "SERVER_CREATED", entity: "SERVER", entityId: "srv_02", description: "Provisioned application server serve-client2.", ipAddress: "192.168.1.100", userId: "usr_admin_01", createdAt: new Date("2026-09-06T11:00:00Z").toISOString() },
    { id: "act_07", action: "DOCUMENTATION_CREATED", entity: "DOCUMENTATION", entityId: "doc_01", description: "Published Base Hardening Guide for Ubuntu 24.04.", ipAddress: "192.168.1.100", userId: "usr_admin_01", createdAt: new Date("2026-09-12T10:00:00Z").toISOString() },
    { id: "act_08", action: "USER_REGISTERED", entity: "USER", entityId: "usr_user_01", description: "User Kaiti Mckin created account.", ipAddress: "192.168.1.105", userId: "usr_user_01", createdAt: new Date("2026-09-02T09:30:00Z").toISOString() },
  ],
  files: [
    {
      id: "file_01",
      userId: "usr_admin_01",
      name: "nginx.conf.backup",
      size: 14500,
      mimeType: "text/plain",
      category: "CONFIG",
      description: "Production reverse proxy routing configuration for edge gateway.",
      content: "events { worker_connections 1024; }\nhttp {\n  upstream backend { server 122.128.18.238:3000; }\n  server {\n    listen 80; server_name tssb.local;\n    return 301 https://$host$request_uri;\n  }\n  server {\n    listen 443 ssl;\n    server_name tssb.local;\n    ssl_certificate /etc/ssl/certs/tssb.pem;\n    location / { proxy_pass http://backend; }\n  }\n}",
      createdAt: new Date("2026-09-10T08:30:00Z").toISOString(),
      updatedAt: new Date("2026-09-10T08:30:00Z").toISOString(),
    },
    {
      id: "file_02",
      userId: "usr_admin_01",
      name: "vlan_topology_specs.pdf",
      size: 251000,
      mimeType: "application/pdf",
      category: "ARCHIVE",
      description: "Network architecture blue-print and 802.1Q trunking specifications.",
      content: "[Binary PDF Specification Content - TSSB Multi-VLAN Topology v2.4]",
      createdAt: new Date("2026-09-11T10:15:00Z").toISOString(),
      updatedAt: new Date("2026-09-11T10:15:00Z").toISOString(),
    },
    {
      id: "file_03",
      userId: "usr_admin_01",
      name: "ssl_wildcard_cert.pem",
      size: 4920,
      mimeType: "text/plain",
      category: "CERTIFICATE",
      description: "RSA 4096-bit wildcard public certificate (*.tssb.local).",
      content: "-----BEGIN CERTIFICATE-----\nMIIDXTCCAkWgAwIBAgIUW6o1Q8L7WjFz583TSSBPROD1001...\n-----END CERTIFICATE-----",
      createdAt: new Date("2026-09-12T11:00:00Z").toISOString(),
      updatedAt: new Date("2026-09-12T11:00:00Z").toISOString(),
    },
    {
      id: "file_04",
      userId: "usr_user_01",
      name: "database_migration_v2.sql",
      size: 70144,
      mimeType: "text/plain",
      category: "SCRIPT",
      description: "DDL indexes and foreign keys migration script for PostgreSQL.",
      content: "-- Migration: V2__optimize_indexes.sql\nCREATE INDEX IF NOT EXISTS idx_services_server_id ON services(server_id);\nCREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);",
      createdAt: new Date("2026-09-14T14:20:00Z").toISOString(),
      updatedAt: new Date("2026-09-14T14:20:00Z").toISOString(),
    },
    {
      id: "file_05",
      userId: "usr_user_01",
      name: "system_health_audit.log",
      size: 18840,
      mimeType: "text/plain",
      category: "LOG",
      description: "Automated cron output: memory utilization and packet drop rates.",
      content: "[2026-09-18 00:00:01] INFO [cron]: Running automated telemetry sweep\n[2026-09-18 00:00:02] INFO [cron]: CPU avg: 14.2% | RAM: 38.6% | Disk: 42.1%\n[2026-09-18 00:00:03] SUCCESS: All 5 servers responding within 1.2ms latency.",
      createdAt: new Date("2026-09-15T09:00:00Z").toISOString(),
      updatedAt: new Date("2026-09-15T09:00:00Z").toISOString(),
    },
  ],
  fileTransfers: [
    {
      id: "ft_01",
      senderId: "usr_admin_01",
      senderName: "System Administrator",
      senderUsername: "admin",
      receiverId: "usr_user_01",
      receiverName: "Kaiti Mckin",
      receiverUsername: "kaiti",
      fileName: "nginx.conf.backup",
      fileSize: 14500,
      protocol: "SFTP",
      port: 22,
      status: "COMPLETED",
      note: "Please verify upstream proxy directives before evening maintenance.",
      transferredAt: new Date("2026-09-16T10:30:00Z").toISOString(),
    },
    {
      id: "ft_02",
      senderId: "usr_user_01",
      senderName: "Kaiti Mckin",
      senderUsername: "kaiti",
      receiverId: "usr_admin_01",
      receiverName: "System Administrator",
      receiverUsername: "admin",
      fileName: "system_health_audit.log",
      fileSize: 18840,
      protocol: "FTP",
      port: 21,
      status: "COMPLETED",
      note: "Weekly audit log exported from Prometheus daemon.",
      transferredAt: new Date("2026-09-17T11:45:00Z").toISOString(),
    },
  ],
  mailMessages: [
    {
      id: "mail_01",
      senderId: "usr_admin_01",
      senderName: "System Administrator",
      senderEmail: "admin@tssb.local",
      recipientId: "usr_user_01",
      recipientName: "Kaiti Mckin",
      recipientEmail: "user@tssb.local",
      subject: "Scheduled Network Maintenance Window (VLAN 30)",
      body: "Hello Kaiti,\n\nPlease be advised that the authoritative DNS node (serve-client3) will undergo security patching tonight at 02:00 UTC. Ensure any ongoing service migrations on VLAN 30 are concluded beforehand.\n\nRegards,\nSystem Administrator",
      priority: "HIGH",
      isRead: true,
      hasAttachment: true,
      attachmentName: "nginx.conf.backup",
      sentAt: new Date("2026-09-16T14:00:00Z").toISOString(),
    },
    {
      id: "mail_02",
      senderId: "usr_user_01",
      senderName: "Kaiti Mckin",
      senderEmail: "user@tssb.local",
      recipientId: "usr_admin_01",
      recipientName: "System Administrator",
      recipientEmail: "admin@tssb.local",
      subject: "Re: Scheduled Network Maintenance Window (VLAN 30)",
      body: "Acknowledged. All zone transfer scripts have been verified and backup routes in VLAN 10 are primed for failover.\n\nThank you,\nKaiti Mckin",
      priority: "NORMAL",
      isRead: false,
      hasAttachment: false,
      attachmentName: null,
      sentAt: new Date("2026-09-16T14:45:00Z").toISOString(),
    },
    {
      id: "mail_03",
      senderId: "usr_admin_01",
      senderName: "System Administrator",
      senderEmail: "admin@tssb.local",
      recipientId: "usr_user_01",
      recipientName: "Kaiti Mckin",
      recipientEmail: "user@tssb.local",
      subject: "FTP Quota Increased & vsftpd Daemon Operational",
      body: "Kaiti, your storage quota has been increased to 50 GB for cluster runbooks. The new vsftpd service instance on server-client2 is operational on port 21.\n\nBest,\nAdmin",
      priority: "NORMAL",
      isRead: true,
      hasAttachment: false,
      attachmentName: null,
      sentAt: new Date("2026-09-17T09:15:00Z").toISOString(),
    },
  ],
  systemSettings: {
    platformName: "TSSB Infrastructure Platform",
    maintenanceMode: false,
    allowRegistration: true,
    loginSuspended: false,
    loginSuspensionMessage: "Akses login pengguna saat ini ditangguhkan sementara oleh Administrator untuk pemeliharaan sistem. Silakan coba lagi nanti.",
    sessionTimeoutMinutes: 60,
    maxUploadSizeBytes: 104857600, // 100MB
    announcementText: "System operational. All 5 cluster servers and network routes are active.",
    showAnnouncement: true,
    ftpPort: 21,
    smtpPort: 587,
    imapPort: 993,
    storageQuotaDefaultMb: 10240, // 10GB
    lastBackupAt: new Date("2026-09-18T06:00:00Z").toISOString(),
  },
  tickets: [
    {
      id: "ticket_01",
      title: "DNS Zone Synchronization Degraded on Secondary Resolver",
      category: "BUG",
      priority: "HIGH",
      status: "IN_PROGRESS",
      authorId: "usr_user_01",
      authorName: "Kaiti Mckin",
      authorUsername: "kaiti",
      authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      assignedTo: "admin",
      description: "Zone transfer AXFR for tssb.local timed out between ns1 and ns2. BIND9 error indicates transfer refusal.",
      imageUrl: null,
      createdAt: new Date("2026-09-17T14:30:00Z").toISOString(),
      updatedAt: new Date("2026-09-17T16:00:00Z").toISOString(),
    },
    {
      id: "ticket_02",
      title: "Storage Pool High Watermark on Application Node 01",
      category: "SERVER_INCIDENT",
      priority: "NORMAL",
      status: "OPEN",
      authorId: "usr_user_01",
      authorName: "Kaiti Mckin",
      authorUsername: "kaiti",
      authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      assignedTo: null,
      description: "Docker build caches on serve-client2 are exceeding recommended threshold. Storage quota alerts triggered.",
      imageUrl: null,
      createdAt: new Date("2026-09-18T08:00:00Z").toISOString(),
      updatedAt: new Date("2026-09-18T08:00:00Z").toISOString(),
    },
  ],
  ticketMessages: [
    {
      id: "tmsg_01",
      ticketId: "ticket_01",
      authorId: "usr_user_01",
      authorName: "Kaiti Mckin",
      authorUsername: "kaiti",
      authorRole: "USER",
      authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      message: "Here is the error log when running rndc reload tssb.local: 'transfer of tssb.local/IN from 198.51.100.12#53: failed while receiving responses: REFUSED'.",
      imageUrl: null,
      createdAt: new Date("2026-09-17T14:35:00Z").toISOString(),
    },
    {
      id: "tmsg_02",
      ticketId: "ticket_01",
      authorId: "usr_admin_01",
      authorName: "System Administrator",
      authorUsername: "admin",
      authorRole: "ADMIN",
      authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      message: "Investigating named.conf.options now. Updating allow-transfer ACL to include the secondary subnet. Stand by.",
      imageUrl: null,
      createdAt: new Date("2026-09-17T15:10:00Z").toISOString(),
    },
  ],
};

function readData(): DataSchema {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      return {
        ...defaultData,
        ...parsed,
        files: Array.isArray(parsed.files) && parsed.files.length > 0 ? parsed.files : defaultData.files,
        fileTransfers: Array.isArray(parsed.fileTransfers) && parsed.fileTransfers.length > 0 ? parsed.fileTransfers : defaultData.fileTransfers,
        mailMessages: Array.isArray(parsed.mailMessages) && parsed.mailMessages.length > 0 ? parsed.mailMessages : defaultData.mailMessages,
        systemSettings: { ...defaultData.systemSettings, ...(parsed.systemSettings || {}) },
        tickets: Array.isArray(parsed.tickets) && parsed.tickets.length > 0 ? parsed.tickets : defaultData.tickets,
        ticketMessages: Array.isArray(parsed.ticketMessages) && parsed.ticketMessages.length > 0 ? parsed.ticketMessages : defaultData.ticketMessages,
      };
    }
  } catch (err) {
    console.error("Error reading .tssb-data.json, falling back to defaults:", err);
  }
  writeData(defaultData);
  return defaultData;
}

function writeData(data: DataSchema): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing .tssb-data.json:", err);
  }
}

export const fallbackStore = {
  user: {
    findFirst: async ({ where }: { where?: any } = {}) => {
      const data = readData();
      if (!where) return data.users[0] || null;
      return (
        data.users.find((u) => {
          // Check ID exclusion or match first
          if (where.id?.not && u.id === where.id.not) return false;
          if (where.id && typeof where.id === "string" && u.id !== where.id) return false;

          if (where.OR) {
            return where.OR.some((cond: any) => {
              if (cond.email && u.email.toLowerCase() === cond.email.toLowerCase()) return true;
              if (cond.username && u.username.toLowerCase() === cond.username.toLowerCase()) return true;
              return false;
            });
          }
          if (where.email && u.email.toLowerCase() === where.email.toLowerCase()) return true;
          if (where.username && u.username.toLowerCase() === where.username.toLowerCase()) return true;
          return false;
        }) || null
      );
    },
    findUnique: async ({ where, include }: { where: { id?: string; email?: string; username?: string }; include?: any }) => {
      const data = readData();
      const u = data.users.find(
        (x) =>
          (where.id && x.id === where.id) ||
          (where.email && x.email.toLowerCase() === where.email.toLowerCase()) ||
          (where.username && x.username.toLowerCase() === where.username.toLowerCase())
      );
      if (!u) return null;
      const res = { ...u };
      if (include?._count) {
        res._count = {
          servers: data.servers.filter((s) => s.createdById === u.id).length,
          documentation: data.documentations.filter((d) => d.authorId === u.id).length,
          activityLogs: data.activityLogs.filter((a) => a.userId === u.id).length,
        };
      }
      if (include?.servers) {
        res.servers = data.servers.filter((s) => s.createdById === u.id);
      }
      if (include?.documentation) {
        res.documentation = data.documentations.filter((d) => d.authorId === u.id);
      }
      if (include?.activityLogs) {
        res.activityLogs = data.activityLogs.filter((a) => a.userId === u.id);
      }
      return res;
    },
    findMany: async ({ where, skip = 0, take = 50, select, orderBy }: any = {}) => {
      const data = readData();
      let list = [...data.users];
      if (where?.role) list = list.filter((u) => u.role === where.role);
      if (where?.status) list = list.filter((u) => u.status === where.status);
      if (where?.OR) {
        list = list.filter((u) =>
          where.OR.some((c: any) => {
            if (c.name?.contains) return u.name.toLowerCase().includes(c.name.contains.toLowerCase());
            if (c.username?.contains) return u.username.toLowerCase().includes(c.username.contains.toLowerCase());
            if (c.email?.contains) return u.email.toLowerCase().includes(c.email.contains.toLowerCase());
            return false;
          })
        );
      }
      const slice = list.slice(skip, skip + take).map((u) => ({
        ...u,
        _count: {
          servers: data.servers.filter((s) => s.createdById === u.id).length,
          documentation: data.documentations.filter((d) => d.authorId === u.id).length,
        },
      }));
      return slice;
    },
    create: async ({ data }: { data: any }) => {
      const store = readData();
      const newUser = {
        id: `usr_${Date.now()}`,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      store.users.push(newUser);
      writeData(store);
      return newUser;
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const store = readData();
      const idx = store.users.findIndex((u) => u.id === where.id);
      if (idx === -1) throw new Error("User not found");
      store.users[idx] = {
        ...store.users[idx],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      writeData(store);
      return store.users[idx];
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const store = readData();
      store.users = store.users.filter((u) => u.id !== where.id);
      writeData(store);
      return { success: true };
    },
    count: async ({ where }: { where?: any } = {}) => {
      const data = readData();
      let list = [...data.users];
      if (where?.status) list = list.filter((u) => u.status === where.status);
      if (where?.role) list = list.filter((u) => u.role === where.role);
      return list.length;
    },
  },

  server: {
    findFirst: async ({ where }: any = {}) => {
      const data = readData();
      if (!where) return data.servers[0] || null;
      return (
        data.servers.find((s) => {
          if (where.hostname) return s.hostname.toLowerCase() === where.hostname.toLowerCase();
          if (where.id) return s.id === where.id;
          return false;
        }) || null
      );
    },
    findUnique: async ({ where, include }: any) => {
      const data = readData();
      const s = data.servers.find((x) => x.id === where.id);
      if (!s) return null;
      const res = { ...s };
      if (include?.createdBy) {
        res.createdBy = data.users.find((u) => u.id === s.createdById) || {
          id: s.createdById,
          name: "Administrator",
          username: "admin",
          role: "ADMIN",
        };
      }
      if (include?.services) {
        res.services = data.services.filter((svc) => svc.serverId === s.id);
      }
      if (include?.networkConfigs) {
        res.networkConfigs = data.networkConfigurations.filter((net) => net.serverId === s.id);
      }
      if (include?.documentation) {
        res.documentation = data.documentations.filter((d) => d.serverId === s.id);
      }
      return res;
    },
    findMany: async ({ where }: any = {}) => {
      const data = readData();
      let list = [...data.servers];
      if (where?.status) list = list.filter((s) => s.status === where.status);
      if (where?.serverType) list = list.filter((s) => s.serverType === where.serverType);
      if (where?.OR) {
        list = list.filter((s) =>
          where.OR.some((c: any) => {
            const q = (c.name?.contains || c.hostname?.contains || c.ipAddress?.contains || "").toLowerCase();
            return (
              s.name.toLowerCase().includes(q) ||
              s.hostname.toLowerCase().includes(q) ||
              s.ipAddress.toLowerCase().includes(q)
            );
          })
        );
      }
      return list.map((s) => ({
        ...s,
        _count: {
          services: data.services.filter((svc) => svc.serverId === s.id).length,
          networkConfigs: data.networkConfigurations.filter((net) => net.serverId === s.id).length,
          documentation: data.documentations.filter((d) => d.serverId === s.id).length,
        },
        createdBy: data.users.find((u) => u.id === s.createdById) || {
          id: s.createdById,
          name: "Administrator",
          username: "admin",
        },
      }));
    },
    create: async ({ data }: any) => {
      const store = readData();
      const newServer = {
        id: `srv_${Date.now()}`,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      store.servers.unshift(newServer);
      writeData(store);
      return {
        ...newServer,
        createdBy: store.users.find((u) => u.id === newServer.createdById),
      };
    },
    update: async ({ where, data }: any) => {
      const store = readData();
      const idx = store.servers.findIndex((s) => s.id === where.id);
      if (idx === -1) throw new Error("Server not found");
      store.servers[idx] = {
        ...store.servers[idx],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      writeData(store);
      return {
        ...store.servers[idx],
        createdBy: store.users.find((u) => u.id === store.servers[idx].createdById),
      };
    },
    delete: async ({ where }: any) => {
      const store = readData();
      store.servers = store.servers.filter((s) => s.id !== where.id);
      store.services = store.services.filter((svc) => svc.serverId !== where.id);
      store.networkConfigurations = store.networkConfigurations.filter((n) => n.serverId !== where.id);
      writeData(store);
      return { success: true };
    },
    count: async ({ where }: any = {}) => {
      const data = readData();
      let list = [...data.servers];
      if (where?.status) list = list.filter((s) => s.status === where.status);
      return list.length;
    },
  },

  service: {
    findUnique: async ({ where, include }: any) => {
      const data = readData();
      const svc = data.services.find((x) => x.id === where.id);
      if (!svc) return null;
      const res = { ...svc };
      if (include?.server) {
        res.server = data.servers.find((s) => s.id === svc.serverId);
      }
      return res;
    },
    findMany: async ({ where }: any = {}) => {
      const data = readData();
      let list = [...data.services];
      if (where?.serverId) list = list.filter((s) => s.serverId === where.serverId);
      if (where?.status) list = list.filter((s) => s.status === where.status);
      if (where?.OR) {
        list = list.filter((s) =>
          where.OR.some((c: any) => {
            const q = (c.name?.contains || c.protocol?.contains || "").toLowerCase();
            return s.name.toLowerCase().includes(q) || s.protocol.toLowerCase().includes(q);
          })
        );
      }
      return list.map((svc) => ({
        ...svc,
        server: data.servers.find((s) => s.id === svc.serverId) || {
          id: svc.serverId,
          name: "Server",
          hostname: "unknown-host",
          ipAddress: "0.0.0.0",
        },
        createdBy: data.users.find((u) => u.id === svc.createdById) || {
          id: svc.createdById,
          name: "Admin",
          username: "admin",
        },
      }));
    },
    create: async ({ data }: any) => {
      const store = readData();
      const newSvc = {
        id: `svc_${Date.now()}`,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      store.services.unshift(newSvc);
      writeData(store);
      return {
        ...newSvc,
        server: store.servers.find((s) => s.id === newSvc.serverId),
      };
    },
    update: async ({ where, data }: any) => {
      const store = readData();
      const idx = store.services.findIndex((s) => s.id === where.id);
      if (idx === -1) throw new Error("Service not found");
      store.services[idx] = {
        ...store.services[idx],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      writeData(store);
      return {
        ...store.services[idx],
        server: store.servers.find((s) => s.id === store.services[idx].serverId),
      };
    },
    delete: async ({ where }: any) => {
      const store = readData();
      store.services = store.services.filter((s) => s.id !== where.id);
      writeData(store);
      return { success: true };
    },
    count: async ({ where }: any = {}) => {
      const data = readData();
      let list = [...data.services];
      if (where?.status) list = list.filter((s) => s.status === where.status);
      return list.length;
    },
  },

  networkConfiguration: {
    findUnique: async ({ where, include }: any) => {
      const data = readData();
      const net = data.networkConfigurations.find((x) => x.id === where.id);
      if (!net) return null;
      const res = { ...net };
      if (include?.server) {
        res.server = data.servers.find((s) => s.id === net.serverId);
      }
      return res;
    },
    findMany: async ({ where }: any = {}) => {
      const data = readData();
      let list = [...data.networkConfigurations];
      if (where?.serverId) list = list.filter((n) => n.serverId === where.serverId);
      return list.map((n) => ({
        ...n,
        server: data.servers.find((s) => s.id === n.serverId) || {
          id: n.serverId,
          name: "Server",
          hostname: "host",
          ipAddress: n.ipAddress,
        },
        createdBy: data.users.find((u) => u.id === n.createdById),
      }));
    },
    create: async ({ data }: any) => {
      const store = readData();
      const newNet = {
        id: `net_${Date.now()}`,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      store.networkConfigurations.unshift(newNet);
      writeData(store);
      return {
        ...newNet,
        server: store.servers.find((s) => s.id === newNet.serverId),
      };
    },
    update: async ({ where, data }: any) => {
      const store = readData();
      const idx = store.networkConfigurations.findIndex((n) => n.id === where.id);
      if (idx === -1) throw new Error("Network configuration not found");
      store.networkConfigurations[idx] = {
        ...store.networkConfigurations[idx],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      writeData(store);
      return {
        ...store.networkConfigurations[idx],
        server: store.servers.find((s) => s.id === store.networkConfigurations[idx].serverId),
      };
    },
    delete: async ({ where }: any) => {
      const store = readData();
      store.networkConfigurations = store.networkConfigurations.filter((n) => n.id !== where.id);
      writeData(store);
      return { success: true };
    },
  },

  documentation: {
    findUnique: async ({ where, include }: any) => {
      const data = readData();
      const doc = data.documentations.find((x) => x.id === where.id);
      if (!doc) return null;
      const res = { ...doc };
      if (include?.server) {
        res.server = data.servers.find((s) => s.id === doc.serverId);
      }
      if (include?.author) {
        res.author = data.users.find((u) => u.id === doc.authorId);
      }
      return res;
    },
    findMany: async ({ where }: any = {}) => {
      const data = readData();
      let list = [...data.documentations];
      if (where?.category) list = list.filter((d) => d.category === where.category);
      if (where?.serverId) list = list.filter((d) => d.serverId === where.serverId);
      return list.map((d) => ({
        ...d,
        server: data.servers.find((s) => s.id === d.serverId) || null,
        author: data.users.find((u) => u.id === d.authorId) || {
          id: d.authorId,
          name: "Admin",
          username: "admin",
        },
      }));
    },
    create: async ({ data }: any) => {
      const store = readData();
      const newDoc = {
        id: `doc_${Date.now()}`,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      store.documentations.unshift(newDoc);
      writeData(store);
      return {
        ...newDoc,
        author: store.users.find((u) => u.id === newDoc.authorId),
        server: store.servers.find((s) => s.id === newDoc.serverId),
      };
    },
    update: async ({ where, data }: any) => {
      const store = readData();
      const idx = store.documentations.findIndex((d) => d.id === where.id);
      if (idx === -1) throw new Error("Documentation not found");
      store.documentations[idx] = {
        ...store.documentations[idx],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      writeData(store);
      return {
        ...store.documentations[idx],
        author: store.users.find((u) => u.id === store.documentations[idx].authorId),
      };
    },
    delete: async ({ where }: any) => {
      const store = readData();
      store.documentations = store.documentations.filter((d) => d.id !== where.id);
      writeData(store);
      return { success: true };
    },
    count: async () => {
      const data = readData();
      return data.documentations.length;
    },
  },

  activityLog: {
    findMany: async ({ where, take = 50 }: any = {}) => {
      const data = readData();
      let list = [...data.activityLogs];
      if (where?.userId) list = list.filter((a) => a.userId === where.userId);
      if (where?.entity) list = list.filter((a) => a.entity === where.entity);
      return list.slice(0, take).map((a) => ({
        ...a,
        user: data.users.find((u) => u.id === a.userId),
      }));
    },
    create: async ({ data }: any) => {
      const store = readData();
      const newLog = {
        id: `act_${Date.now()}`,
        ...data,
        createdAt: new Date().toISOString(),
      };
      store.activityLogs.unshift(newLog);
      writeData(store);
      return newLog;
    },
    count: async () => {
      const data = readData();
      return data.activityLogs.length;
    },
    deleteMany: async () => {
      const store = readData();
      const initialCount = store.activityLogs.length;
      store.activityLogs = [];
      writeData(store);
      return { count: initialCount };
    },
  },

  file: {
    findMany: async ({ where }: any = {}) => {
      const data = readData();
      let list = [...data.files];
      if (where?.userId) list = list.filter((f) => f.userId === where.userId);
      if (where?.category) list = list.filter((f) => f.category === where.category);
      return list.map((f) => ({
        ...f,
        user: data.users.find((u) => u.id === f.userId),
      }));
    },
    findUnique: async ({ where }: any) => {
      const data = readData();
      const file = data.files.find((f) => f.id === where.id);
      if (!file) return null;
      return {
        ...file,
        user: data.users.find((u) => u.id === file.userId),
      };
    },
    create: async ({ data }: any) => {
      const store = readData();
      const newFile = {
        id: `file_${Date.now()}`,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      store.files.unshift(newFile);
      writeData(store);
      return {
        ...newFile,
        user: store.users.find((u) => u.id === newFile.userId),
      };
    },
    delete: async ({ where }: any) => {
      const store = readData();
      store.files = store.files.filter((f) => f.id !== where.id);
      writeData(store);
      return { success: true };
    },
  },

  fileTransfer: {
    findMany: async ({ where }: any = {}) => {
      const data = readData();
      let list = [...data.fileTransfers];
      if (where?.userId) {
        list = list.filter((ft) => ft.senderId === where.userId || ft.receiverId === where.userId);
      }
      return list;
    },
    findUnique: async ({ where }: any) => {
      const data = readData();
      return data.fileTransfers.find((ft) => ft.id === where.id) || null;
    },
    create: async ({ data }: any) => {
      const store = readData();
      const newTransfer = {
        id: `ft_${Date.now()}`,
        ...data,
        status: data.status || "COMPLETED",
        transferredAt: new Date().toISOString(),
      };
      store.fileTransfers.unshift(newTransfer);
      writeData(store);
      return newTransfer;
    },
    update: async ({ where, data }: any) => {
      const store = readData();
      const idx = store.fileTransfers.findIndex((ft) => ft.id === where.id);
      if (idx === -1) throw new Error("Transfer not found");
      store.fileTransfers[idx] = { ...store.fileTransfers[idx], ...data };
      writeData(store);
      return store.fileTransfers[idx];
    },
    delete: async ({ where }: any) => {
      const store = readData();
      store.fileTransfers = store.fileTransfers.filter((ft) => ft.id !== where.id);
      writeData(store);
      return { success: true };
    },
  },

  mailMessage: {
    findMany: async ({ where }: any = {}) => {
      const data = readData();
      let list = [...data.mailMessages];
      if (where?.recipientId) {
        list = list.filter((m) => m.recipientId === where.recipientId);
      }
      if (where?.senderId) {
        list = list.filter((m) => m.senderId === where.senderId);
      }
      if (where?.userId) {
        list = list.filter((m) => m.recipientId === where.userId || m.senderId === where.userId);
      }
      return list.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
    },
    findUnique: async ({ where }: any) => {
      const data = readData();
      return data.mailMessages.find((m) => m.id === where.id) || null;
    },
    create: async ({ data }: any) => {
      const store = readData();
      const newMail = {
        id: `mail_${Date.now()}`,
        ...data,
        isRead: false,
        sentAt: new Date().toISOString(),
      };
      store.mailMessages.unshift(newMail);
      writeData(store);
      return newMail;
    },
    update: async ({ where, data }: any) => {
      const store = readData();
      const idx = store.mailMessages.findIndex((m) => m.id === where.id);
      if (idx === -1) throw new Error("Message not found");
      store.mailMessages[idx] = { ...store.mailMessages[idx], ...data };
      writeData(store);
      return store.mailMessages[idx];
    },
    delete: async ({ where }: any) => {
      const store = readData();
      store.mailMessages = store.mailMessages.filter((m) => m.id !== where.id);
      writeData(store);
      return { success: true };
    },
    deleteMany: async ({ where }: any = {}) => {
      const store = readData();
      let initialCount = store.mailMessages.length;
      if (!where || Object.keys(where).length === 0) {
        store.mailMessages = [];
      } else {
        store.mailMessages = store.mailMessages.filter((m) => {
          if (where.recipientId && m.recipientId !== where.recipientId) return true;
          if (where.isTrash !== undefined && m.isTrash !== where.isTrash) return true;
          if (where.id && !where.id.in?.includes(m.id)) return true;
          return false; // matches deletion filter
        });
      }
      writeData(store);
      return { count: initialCount - store.mailMessages.length };
    },
  },

  systemSettings: {
    get: async () => {
      const data = readData();
      return data.systemSettings;
    },
    update: async ({ data }: any) => {
      const store = readData();
      store.systemSettings = { ...store.systemSettings, ...data };
      writeData(store);
      return store.systemSettings;
    },
  },

  ticket: {
    findMany: async ({ where, orderBy }: any = {}) => {
      const data = readData();
      let list = [...data.tickets];
      if (where) {
        if (where.authorId) list = list.filter((t) => t.authorId === where.authorId);
        if (where.status) list = list.filter((t) => t.status === where.status);
        if (where.category) list = list.filter((t) => t.category === where.category);
      }
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return list;
    },
    findUnique: async ({ where }: any) => {
      const data = readData();
      return data.tickets.find((t) => t.id === where.id) || null;
    },
    create: async ({ data }: any) => {
      const store = readData();
      const newTicket = {
        id: `ticket_${Date.now()}`,
        ...data,
        status: data.status || "OPEN",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      store.tickets.unshift(newTicket);
      writeData(store);
      return newTicket;
    },
    update: async ({ where, data }: any) => {
      const store = readData();
      const idx = store.tickets.findIndex((t) => t.id === where.id);
      if (idx === -1) throw new Error("Ticket not found");
      store.tickets[idx] = {
        ...store.tickets[idx],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      writeData(store);
      return store.tickets[idx];
    },
    delete: async ({ where }: any) => {
      const store = readData();
      store.tickets = store.tickets.filter((t) => t.id !== where.id);
      store.ticketMessages = store.ticketMessages.filter((m) => m.ticketId !== where.id);
      writeData(store);
      return { success: true };
    },
  },

  ticketMessage: {
    findMany: async ({ where, orderBy }: any = {}) => {
      const data = readData();
      let list = [...data.ticketMessages];
      if (where?.ticketId) {
        list = list.filter((m) => m.ticketId === where.ticketId);
      }
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      return list;
    },
    create: async ({ data }: any) => {
      const store = readData();
      const newMsg = {
        id: `tmsg_${Date.now()}`,
        ...data,
        createdAt: new Date().toISOString(),
      };
      store.ticketMessages.push(newMsg);
      // update ticket's updatedAt
      const tIdx = store.tickets.findIndex((t) => t.id === data.ticketId);
      if (tIdx !== -1) {
        store.tickets[tIdx].updatedAt = new Date().toISOString();
      }
      writeData(store);
      return newMsg;
    },
  },
};
