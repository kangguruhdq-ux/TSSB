import { PrismaClient, Role, UserStatus, ServerType, ServerStatus, ServiceStatus, DocCategory } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting TSSB database seed...");

  // 1. Clean existing records in reverse dependency order
  await prisma.ticketMessage.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.mailMessage.deleteMany();
  await prisma.fileTransfer.deleteMany();
  await prisma.file.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.documentation.deleteMany();
  await prisma.networkConfiguration.deleteMany();
  await prisma.service.deleteMany();
  await prisma.server.deleteMany();
  await prisma.user.deleteMany();

  // 2. Hash passwords
  const adminPasswordHash = await bcrypt.hash("Admin123!", 10);
  const userPasswordHash = await bcrypt.hash("User123!", 10);

  // 3. Create Users
  const admin = await prisma.user.create({
    data: {
      name: "System Administrator",
      username: "admin",
      email: "admin@tssb.local",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      bio: "Lead Infrastructure Architect and System Administrator for TSSB Platform.",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
  });

  const normalUser = await prisma.user.create({
    data: {
      name: "Kaiti Mckin",
      username: "kaiti",
      email: "user@tssb.local",
      passwordHash: userPasswordHash,
      role: Role.USER,
      status: UserStatus.ACTIVE,
      bio: "Junior DevOps engineer managing service configurations and network telemetry.",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
  });

  console.log(`Created admin user: ${admin.email} (Role: ${admin.role})`);
  console.log(`Created demo user: ${normalUser.email} (Role: ${normalUser.role})`);

  // 4. Create 5 Servers matching reference aesthetic
  const server1 = await prisma.server.create({
    data: {
      name: "Web Gateway Alpha",
      hostname: "serve-client1",
      ipAddress: "122.188.123.45",
      operatingSystem: "Ubuntu 24.04 LTS",
      serverType: ServerType.WEB,
      location: "US-East (Virginia - Rack A1)",
      status: ServerStatus.ONLINE,
      description: "Edge reverse proxy and SSL termination server for incoming web traffic.",
      createdById: admin.id,
    },
  });

  const server2 = await prisma.server.create({
    data: {
      name: "Application Node 01",
      hostname: "serve-client2",
      ipAddress: "122.128.18.238",
      operatingSystem: "Debian 12 Bookworm",
      serverType: ServerType.APPLICATION,
      location: "US-East (Virginia - Rack A2)",
      status: ServerStatus.MAINTENANCE,
      description: "Primary microservices and API application runner node.",
      createdById: admin.id,
    },
  });

  const server3 = await prisma.server.create({
    data: {
      name: "Database Primary Cluster",
      hostname: "db-cluster-beta",
      ipAddress: "10.0.4.15",
      operatingSystem: "Rocky Linux 9",
      serverType: ServerType.DATABASE,
      location: "US-East (Internal Secure Enclave)",
      status: ServerStatus.ONLINE,
      description: "High-performance transactional database node running PostgreSQL.",
      createdById: admin.id,
    },
  });

  const server4 = await prisma.server.create({
    data: {
      name: "Authoritative DNS Resolver",
      hostname: "serve-client3",
      ipAddress: "198.51.100.12",
      operatingSystem: "Alpine Linux 3.20",
      serverType: ServerType.DNS,
      location: "EU-West (Frankfurt - Zone 1)",
      status: ServerStatus.ONLINE,
      description: "Primary internal and external authoritative DNS routing name server.",
      createdById: normalUser.id,
    },
  });

  const server5 = await prisma.server.create({
    data: {
      name: "Mail Relay Gateway",
      hostname: "mail-edge-01",
      ipAddress: "203.0.113.88",
      operatingSystem: "Ubuntu 22.04 LTS",
      serverType: ServerType.MAIL,
      location: "AP-Southeast (Singapore - DC2)",
      status: ServerStatus.OFFLINE,
      description: "Outbound transactional email routing and spam filtering relay node.",
      createdById: admin.id,
    },
  });

  console.log("Created 5 infrastructure servers.");

  // 5. Create 10 Services
  const servicesData = [
    {
      name: "Nginx Ingress Proxy",
      serverId: server1.id,
      port: 443,
      protocol: "TCP/HTTPS",
      version: "1.26.1",
      status: ServiceStatus.ACTIVE,
      description: "Handles HTTP/3 and HTTPS ingress routing with TLS certbot certificates.",
      createdById: admin.id,
    },
    {
      name: "OpenSSH Daemon",
      serverId: server1.id,
      port: 22,
      protocol: "TCP",
      version: "9.6p1",
      status: ServiceStatus.ACTIVE,
      description: "Hardened SSH daemon accepting ed25519 key authentication only.",
      createdById: admin.id,
    },
    {
      name: "Next.js Application Engine",
      serverId: server2.id,
      port: 3000,
      protocol: "HTTP",
      version: "15.2.1",
      status: ServiceStatus.DEGRADED,
      description: "Node.js cluster executing server-side rendering and API actions.",
      createdById: admin.id,
    },
    {
      name: "Redis Session Cache",
      serverId: server2.id,
      port: 6379,
      protocol: "TCP",
      version: "7.2.4",
      status: ServiceStatus.ACTIVE,
      description: "In-memory caching and session store with persistent RDB snapshots.",
      createdById: admin.id,
    },
    {
      name: "PostgreSQL Database Engine",
      serverId: server3.id,
      port: 5432,
      protocol: "TCP",
      version: "16.2",
      status: ServiceStatus.ACTIVE,
      description: "Primary relational database storing system tables, users, and audit records.",
      createdById: admin.id,
    },
    {
      name: "PgBouncer Connection Pooler",
      serverId: server3.id,
      port: 6432,
      protocol: "TCP",
      version: "1.22.0",
      status: ServiceStatus.ACTIVE,
      description: "Lightweight connection pooler managing serverless transaction queries.",
      createdById: admin.id,
    },
    {
      name: "BIND9 DNS Nameserver",
      serverId: server4.id,
      port: 53,
      protocol: "UDP/TCP",
      version: "9.18.24",
      status: ServiceStatus.ACTIVE,
      description: "Domain Name System daemon serving zone records and DNSSEC validation.",
      createdById: normalUser.id,
    },
    {
      name: "Postfix SMTP Relay",
      serverId: server5.id,
      port: 25,
      protocol: "TCP",
      version: "3.8.1",
      status: ServiceStatus.STOPPED,
      description: "Mail transfer agent pending scheduled security patch installation.",
      createdById: admin.id,
    },
    {
      name: "Dovecot IMAP Server",
      serverId: server5.id,
      port: 993,
      protocol: "TCP/SSL",
      version: "2.3.21",
      status: ServiceStatus.STOPPED,
      description: "Secure mailbox retrieval server currently offline for maintenance.",
      createdById: admin.id,
    },
    {
      name: "Prometheus Node Exporter",
      serverId: server1.id,
      port: 9100,
      protocol: "HTTP",
      version: "1.7.0",
      status: ServiceStatus.ACTIVE,
      description: "Telemetry collector exposing CPU, RAM, disk, and network interface metrics.",
      createdById: admin.id,
    },
  ];

  for (const s of servicesData) {
    await prisma.service.create({ data: s });
  }
  console.log("Created 10 services.");

  // 6. Create 5 Network Configurations
  const networkData = [
    {
      serverId: server1.id,
      interfaceName: "eth0",
      ipAddress: "122.188.123.45",
      subnetMask: "255.255.255.0",
      gateway: "122.188.123.1",
      dnsPrimary: "1.1.1.1",
      dnsSecondary: "8.8.8.8",
      vlan: 100,
      description: "Primary public uplink for edge ingress traffic.",
      createdById: admin.id,
    },
    {
      serverId: server2.id,
      interfaceName: "ens192",
      ipAddress: "122.128.18.238",
      subnetMask: "255.255.255.192",
      gateway: "122.128.18.193",
      dnsPrimary: "1.1.1.1",
      dnsSecondary: "1.0.0.1",
      vlan: 120,
      description: "DMZ application interface connecting to frontend proxy.",
      createdById: admin.id,
    },
    {
      serverId: server3.id,
      interfaceName: "bond0.200",
      ipAddress: "10.0.4.15",
      subnetMask: "255.255.248.0",
      gateway: "10.0.4.1",
      dnsPrimary: "10.0.0.2",
      dnsSecondary: "10.0.0.3",
      vlan: 200,
      description: "Isolated database VLAN with 10GbE bonded NIC aggregation.",
      createdById: admin.id,
    },
    {
      serverId: server4.id,
      interfaceName: "eth0",
      ipAddress: "198.51.100.12",
      subnetMask: "255.255.255.0",
      gateway: "198.51.100.1",
      dnsPrimary: "127.0.0.1",
      dnsSecondary: "9.9.9.9",
      vlan: 53,
      description: "Anycast public interface for DNS query routing.",
      createdById: normalUser.id,
    },
    {
      serverId: server5.id,
      interfaceName: "eth0",
      ipAddress: "203.0.113.88",
      subnetMask: "255.255.255.240",
      gateway: "203.0.113.81",
      dnsPrimary: "1.1.1.1",
      dnsSecondary: "8.8.4.4",
      vlan: 25,
      description: "Reverse-DNS PTR verified interface for mail exchange.",
      createdById: admin.id,
    },
  ];

  for (const net of networkData) {
    await prisma.networkConfiguration.create({ data: net });
  }
  console.log("Created 5 network configurations.");

  // 7. Create 8 Documentation Records
  const docData = [
    {
      title: "Ubuntu Server Installation and Base Hardening Guide",
      category: DocCategory.INSTALLATION,
      content:
        "### Initial Provisioning\n\n1. Boot the official Ubuntu 24.04 LTS minimal ISO image.\n2. Partition disk with LVM over LUKS encryption for at-rest data protection.\n3. Configure static IP addressing on interface eth0.\n4. Create non-root administration account with sudo access.\n5. Disable root password authentication via OpenSSH config.",
      serverId: server1.id,
      authorId: admin.id,
    },
    {
      title: "Nginx Reverse Proxy & HTTP/3 Configuration Protocol",
      category: DocCategory.CONFIGURATION,
      content:
        "### Ingress Architecture\n\n- Deploy Nginx with HTTP/2 and HTTP/3 QUIC support.\n- Configure upstream proxy pass to Next.js server on port 3000.\n- Enable Brotli and Gzip compression for static assets.\n- Enforce HSTS (Strict-Transport-Security) header with 2-year max-age.\n- Set client body buffer limits to mitigate DDoS vectors.",
      serverId: server1.id,
      authorId: admin.id,
    },
    {
      title: "Isolated Database VLAN 200 Security Segmentation",
      category: DocCategory.NETWORKING,
      content:
        "### Network Segregation\n\nDatabase servers reside exclusively inside isolated VLAN 200 without direct public internet exposure. Route ingress traffic exclusively through the internal load balancer and pgBouncer proxy.\n\nFirewall rules restrict inbound port 5432 to whitelisted application node IP blocks.",
      serverId: server3.id,
      authorId: admin.id,
    },
    {
      title: "Zero-Trust SSH Access & ED25519 Key Enactment",
      category: DocCategory.SECURITY,
      content:
        "### SSH Hardening Checklist\n\n- PermitRootLogin no\n- PasswordAuthentication no\n- KbdInteractiveAuthentication no\n- MaxAuthTries 3\n- X11Forwarding no\n- AllowAgentForwarding no\n- Implement Fail2ban with 5-minute jail for failed attempts.",
      serverId: server1.id,
      authorId: admin.id,
    },
    {
      title: "High-Availability PostgreSQL Failover & Backup Strategy",
      category: DocCategory.MAINTENANCE,
      content:
        "### Automated Backup Runbook\n\n1. Continuous WAL archiving to S3-compatible encrypted cold storage.\n2. Nightly physical pg_basebackup with 30-day retention policy.\n3. Weekly automated test restoration in staging environment.\n4. Latency monitoring via Prometheus PostgreSQL exporter alerts.",
      serverId: server3.id,
      authorId: admin.id,
    },
    {
      title: "BIND9 DNS Authoritative Zone Setup & DNSSEC Validation",
      category: DocCategory.CONFIGURATION,
      content:
        "### DNS Zone Administration\n\nConfigure authoritative zone records for primary domain. Generate KSK (Key Signing Key) and ZSK (Zone Signing Key) using algorithm 13 (ECDSA P-256 with SHA-256). Submit DS records to parent registrar.",
      serverId: server4.id,
      authorId: normalUser.id,
    },
    {
      title: "Troubleshooting High Memory Utilization on Node Runners",
      category: DocCategory.TROUBLESHOOTING,
      content:
        "### Diagnostic Workflow\n\n1. Inspect system memory usage with `free -m` and `htop`.\n2. Inspect top consumer processes with `ps aux --sort=-%mem | head -n 10`.\n3. Generate heap snapshot using Node.js inspector protocol.\n4. Check kernel dmesg logs for OOM killer trigger entries.\n5. Adjust max-old-space-size parameters in systemd service definition.",
      serverId: server2.id,
      authorId: normalUser.id,
    },
    {
      title: "Mail Server Postfix SPF, DKIM, and DMARC Policy Enactment",
      category: DocCategory.SECURITY,
      content:
        "### Email Deliverability & Anti-Spoofing\n\n- Deploy OpenDKIM milter listening on localhost socket.\n- Publish TXT record for SPF: `v=spf1 mx ip4:203.0.113.88 ~all`.\n- Configure DMARC with rejection policy and aggregate forensic reporting email.",
      serverId: server5.id,
      authorId: admin.id,
    },
  ];

  for (const doc of docData) {
    await prisma.documentation.create({ data: doc });
  }
  console.log("Created 8 documentation records.");

  // 8. Create 20 Activity Logs
  const activities = [
    { action: "USER_REGISTERED", entity: "USER", entityId: admin.id, description: "Administrator account provisioned in primary auth realm.", ipAddress: "192.168.1.100", userId: admin.id },
    { action: "USER_LOGIN", entity: "AUTH", entityId: admin.id, description: "Administrator logged in via interactive swap-card portal.", ipAddress: "192.168.1.100", userId: admin.id },
    { action: "SERVER_CREATED", entity: "SERVER", entityId: server1.id, description: "Provisioned edge server serve-client1 with Ubuntu 24.04.", ipAddress: "192.168.1.100", userId: admin.id },
    { action: "SERVICE_CREATED", entity: "SERVICE", description: "Configured Nginx reverse proxy service on port 443.", ipAddress: "192.168.1.100", userId: admin.id },
    { action: "SERVICE_CREATED", entity: "SERVICE", description: "Configured hardened OpenSSH daemon on port 22.", ipAddress: "192.168.1.100", userId: admin.id },
    { action: "NETWORK_CREATED", entity: "NETWORK", description: "Bound interface eth0 with public IP 122.188.123.45.", ipAddress: "192.168.1.100", userId: admin.id },
    { action: "SERVER_CREATED", entity: "SERVER", entityId: server2.id, description: "Provisioned application server serve-client2.", ipAddress: "192.168.1.100", userId: admin.id },
    { action: "SERVICE_CREATED", entity: "SERVICE", description: "Configured Next.js application runner on port 3000.", ipAddress: "192.168.1.100", userId: admin.id },
    { action: "SERVICE_CREATED", entity: "SERVICE", description: "Initialized Redis memory cache instance on port 6379.", ipAddress: "192.168.1.100", userId: admin.id },
    { action: "SERVER_CREATED", entity: "SERVER", entityId: server3.id, description: "Provisioned database cluster node db-cluster-beta.", ipAddress: "192.168.1.100", userId: admin.id },
    { action: "SERVICE_CREATED", entity: "SERVICE", description: "Configured PostgreSQL 16 server on port 5432.", ipAddress: "192.168.1.100", userId: admin.id },
    { action: "NETWORK_CREATED", entity: "NETWORK", description: "Allocated bonded interface bond0.200 to VLAN 200.", ipAddress: "192.168.1.100", userId: admin.id },
    { action: "DOCUMENTATION_CREATED", entity: "DOCUMENTATION", description: "Published Base Hardening Guide for Ubuntu 24.04.", ipAddress: "192.168.1.100", userId: admin.id },
    { action: "USER_REGISTERED", entity: "USER", entityId: normalUser.id, description: "User Kaiti Mckin created account.", ipAddress: "192.168.1.105", userId: normalUser.id },
    { action: "SERVER_CREATED", entity: "SERVER", entityId: server4.id, description: "Registered authoritative DNS server serve-client3.", ipAddress: "192.168.1.105", userId: normalUser.id },
    { action: "SERVICE_CREATED", entity: "SERVICE", description: "Started BIND9 nameserver on UDP/TCP port 53.", ipAddress: "192.168.1.105", userId: normalUser.id },
    { action: "DOCUMENTATION_CREATED", entity: "DOCUMENTATION", description: "Published BIND9 DNSSEC configuration instructions.", ipAddress: "192.168.1.105", userId: normalUser.id },
    { action: "SERVER_CREATED", entity: "SERVER", entityId: server5.id, description: "Registered mail edge server mail-edge-01.", ipAddress: "192.168.1.100", userId: admin.id },
    { action: "SERVER_UPDATED", entity: "SERVER", entityId: server2.id, description: "Placed serve-client2 into maintenance mode for system patching.", ipAddress: "192.168.1.100", userId: admin.id },
    { action: "SERVER_UPDATED", entity: "SERVER", entityId: server5.id, description: "Stopped mail services pending DNS PTR record propagation.", ipAddress: "192.168.1.100", userId: admin.id },
  ];

  for (const act of activities) {
    await prisma.activityLog.create({ data: act });
  }
  console.log("Created 20 audit activity logs.");

  // 9. Create System Settings
  await prisma.systemSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      platformName: "TSSB Infrastructure Platform",
      maintenanceMode: false,
      allowRegistration: true,
      loginSuspended: false,
      loginSuspensionMessage: "Akses login pengguna saat ini ditangguhkan sementara oleh Administrator untuk pemeliharaan sistem. Silakan coba lagi nanti.",
      sessionTimeoutMinutes: 60,
      maxUploadSizeBytes: 104857600,
      announcementText: "System operational. All 5 cluster servers and network routes are active.",
      showAnnouncement: true,
      ftpPort: 21,
      smtpPort: 587,
      imapPort: 993,
      storageQuotaDefaultMb: 10240,
      lastBackupAt: new Date("2026-09-18T06:00:00Z"),
    },
    update: {},
  });
  console.log("Created system settings.");

  // 10. Create Default Files
  const file1 = await prisma.file.create({
    data: {
      userId: admin.id,
      name: "nginx.conf.backup",
      size: 14500,
      mimeType: "text/plain",
      category: "CONFIG",
      description: "Production reverse proxy routing configuration for edge gateway.",
      content: "events { worker_connections 1024; }\nhttp {\n  upstream backend { server 122.128.18.238:3000; }\n  server {\n    listen 80; server_name tssb.local;\n    return 301 https://$host$request_uri;\n  }\n  server {\n    listen 443 ssl;\n    server_name tssb.local;\n    ssl_certificate /etc/ssl/certs/tssb.pem;\n    location / { proxy_pass http://backend; }\n  }\n}",
    },
  });

  await prisma.file.create({
    data: {
      userId: admin.id,
      name: "vlan_topology_specs.pdf",
      size: 251000,
      mimeType: "application/pdf",
      category: "ARCHIVE",
      description: "Network architecture blue-print and 802.1Q trunking specifications.",
      content: "[Binary PDF Specification Content - TSSB Multi-VLAN Topology v2.4]",
    },
  });

  await prisma.file.create({
    data: {
      userId: admin.id,
      name: "ssl_wildcard_cert.pem",
      size: 4920,
      mimeType: "text/plain",
      category: "CERTIFICATE",
      description: "RSA 4096-bit wildcard public certificate (*.tssb.local).",
      content: "-----BEGIN CERTIFICATE-----\nMIIDXTCCAkWgAwIBAgIUW6o1Q8L7WjFz583TSSBPROD1001...\n-----END CERTIFICATE-----",
    },
  });

  await prisma.file.create({
    data: {
      userId: normalUser.id,
      name: "database_migration_v2.sql",
      size: 70144,
      mimeType: "text/plain",
      category: "SCRIPT",
      description: "DDL indexes and foreign keys migration script for PostgreSQL.",
      content: "-- Migration: V2__optimize_indexes.sql\nCREATE INDEX IF NOT EXISTS idx_services_server_id ON services(server_id);\nCREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);",
    },
  });

  await prisma.file.create({
    data: {
      userId: normalUser.id,
      name: "system_health_audit.log",
      size: 18840,
      mimeType: "text/plain",
      category: "LOG",
      description: "Automated cron output: memory utilization and packet drop rates.",
      content: "[2026-09-18 00:00:01] INFO [cron]: Running automated telemetry sweep\n[2026-09-18 00:00:02] INFO [cron]: CPU avg: 14.2% | RAM: 38.6% | Disk: 42.1%\n[2026-09-18 00:00:03] SUCCESS: All 5 servers responding within 1.2ms latency.",
    },
  });
  console.log("Created 5 storage files.");

  // 11. Create File Transfers
  await prisma.fileTransfer.create({
    data: {
      senderId: admin.id,
      senderName: admin.name,
      senderUsername: admin.username,
      receiverId: normalUser.id,
      receiverName: normalUser.name,
      receiverUsername: normalUser.username,
      fileName: "nginx.conf.backup",
      fileSize: 14500,
      protocol: "SFTP",
      port: 22,
      status: "COMPLETED",
      note: "Please verify upstream proxy directives before evening maintenance.",
    },
  });

  await prisma.fileTransfer.create({
    data: {
      senderId: normalUser.id,
      senderName: normalUser.name,
      senderUsername: normalUser.username,
      receiverId: admin.id,
      receiverName: admin.name,
      receiverUsername: admin.username,
      fileName: "system_health_audit.log",
      fileSize: 18840,
      protocol: "FTP",
      port: 21,
      status: "COMPLETED",
      note: "Weekly audit log exported from Prometheus daemon.",
    },
  });
  console.log("Created 2 file transfers.");

  // 12. Create Mail Messages
  await prisma.mailMessage.create({
    data: {
      senderId: admin.id,
      senderName: admin.name,
      senderEmail: admin.email,
      recipientId: normalUser.id,
      recipientName: normalUser.name,
      recipientEmail: normalUser.email,
      subject: "Scheduled Network Maintenance Window (VLAN 30)",
      body: "Hello Kaiti,\n\nPlease be advised that the authoritative DNS node (serve-client3) will undergo security patching tonight at 02:00 UTC. Ensure any ongoing service migrations on VLAN 30 are concluded beforehand.\n\nRegards,\nSystem Administrator",
      priority: "HIGH",
      status: "DELIVERED",
      isRead: true,
      hasAttachment: true,
      attachmentName: "nginx.conf.backup",
    },
  });

  await prisma.mailMessage.create({
    data: {
      senderId: normalUser.id,
      senderName: normalUser.name,
      senderEmail: normalUser.email,
      recipientId: admin.id,
      recipientName: admin.name,
      recipientEmail: admin.email,
      subject: "Re: Scheduled Network Maintenance Window (VLAN 30)",
      body: "Acknowledged. All zone transfer scripts have been verified and backup routes in VLAN 10 are primed for failover.\n\nThank you,\nKaiti Mckin",
      priority: "NORMAL",
      status: "DELIVERED",
      isRead: false,
      hasAttachment: false,
    },
  });

  await prisma.mailMessage.create({
    data: {
      senderId: admin.id,
      senderName: admin.name,
      senderEmail: admin.email,
      recipientId: normalUser.id,
      recipientName: normalUser.name,
      recipientEmail: normalUser.email,
      subject: "FTP Quota Increased & vsftpd Daemon Operational",
      body: "Kaiti, your storage quota has been increased to 50 GB for cluster runbooks. The new vsftpd service instance on server-client2 is operational on port 21.\n\nBest,\nAdmin",
      priority: "NORMAL",
      status: "DELIVERED",
      isRead: true,
      hasAttachment: false,
    },
  });
  console.log("Created 3 email messages.");

  // 13. Create Tickets & Messages
  const ticket1 = await prisma.ticket.create({
    data: {
      title: "DNS Zone Synchronization Degraded on Secondary Resolver",
      category: "BUG",
      priority: "HIGH",
      status: "IN_PROGRESS",
      authorId: normalUser.id,
      authorName: normalUser.name,
      authorUsername: normalUser.username,
      authorAvatar: normalUser.avatarUrl,
      assignedTo: admin.name,
      description: "Zone transfer AXFR for tssb.local timed out between ns1 and ns2. BIND9 error indicates transfer refusal.",
    },
  });

  await prisma.ticketMessage.create({
    data: {
      ticketId: ticket1.id,
      authorId: normalUser.id,
      authorName: normalUser.name,
      authorUsername: normalUser.username,
      authorRole: normalUser.role,
      authorAvatar: normalUser.avatarUrl,
      message: "Here is the error log when running rndc reload tssb.local: 'transfer of tssb.local/IN from 198.51.100.12#53: failed while receiving responses: REFUSED'.",
    },
  });

  await prisma.ticketMessage.create({
    data: {
      ticketId: ticket1.id,
      authorId: admin.id,
      authorName: admin.name,
      authorUsername: admin.username,
      authorRole: admin.role,
      authorAvatar: admin.avatarUrl,
      message: "Investigating named.conf.options now. Updating allow-transfer ACL to include the secondary subnet. Stand by.",
    },
  });

  const ticket2 = await prisma.ticket.create({
    data: {
      title: "Storage Pool High Watermark on Application Node 01",
      category: "SERVER_INCIDENT",
      priority: "NORMAL",
      status: "OPEN",
      authorId: normalUser.id,
      authorName: normalUser.name,
      authorUsername: normalUser.username,
      authorAvatar: normalUser.avatarUrl,
      assignedTo: null,
      description: "Docker build caches on serve-client2 are exceeding recommended threshold. Storage quota alerts triggered.",
    },
  });

  await prisma.ticketMessage.create({
    data: {
      ticketId: ticket2.id,
      authorId: normalUser.id,
      authorName: normalUser.name,
      authorUsername: normalUser.username,
      authorRole: normalUser.role,
      authorAvatar: normalUser.avatarUrl,
      message: "Docker build caches on serve-client2 are exceeding recommended threshold. Storage quota alerts triggered.",
    },
  });
  console.log("Created 2 tickets with conversation history.");

  console.log("Database seed completed successfully.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
