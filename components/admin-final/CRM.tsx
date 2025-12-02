
import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, Phone, Mail, Clock, MapPin, DollarSign, Home, CheckCircle, 
  ChevronRight, Search, Play, Pause, X, Send, PhoneIncoming, 
  PhoneMissed, Voicemail, LayoutDashboard, Calendar as CalendarIcon, FileText, 
  PieChart, Settings, Inbox as InboxIcon, Briefcase, Megaphone, Receipt,
  Menu, ChevronLeft, ChevronDown, Wrench, HardHat, Bell, LogOut, Shield,
  Plus, Filter, Download, ArrowUpRight, ArrowDownLeft, AlertCircle, File, Image as ImageIcon,
  MessageSquare, BarChart3, Target, Bot, Users, CheckSquare, CalendarDays, Mic, Save
} from 'lucide-react';
import { Lead, Property, User, Ticket, Invoice, AgentPersona, UserRole, Document, Task } from '../../types-admin-final';
import { MOCK_NOTIFICATIONS } from '../../constants-admin-final';
import { db } from '../../services/admin-final/db';

import DashboardView from './crm/DashboardView';
import AgentConfigView from './crm/AgentConfigView';
import InboxView from './crm/InboxView';
import MarketingView from './crm/MarketingView';
import AnalyticsView from './crm/AnalyticsView';
import MaintenanceView from './crm/MaintenanceView';
import FinanceView from './crm/FinanceView';
import CalendarView from './crm/CalendarView';
import DocumentsView from './crm/DocumentsView';
import TasksView from './crm/TasksView';
import LeadsView from './crm/LeadsView';
import PropertiesView from './crm/PropertiesView';
import DetailPane from './crm/DetailPane';

interface CRMProps {
  leads: Lead[];
  properties: Property[];
  onSelectLead: (lead: Lead | null) => void;
  selectedLeadId: string | null;
  onUpdateLead: (lead: Lead) => void;
  currentUser: User;
  onLogout: () => void;
  agentPersona: AgentPersona;
  onUpdateAgentPersona: (persona: AgentPersona) => void;
  onSwitchUser: (role: UserRole) => void;
  tasks: Task[];
  onUpdateTask: (task: Task) => void;
  agents: AgentPersona[];
  onAgentsChange: (agents: AgentPersona[]) => void;
}

type TabType = 'dashboard' | 'leads' | 'properties' | 'notifications' | 'calendar' | 'documents' | 'finance' | 'marketing' | 'analytics' | 'settings' | 'maintenance' | 'requests' | 'my-home' | 'jobs' | 'schedule' | 'invoices' | 'agent-config' | 'inbox' | 'tasks';

