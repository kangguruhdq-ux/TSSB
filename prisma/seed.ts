import { PrismaClient, Role, UserStatus, ServerType, ServerStatus, ServiceStatus, DocCategory } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting TSSB database seed...");

  // 1. Clean existing records in reverse dependency order
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
