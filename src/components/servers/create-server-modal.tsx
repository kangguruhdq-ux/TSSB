"use client";

import React, { useState } from "react";
import { X, Server, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ServerType, ServerStatus } from "@/types";

interface CreateServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateServerModal({
  isOpen,
  onClose,
  onCreated,
}: CreateServerModalProps) {
  const [name, setName] = useState("");
  const [hostname, setHostname] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [operatingSystem, setOperatingSystem] = useState("Ubuntu 24.04 LTS");
  const [serverType, setServerType] = useState<ServerType>("WEB");
  const [location, setLocation] = useState("US-East (Virginia)");
  const [status, setStatus] = useState<ServerStatus>("ONLINE");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          hostname,
          ipAddress,
          operatingSystem,
          serverType,
          location,
          status,
          description,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to create server");
        return;
      }

      toast.success("Server provisioned successfully in PostgreSQL!");
      onCreated();
      onClose();
    } catch {
      toast.error("Network communication failure");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900/95 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-200"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Provision New Server</h3>
            <p className="text-xs text-slate-400">Register cluster host in database</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Server Display Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Edge Ingress Node"
                className="w-full h-9 px-3 rounded-lg bg-slate-950 border border-slate-700 focus:border-cyan-500 outline-none text-xs text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Hostname
              </label>
              <input
                type="text"
                required
                value={hostname}
                onChange={(e) => setHostname(e.target.value)}
                placeholder="e.g. serve-client4"
                className="w-full h-9 px-3 rounded-lg bg-slate-950 border border-slate-700 focus:border-cyan-500 outline-none text-xs font-mono text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                IP Address
              </label>
              <input
                type="text"
                required
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                placeholder="e.g. 192.168.1.50"
                className="w-full h-9 px-3 rounded-lg bg-slate-950 border border-slate-700 focus:border-cyan-500 outline-none text-xs font-mono text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Operating System
              </label>
              <input
                type="text"
                required
                value={operatingSystem}
                onChange={(e) => setOperatingSystem(e.target.value)}
                placeholder="e.g. Ubuntu 24.04 LTS"
                className="w-full h-9 px-3 rounded-lg bg-slate-950 border border-slate-700 focus:border-cyan-500 outline-none text-xs text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Server Type
              </label>
              <select
                value={serverType}
                onChange={(e) => setServerType(e.target.value as ServerType)}
                className="w-full h-9 px-2 rounded-lg bg-slate-950 border border-slate-700 focus:border-cyan-500 outline-none text-xs font-mono text-slate-100"
              >
                <option value="WEB">WEB</option>
                <option value="DNS">DNS</option>
                <option value="FILE">FILE</option>
                <option value="MAIL">MAIL</option>
                <option value="DATABASE">DATABASE</option>
                <option value="APPLICATION">APPLICATION</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Initial Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ServerStatus)}
                className="w-full h-9 px-2 rounded-lg bg-slate-950 border border-slate-700 focus:border-cyan-500 outline-none text-xs font-mono text-slate-100"
              >
                <option value="ONLINE">ONLINE (Healthy)</option>
                <option value="MAINTENANCE">MAINTENANCE (Degraded)</option>
                <option value="OFFLINE">OFFLINE (Down)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Location
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Data center / Rack"
                className="w-full h-9 px-3 rounded-lg bg-slate-950 border border-slate-700 focus:border-cyan-500 outline-none text-xs text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Description / Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Infrastructure role details..."
              className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-700 focus:border-cyan-500 outline-none text-xs text-slate-100 resize-none"
            />
          </div>

          <div className="mt-5 flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 text-slate-950 font-bold text-xs shadow-cyan-glow-sm transition-all"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Deploy Server</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
