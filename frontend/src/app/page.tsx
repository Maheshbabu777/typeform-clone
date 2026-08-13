"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { 
  Plus, 
  Search, 
  ChevronDown, 
  List, 
  Grid as GridIcon, 
  MoreHorizontal, 
  UserPlus, 
  Settings,
  HelpCircle,
  Menu,
  X
} from "lucide-react";
import { toast } from "sonner";
import { listForms } from "@/lib/api-creator";
import { FormSummary } from "@/lib/types";
import { FormSearchTrie } from "@/lib/trie";
import { FormCard } from "@/components/dashboard/form-card";
import { FormListItem } from "@/components/dashboard/form-list-item";
import { CreateFormModal } from "@/components/dashboard/create-form-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ViewMode = "list" | "grid";
type SortOption = "date_desc" | "date_asc" | "name_asc";

export default function DashboardPage() {
  const [forms, setForms] = useState<FormSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  useEffect(() => {
    const savedMode = localStorage.getItem("typeform_view_mode");
    if (savedMode === "grid") {
      setViewMode("grid");
    }
  }, []);

  const handleSetViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem("typeform_view_mode", mode);
  };

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("date_desc");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPrivateExpanded, setIsPrivateExpanded] = useState(true);

  const handleDummyClick = (featureName: string) => {
    toast(`"${featureName}" coming soon!`, {
      description: "This feature is a placeholder and it's coming soon",
    });
  };

  const fetchForms = async () => {
    try {
      const data = await listForms();
      setForms(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const sortedForms = useMemo(() => {
    let filteredForms = [...forms];
    
    // Apply Trie Search if there is a query
    if (searchQuery.trim()) {
      const trie = new FormSearchTrie();
      forms.forEach(f => trie.insert(f.title, f.id));
      const matchIds = trie.search(searchQuery);
      filteredForms = forms.filter(f => matchIds.has(f.id));
    }

    return filteredForms.sort((a, b) => {
      // Reversed logic as requested by user
      if (sortBy === "date_desc") {
        return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
      }
      if (sortBy === "date_asc") {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
      if (sortBy === "name_asc") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [forms, sortBy, searchQuery]);

  return (
    <div className="flex min-h-screen flex-col bg-[#f6f6f6] font-sans">
      {/* Global Top Nav (App Shell) */}
      <header className="flex h-14 items-center justify-between border-b border-[#e6e6e6] bg-white px-4 relative z-30">
        <div className="flex items-center gap-2">
          <button 
            className="md:hidden p-1 mr-2 text-gray-500 hover:bg-gray-100 rounded"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#d85d5d] text-sm font-semibold text-white">
            M
          </div>
          <button className="flex items-center gap-1 text-sm font-medium text-[#262627] hover:bg-gray-50 px-2 py-1 rounded max-w-[150px] sm:max-w-xs truncate">
            <span className="truncate">maheshbabuvishnumolakala</span>
            <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
          </button>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 text-sm font-medium text-[#262627]">
          <button 
            onClick={() => handleDummyClick("Integrations")}
            className="hidden sm:flex items-center gap-2 hover:bg-gray-50 px-2 py-1 rounded"
          >
            <Settings className="h-4 w-4" /> Integrations
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-gray-500 hover:text-gray-700 p-1 outline-none">
                <HelpCircle className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="cursor-pointer" onClick={() => handleDummyClick("Help Center")}>Help Center</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => handleDummyClick("Community")}>Community</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => handleDummyClick("Keyboard shortcuts")}>Keyboard shortcuts</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fbd9e2] text-xs font-semibold text-[#8c3b52] flex-shrink-0">
            MV
          </div>
        </div>
      </header>

      {/* Main App Area */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/20 z-20 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          absolute md:static inset-y-0 left-0 z-20
          w-64 flex-shrink-0 border-r border-[#e6e6e6] bg-white flex flex-col justify-between
          transform transition-transform duration-200 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}>
          <div>
            <div className="p-4 space-y-4">
              <button
                onClick={() => {
                  setIsCreateModalOpen(true);
                  setIsSidebarOpen(false);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-[#2b262d] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black"
              >
                <Plus className="h-4 w-4" />
                Create form
              </button>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-md border border-transparent bg-gray-50 py-2 pl-9 pr-4 text-sm outline-none transition-colors focus:border-gray-300 focus:bg-white"
                />
              </div>
            </div>

            <div className="px-2 mt-4 space-y-1">
              <div className="flex items-center justify-between rounded-md px-3 py-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <GridIcon className="h-4 w-4" />
                  Workspace
                </div>
              </div>

              <div className="pl-6 space-y-1">
                <button 
                  onClick={() => setIsPrivateExpanded(!isPrivateExpanded)}
                  className="flex w-full items-center justify-between rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Private
                  <ChevronDown className={`h-3 w-3 text-gray-400 transition-transform ${isPrivateExpanded ? "" : "-rotate-90"}`} />
                </button>
                
                {isPrivateExpanded && (
                  <button className="flex w-full items-center justify-between rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-[#262627]">
                    My workspace
                    <span className="text-xs text-gray-500">{forms.length}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Workspace Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto px-4 sm:px-8 py-6">
          
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#e6e6e6] pb-4 gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-xl sm:text-2xl font-light tracking-tight text-[#262627] truncate">
                My workspace
              </h1>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hidden sm:block rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 outline-none">
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem className="cursor-pointer" onClick={() => handleDummyClick("Workspace settings")}>Workspace settings</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => handleDummyClick("Manage members")}>Manage members</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50" onClick={() => handleDummyClick("Delete workspace")}>Delete workspace</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <button 
                onClick={() => handleDummyClick("Invite")}
                className="hidden sm:flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                Invite
              </button>
            </div>

            <div className="flex items-center gap-4 self-end sm:self-auto">
              <div className="relative">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 outline-none">
                      {sortBy === "date_desc" && "Date created"}
                      {sortBy === "date_asc" && "Oldest first"}
                      {sortBy === "name_asc" && "Alphabetical"}
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => setSortBy("date_desc")}>
                      Date created
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("date_asc")}>
                      Oldest first
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("name_asc")}>
                      Alphabetical
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="flex items-center rounded-md border border-[#e6e6e6] bg-white p-0.5 shadow-sm">
                <button 
                  onClick={() => handleSetViewMode("list")}
                  className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                    viewMode === "list" ? "bg-gray-100 text-[#262627]" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <List className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">List</span>
                </button>
                <button 
                  onClick={() => handleSetViewMode("grid")}
                  className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                    viewMode === "grid" ? "bg-gray-100 text-[#262627]" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <GridIcon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Grid</span>
                </button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-500" />
            </div>
          ) : forms.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <p className="mb-4 text-gray-500">No forms yet</p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 rounded-md bg-[#2b262d] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-black"
              >
                <Plus className="h-4 w-4" />
                Create form
              </button>
            </div>
          ) : viewMode === "list" ? (
            <div className="w-full overflow-x-auto no-scrollbar pb-4">
              <div className="min-w-[768px]">
                <div className="flex items-center justify-between px-4 py-2 text-xs font-medium text-gray-400 mb-2">
                  <div className="w-[40%]"></div>
                  <div className="flex flex-1 items-center justify-between">
                    <div className="w-20 text-center">Responses</div>
                    <div className="w-24 text-center">Completed</div>
                    <div className="w-32 text-center">Updated</div>
                    <div className="w-24 text-center">Integrations</div>
                    <div className="w-12"></div>
                  </div>
                </div>
                <div className="space-y-3">
                  {sortedForms.map((form) => (
                    <FormListItem key={form.id} form={form} onUpdate={fetchForms} />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sortedForms.map((form) => (
                <FormCard key={form.id} form={form} onUpdate={fetchForms} />
              ))}
            </div>
          )}

        </main>
      </div>

      <CreateFormModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </div>
  );
}
