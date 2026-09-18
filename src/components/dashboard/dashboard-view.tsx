"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Users, Server, Layers, FileText } from "lucide-react";
import { SystemOverviewHeader } from "./system-overview-header";
import { MetricCard } from "./metric-card";
import { ServerStatusTable } from "./server-status-table";
import { InfrastructureFlow } from "@/components/visualizations/infrastructure-flow";
import { NetworkTopology } from "@/components/visualizations/network-topology";
import { UserManagementTable } from "./user-management-table";
import { CreateServerModal } from "@/components/servers/create-server-modal";
import { SessionUser, SafeUser } from "@/types";
import { toast } from "sonner";

interface DashboardViewProps {
  initialUser: SessionUser;
}

export function DashboardView({ initialUser }: DashboardViewProps) {
  const [servers, setServers] = useState<any[]>([]);
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 2,
    onlineServers: "3/5",
    activeServices: 8,
    docCount: "8 docs",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Fetch servers
      const sRes = await fetch("/api/servers");
      const sData = await sRes.json();
      if (sData.success && Array.isArray(sData.data)) {
        setServers(sData.data);

        const onlineCount = sData.data.filter((s: any) => s.status === "ONLINE").length;
        const totalCount = sData.data.length;

        // Count services
        let serviceSum = 0;
        sData.data.forEach((s: any) => {
          serviceSum += s._count?.services || 0;
        });

        // 2. Fetch admin stats if available or user list
        if (initialUser.role === "ADMIN") {
          const statsRes = await fetch("/api/admin/stats");
          const statsJson = await statsRes.json();

          const usersRes = await fetch("/api/admin/users?limit=10");
          const usersJson = await usersRes.json();

          if (usersJson.success && usersJson.data?.users) {
            setUsers(usersJson.data.users);
          }

          if (statsJson.success) {
            const d = statsJson.data;
            setStats({
              totalUsers: d.totalUsers,
              onlineServers: `${d.onlineServers}/${d.totalServers}`,
              activeServices: d.activeServices,
              docCount: `${d.totalDocumentation} docs`,
            });
          }
        } else {
          // Standard user view metrics
          setStats({
            totalUsers: 2,
            onlineServers: `${onlineCount}/${totalCount}`,
            activeServices: serviceSum || 7,
            docCount: `8 docs`,
          });
        }
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      toast.error("Telemetry refresh timeout");
    } finally {
      setIsLoading(false);
    }
  }, [initialUser.role]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Dashboard Header Bar */}
      <SystemOverviewHeader
        onRefresh={fetchDashboardData}
        onCreateServer={() => setIsCreateModalOpen(true)}
        isLoading={isLoading}
      />

      {/* Metric Cards Row (4 cards matching reference image) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="TOTAL USERS"
          value={stats.totalUsers.toLocaleString()}
          subtext="Verified IAM accounts"
          icon={Users}
          trend="+12% this month"
        />

        {/* Card 2: ONLINE SERVERS - Highlighted with Electric Cyan Border & Glow */}
        <MetricCard
          label="ONLINE SERVERS"
          value={stats.onlineServers}
          subtext="Healthy clusters operational"
          icon={Server}
          highlight={true}
        />

        <MetricCard
          label="ACTIVE SERVICES"
          value={stats.activeServices}
          subtext="Ingress proxies & daemons"
          icon={Layers}
          trend="Stable"
        />

        <MetricCard
          label="DOCUMENTATION"
          value={stats.docCount}
          subtext="Runbooks & technical guides"
          icon={FileText}
        />
      </div>

      {/* Middle Row: Server Status Panel (Left) + Infrastructure Flow (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-7 flex flex-col">
          <ServerStatusTable
            servers={servers}
            onRefresh={fetchDashboardData}
            isLoading={isLoading}
          />
        </div>
        <div className="lg:col-span-5 flex flex-col">
          <InfrastructureFlow />
        </div>
      </div>

      {/* Bottom Row: Network Topology (Left) + User Management Table (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-5 flex flex-col">
          <NetworkTopology />
        </div>
        <div className="lg:col-span-7 flex flex-col">
          <UserManagementTable
            users={users.length > 0 ? users : [
              {
                id: initialUser.id,
                name: initialUser.name,
                username: initialUser.username,
                email: initialUser.email,
                role: initialUser.role,
                status: initialUser.status,
                avatarUrl: initialUser.avatarUrl || null,
                bio: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }
            ]}
            onRefresh={fetchDashboardData}
            isAdmin={initialUser.role === "ADMIN"}
          />
        </div>
      </div>

      {/* Create Server Modal */}
      <CreateServerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={fetchDashboardData}
      />
    </div>
  );
}