const CRM: React.FC<CRMProps> = ({ 
    leads, properties, onSelectLead, selectedLeadId, onUpdateLead, currentUser, onLogout,
    agentPersona, onUpdateAgentPersona, onSwitchUser, tasks, onUpdateTask, agents, onAgentsChange
}) => {
  const [tab, setTab] = useState<TabType>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  
  useEffect(() => {
    // Reset to dashboard when user changes to prevent dead tabs
    setTab('dashboard');
  }, [currentUser.role]);

  useEffect(() => {
    const loadData = async () => {
        const t = await db.getTickets();
        setTickets(t);
        setInvoices([
            { id: '1', amount: 1200, status: 'PAID', date: '2023-09-01', description: 'Monthly Rent', propertyAddress: 'Kouter 12' },
            { id: '2', amount: 240, status: 'PENDING', date: '2023-09-15', description: 'Plumbing Repair', propertyAddress: 'Meir 24' }
        ]);
    };
    loadData();
  }, [currentUser]);

  const activeLead = leads.find(l => l.id === selectedLeadId);
  const notifications = MOCK_NOTIFICATIONS[currentUser.role] || [];
  const unreadCount = notifications.filter(n => !n.read).length;
  const pendingTasks = tasks.filter(t => !t.completed).length;

  const NavItem = ({ id, label, icon: Icon, badge }: { id: TabType, label: string, icon: any, badge?: string }) => (
    <button 
        onClick={() => setTab(id)}
        className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 text-sm font-medium transition-all duration-200 relative group overflow-hidden ${
          tab === id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
        } ${isSidebarCollapsed ? 'justify-center' : ''}`}
        title={isSidebarCollapsed ? label : undefined}
    >
        <Icon className={`w-5 h-5 flex-shrink-0 transition-transform ${tab === id && isSidebarCollapsed ? 'scale-110' : ''}`} /> 
        <span className={`flex-1 whitespace-nowrap transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100 w-auto'}`}>
          {label}
        </span>
        {badge && !isSidebarCollapsed && (
          <span className="bg-indigo-100 text-indigo-600 text-[10px] font-bold py-0.5 px-2 rounded-full min-w-[20px] text-center">
            {badge}
          </span>
        )}
    </button>
  );

  const SectionHeader = ({ label }: { label: string }) => (
    <div className={`px-4 mt-6 mb-2 transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 h-0 mt-0 overflow-hidden' : 'opacity-100 h-auto'}`}>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* CRM Header */}
      <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-3 flex items-center justify-between shrink-0 z-30 h-16 shadow-sm relative">
        <div className="flex items-center gap-3 md:gap-4 transition-all duration-300" style={{ width: isSidebarCollapsed ? '60px' : '240px' }}>
             <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors hidden lg:block"><Menu className="w-5 h-5" /></button>
            <div className={`flex items-center gap-2 overflow-hidden transition-opacity duration-300 ${isSidebarCollapsed ? 'lg:opacity-0 lg:w-0' : 'opacity-100'}`}>
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-200 shrink-0">E</div>
                <h1 className="text-xl font-bold text-slate-800 tracking-tight whitespace-nowrap">Eburon</h1>
            </div>
        </div>
        
        <div className="flex items-center gap-4 flex-1 justify-end">
             {/* Notification Bell */}
             <div className="relative">
                 <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors relative">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (<span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>)}
                 </button>
                 {showNotifications && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                        <div className="px-4 py-3 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center"><h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notifications</h4></div>
                        <div className="max-h-64 overflow-y-auto">
                            {notifications.length > 0 ? notifications.map(n => (
                                <div key={n.id} className="px-4 py-3 border-b border-slate-50">
                                    <p className="text-sm font-semibold">{n.title}</p>
                                    <p className="text-xs text-slate-500">{n.message}</p>
                                </div>
                            )) : <div className="p-4 text-center text-xs">No notifications</div>}
                        </div>
                    </div>
                 )}
             </div>

             <div className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1.5 rounded-full pr-3 border border-transparent hover:border-slate-200 transition-all group relative">
                <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border border-slate-300">
                    <img src={currentUser.avatar || `https://ui-avatars.com/api/?name=${currentUser.name}`} alt="User" />
                </div>
                <div className="hidden md:block text-left">
                    <div className="text-sm font-medium text-slate-700 leading-none">{currentUser.name}</div>
                    <div className="text-[10px] text-slate-500 font-medium mt-0.5">{currentUser.role}</div>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400 hidden md:block" />
                
                {/* User Dropdown */}
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden hidden group-hover:block animate-in fade-in slide-in-from-top-2 z-50">
                    <div className="px-4 py-2 bg-slate-50 border-b border-slate-100"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Switch Profile (Demo)</p></div>
                    {(['BROKER', 'OWNER', 'RENTER', 'CONTRACTOR'] as UserRole[]).map(r => (
                        <button key={r} onClick={() => onSwitchUser(r)} className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 ${currentUser.role === r ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600'}`}>
                            <Users className="w-3 h-3"/> {r.charAt(0) + r.slice(1).toLowerCase()}
                        </button>
                    ))}
                    <div className="border-t border-slate-100 mt-1">
                        <button onClick={onLogout} className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"><LogOut className="w-4 h-4" /> Reset / Sign out</button>
                    </div>
                </div>
             </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden bg-slate-50/50 relative">
        {/* Sidebar Nav */}
        <nav 
            className={`bg-white border-r border-slate-200 flex flex-col pt-4 overflow-y-auto no-scrollbar hidden lg:flex shrink-0 transition-all duration-300 ease-in-out text-slate-600`}
            style={{ width: isSidebarCollapsed ? '80px' : '260px' }}
        >
             {currentUser.role === 'BROKER' && (
                <>
                    <div className="px-3"><NavItem id="dashboard" label="Dashboard" icon={LayoutDashboard} /></div>
                    <div className="px-3"><NavItem id="inbox" label="Inbox" icon={InboxIcon} /></div>
                    <SectionHeader label="Business" />
                    <div className="px-3 space-y-0.5">
                        <NavItem id="leads" label="Leads" icon={UserIcon} badge={leads.length.toString()} />
                        <NavItem id="properties" label="Properties" icon={Home} />
                        <NavItem id="tasks" label="Tasks" icon={CheckSquare} badge={pendingTasks > 0 ? pendingTasks.toString() : undefined} />
                        <NavItem id="calendar" label="Calendar" icon={CalendarIcon} />
                        <NavItem id="maintenance" label="Maintenance" icon={Wrench} badge={tickets.filter(t=>t.status==='OPEN').length.toString()} />
                    </div>
                    <SectionHeader label="Management" />
                    <div className="px-3 space-y-0.5">
                        <NavItem id="documents" label="Documents" icon={FileText} />
                        <NavItem id="finance" label="Finance" icon={Receipt} />
                        <NavItem id="marketing" label="Marketing" icon={Megaphone} />
                        <NavItem id="analytics" label="Analytics" icon={PieChart} />
                    </div>
                    <div className="px-3 mt-4"><NavItem id="agent-config" label="Agent Config" icon={Bot} /></div>
                </>
             )}
             
             {currentUser.role === 'OWNER' && (
                <>
                    <div className="px-3"><NavItem id="dashboard" label="Dashboard" icon={LayoutDashboard} /></div>
                    <div className="px-3 space-y-0.5 mt-2">
                        <NavItem id="properties" label="My Properties" icon={Home} />
                        <NavItem id="finance" label="Financials" icon={DollarSign} />
                        <NavItem id="documents" label="Documents" icon={FileText} />
                        <NavItem id="maintenance" label="Requests" icon={CheckCircle} />
                    </div>
                </>
             )}

             {currentUser.role === 'RENTER' && (
                 <>
                    <div className="px-3"><NavItem id="dashboard" label="Dashboard" icon={LayoutDashboard} /></div>
                    <div className="px-3 space-y-0.5 mt-2">
                        <NavItem id="my-home" label="My Home" icon={Home} />
                        <NavItem id="maintenance" label="Report Issue" icon={Wrench} />
                        <NavItem id="documents" label="Documents" icon={FileText} />
                    </div>
                 </>
             )}

             {currentUser.role === 'CONTRACTOR' && (
                 <>
                    <div className="px-3"><NavItem id="dashboard" label="Dashboard" icon={LayoutDashboard} /></div>
                    <div className="px-3 space-y-0.5 mt-2">
                        <NavItem id="jobs" label="Jobs" icon={Briefcase} badge={tickets.filter(t=>t.status==='SCHEDULED').length.toString()} />
                        <NavItem id="schedule" label="Schedule" icon={CalendarIcon} />
                        <NavItem id="documents" label="Documents" icon={FileText} />
                    </div>
                 </>
             )}
            
            {/* Sidebar Footer */}
            <div className="mt-auto p-4 border-t border-slate-200">
                 <div className={`bg-slate-50 rounded-xl p-4 text-slate-500 transition-all duration-300 ${isSidebarCollapsed ? 'p-2' : 'p-4'}`}>
                     <div className="flex items-center gap-3 justify-center">
                         <Shield className="w-5 h-5 text-emerald-500"/>
                         {!isSidebarCollapsed && <div className="text-xs font-medium">Eburon Secure</div>}
                     </div>
                </div>
            </div>
        </nav>

        {/* Content View Container */}
        <div className="flex-1 flex overflow-hidden bg-slate-50/50 relative">
            
            {/* List / Main View */}
            <div className={`flex-1 min-w-0 overflow-y-auto no-scrollbar p-4 md:p-8 transition-all duration-300 ${activeLead && currentUser.role === 'BROKER' && tab === 'leads' ? 'hidden lg:block' : 'block'}`}>
                <div className="max-w-7xl mx-auto h-full">
                    {tab === 'dashboard' && <DashboardView currentUser={currentUser} pendingTasks={pendingTasks} />}
                    {tab === 'inbox' && <InboxView />}
                    {tab === 'agent-config' && <AgentConfigView agentPersona={agentPersona} onUpdateAgentPersona={onUpdateAgentPersona} agents={agents} onAgentsChange={onAgentsChange} />}
                    {tab === 'marketing' && <MarketingView />}
                    {tab === 'analytics' && <AnalyticsView />}
                    {tab === 'documents' && <DocumentsView />}
                    {tab === 'finance' && <FinanceView invoices={invoices} />}
                    {tab === 'tasks' && <TasksView tasks={tasks} onUpdateTask={onUpdateTask} />}
                    {(tab === 'calendar' || tab === 'schedule') && <CalendarView tasks={tasks} />}
                    {(tab === 'maintenance' || tab === 'requests' || tab === 'jobs') && <MaintenanceView tickets={tickets} />}
                    
                    {['settings', 'my-home'].includes(tab) && (
                         <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center animate-in fade-in duration-500">
                            <Settings className="w-12 h-12 text-slate-300 mb-4" />
                            <h3 className="text-xl font-bold text-slate-700 mb-2">Settings</h3>
                            <p className="max-w-md mx-auto">Configuration options available in full version.</p>
                        </div>
                    )}

                    {/* Leads Table for Broker */}
                    {tab === 'leads' && currentUser.role === 'BROKER' && (
                        <LeadsView leads={leads} onSelectLead={onSelectLead} selectedLeadId={selectedLeadId} currentUser={currentUser} />
                    )}
                    
                     {/* Properties Grid */}
                    {(tab === 'properties' || tab === 'my-home') && (
                        <PropertiesView properties={properties} currentUser={currentUser} />
                    )}
                </div>
            </div>

            {/* Detail Pane (Broker Only) */}
            {activeLead && currentUser.role === 'BROKER' && tab === 'leads' && (
                <DetailPane activeLead={activeLead} onSelectLead={onSelectLead} onUpdateLead={onUpdateLead} />
            )}
        </div>
      </div>
    </div>
  );
};

export default CRM;
