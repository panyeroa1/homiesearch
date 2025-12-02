
import React, { useState, useEffect, useRef } from 'react';
import Dialer from '../components/admin-final/Dialer';
import CRM from '../components/admin-final/CRM';
import { Lead, CallState, Recording, User, Property, AgentPersona, UserRole, Task } from '../types-admin-final';
import { geminiClient } from '../services/admin-final/geminiService';
import { blandService } from '../services/admin-final/blandService';
import { Download, Save, Trash2, X, AlertCircle, Loader2 } from 'lucide-react';
import { db } from '../services/admin-final/db';
import { DEFAULT_AGENT_PERSONA } from '../constants-admin-final';

interface PendingRec {
  url: string;
  duration: number;
  timestamp: number;
}

const DEFAULT_USER: User = {
  id: 'demo-broker',
  name: 'Laurent De Wilde',
  email: 'laurent@eburon.com',
  role: 'BROKER',
  avatar: 'https://ui-avatars.com/api/?name=Laurent+De+Wilde&background=random'
};

const AdminPortal: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(DEFAULT_USER);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [callState, setCallState] = useState<CallState>(CallState.IDLE);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showMobileDialer, setShowMobileDialer] = useState(false);
  const [audioVols, setAudioVols] = useState<{in: number, out: number}>({in: 0, out: 0});
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState<number>(0);
  const [pendingRecording, setPendingRecording] = useState<PendingRec | null>(null);
  const [recordingOutcome, setRecordingOutcome] = useState<'connected' | 'missed' | 'voicemail' | 'follow_up' | 'closed'>('connected');
  
  // Track the actual API Call ID
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  
  // Loading state for fetching recording
  const [isFetchingRecording, setIsFetchingRecording] = useState(false);

  // Agent Config State
  const [agents, setAgents] = useState<AgentPersona[]>([]);
  const [agentPersona, setAgentPersona] = useState<AgentPersona>(DEFAULT_AGENT_PERSONA);

  // Refs for Ringing Logic
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const ringTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Bland AI Monitoring Socket
  const [monitorWs, setMonitorWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    
    // Gemini Volume (for Agent Config / Demo mode if used)
    geminiClient.onVolumeChange = (inp, outp) => {
        setAudioVols({ in: inp, out: outp });
    };

    geminiClient.onClose = () => {
        handleEndCall();
    };

    return () => {
        window.removeEventListener('resize', handleResize);
        geminiClient.disconnect();
        if(monitorWs) monitorWs.close();
    };
  }, []);

  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (currentUser) {
        const fetchData = async () => {
            try {
                const [fetchedLeads, fetchedProperties, fetchedTasks, fetchedAgents] = await Promise.all([
                    db.getLeads(),
                    db.getProperties(),
                    db.getTasks(),
                    db.getAgents()
                ]);
                setLeads(fetchedLeads);
                setProperties(fetchedProperties);
                setTasks(fetchedTasks);
                
                // Setup agents list and ensure default is present
                let allAgents = fetchedAgents;
                if (fetchedAgents.length === 0) {
                    allAgents = [DEFAULT_AGENT_PERSONA];
                    // Optionally save default if DB was empty
                    db.createAgent(DEFAULT_AGENT_PERSONA);
                }
                setAgents(allAgents);
                setAgentPersona(allAgents[0]); // Default to first agent
            } catch (error) {
                console.error("Failed to fetch admin data", error);
            } finally {
                setIsLoadingData(false);
            }
        };
        fetchData();
    }
  }, [currentUser]);

  const handleLeadSelect = (lead: Lead | null) => {
    setActiveLead(lead);
  };

  const handleUpdateLead = async (updatedLead: Lead) => {
    setLeads(prevLeads => prevLeads.map(l => l.id === updatedLead.id ? updatedLead : l));
    if (activeLead && activeLead.id === updatedLead.id) {
        setActiveLead(updatedLead);
    }
    await db.updateLead(updatedLead);
  };

  const handleUpdateTask = async (updatedTask: Task) => {
      setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
      await db.updateTask(updatedTask);
  };

  // Switch User (Demo Feature)
  const handleSwitchUser = (role: UserRole) => {
      const demoPersonas: Record<UserRole, {name: string, email: string}> = {
          BROKER: { name: 'Laurent De Wilde', email: 'laurent@eburon.com' },
          OWNER: { name: 'Marc Peeters', email: 'marc.peeters@telenet.be' },
          RENTER: { name: 'Sophie Dubois', email: 'sophie.d@example.com' },
          CONTRACTOR: { name: 'Johan Smet', email: 'johan.smet@fixit.be' }
      };

      const persona = demoPersonas[role];
      const newUser: User = {
          id: `demo-${role.toLowerCase()}`,
          name: persona.name,
          email: persona.email,
          role: role,
          avatar: `https://ui-avatars.com/api/?name=${persona.name.replace(' ', '+')}&background=random`
      };
      
      setCurrentUser(newUser);
      setActiveLead(null); // Clear selection when switching
  };

  const handleSelectAgent = (agentId: string) => {
      const selected = agents.find(a => a.id === agentId);
      if (selected) {
          setAgentPersona(selected);
      }
  };

  const startCall = async (number: string) => {
    // 1. Set Ringing State
    setCallState(CallState.RINGING);
    setPendingRecording(null); // Reset prev recording
    
    // 2. Play Ringtone
    const ringAudio = new Audio('https://botsrhere.online/deontic/callerpro/ring.mp3');
    ringAudio.loop = true;
    ringtoneRef.current = ringAudio;
    
    try {
        await ringAudio.play();
    } catch(e) {
        console.error("Audio play failed", e);
    }

    // 3. Initiate Call via Bland AI Service
    try {
        const result = await blandService.initiateCall(number, agentPersona);
        
        if (result.status === 'success' && result.call_id) {
            console.log("Call Initiated:", result.call_id);
            setCurrentCallId(result.call_id); // Save ID for fetching recording later
            
            // Wait for 9s ring effect to complete or match ring time
            ringTimeoutRef.current = setTimeout(async () => {
                if (ringtoneRef.current) {
                    ringtoneRef.current.pause();
                    ringtoneRef.current = null;
                }
                
                setCallState(CallState.ACTIVE);
                setRecordingStartTime(Date.now()); // Fallback start time
                
                // Attempt to connect to live monitoring stream for visualization
                const wsUrl = await blandService.listenToCall(result.call_id);
                if (wsUrl) {
                    const ws = new WebSocket(wsUrl);
                    ws.onmessage = () => {
                         setAudioVols({ in: Math.random() * 0.5, out: Math.random() * 0.5 });
                    };
                    setMonitorWs(ws);
                }

            }, 9000); 

        } else {
             throw new Error(result.message || "Call failed to start");
        }
    } catch (e) {
        console.error("Failed to connect call", e);
        if (ringtoneRef.current) {
            ringtoneRef.current.pause();
            ringtoneRef.current = null;
        }
        setCallState(CallState.ERROR);
        setTimeout(() => setCallState(CallState.IDLE), 2000);
    }
  };

  const stopRecordingAndPrompt = async () => {
    setIsRecording(false);
    
    if (!currentCallId) {
        console.error("No call ID found to fetch recording");
        return;
    }

    setIsFetchingRecording(true);
    
    // Polling logic: Attempt to get the recording URL 3 times
    let attempts = 0;
    const maxAttempts = 3;
    
    const fetchLoop = async () => {
        try {
            const callData = await blandService.getCallDetails(currentCallId);
            
            if (callData && callData.recording_url) {
                // Success - we have the real URL
                const duration = callData.call_length 
                    ? Math.round(callData.call_length * 60) // API usually returns minutes? check docs. Usually float minutes.
                    : Math.floor((Date.now() - recordingStartTime) / 1000); // Fallback

                setPendingRecording({
                   url: callData.recording_url,
                   duration: duration, 
                   timestamp: recordingStartTime
                });
                setRecordingOutcome('connected');
                setIsFetchingRecording(false);
            } else {
                // Not ready yet, retry
                attempts++;
                if (attempts < maxAttempts) {
                    console.log(`Recording not ready, retrying (${attempts}/${maxAttempts})...`);
                    setTimeout(fetchLoop, 2000); // Wait 2s
                } else {
                    console.warn("Recording URL not found after retries.");
                    setIsFetchingRecording(false);
                    // Optional: Show error or just close
                }
            }
        } catch (e) {
            console.error("Error fetching call details", e);
            setIsFetchingRecording(false);
        }
    };

    // Start fetching
    setTimeout(fetchLoop, 1000); // Initial delay
  };

  const handleEndCall = async () => {
    // Cleanup Ringtone if active
    if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current = null;
    }
    if (ringTimeoutRef.current) {
        clearTimeout(ringTimeoutRef.current);
        ringTimeoutRef.current = null;
    }
    
    if (monitorWs) {
        monitorWs.close();
        setMonitorWs(null);
    }

    // Always attempt to fetch recording details when call ends normally
    if (callState === CallState.ACTIVE && currentCallId) {
        await stopRecordingAndPrompt();
    }
    
    // If using Gemini client for other features, disconnect it too
    geminiClient.disconnect();
    
    setCallState(CallState.ENDED);
    setTimeout(() => setCallState(CallState.IDLE), 2000);
  };

  const toggleRecording = (shouldRecord: boolean) => {
    // Bland records automatically based on config.
    // This button just updates UI state.
    setIsRecording(shouldRecord);
  };

  const handleConfirmSave = async () => {
     if (!pendingRecording || !activeLead) return;
     
     const newRecording: Recording = {
        id: Date.now().toString(),
        timestamp: pendingRecording.timestamp,
        duration: pendingRecording.duration,
        url: pendingRecording.url,
        outcome: recordingOutcome
     };
     
     const updatedLead = {
         ...activeLead,
         recordings: [newRecording, ...activeLead.recordings]
     };

     await handleUpdateLead(updatedLead);

     // Automated Action: Create Task if 'Follow up needed'
     if (recordingOutcome === 'follow_up') {
         const newTask: Task = {
             id: `task-${Date.now()}`,
             title: `Follow up with ${activeLead.firstName} ${activeLead.lastName}`,
             dueDate: new Date(Date.now() + 86400000).toISOString(), // +24 hours
             completed: false,
             leadId: activeLead.id,
             leadName: `${activeLead.firstName} ${activeLead.lastName}`,
             priority: 'MEDIUM'
         };
         await db.createTask(newTask);
         setTasks(prev => [...prev, newTask]);
         alert("Follow-up task created automatically for tomorrow.");
     }

     setPendingRecording(null);
     setCurrentCallId(null);
  };

  const handleDownloadRecording = () => {
      if (!pendingRecording) return;
      const a = document.createElement('a');
      a.href = pendingRecording.url;
      a.target = "_blank"; // Open in new tab for direct mp3 links
      a.download = `call-recording-${new Date(pendingRecording.timestamp).toISOString()}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  };

  const handleDiscardRecording = () => {
      setPendingRecording(null);
      setCurrentCallId(null);
  };

  const handleLogout = () => {
      if (window.confirm("Are you sure you want to sign out? (Demo: This will reset the session)")) {
          setCurrentUser(DEFAULT_USER);
          window.location.reload(); 
      }
  };

  if (!currentUser || isLoadingData) {
      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <span className="font-medium text-sm">Loading Admin Portal...</span>
        </div>
      );
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex relative bg-slate-50">
      
      {/* Desktop CRM Layout */}
      {!isMobile && (
        <div className="flex-1 h-full min-w-0">
            <CRM 
                leads={leads} 
                properties={properties} 
                onSelectLead={handleLeadSelect}
                selectedLeadId={activeLead?.id || null}
                onUpdateLead={handleUpdateLead}
                currentUser={currentUser}
                onLogout={handleLogout}
                agentPersona={agentPersona}
                onUpdateAgentPersona={setAgentPersona}
                onSwitchUser={handleSwitchUser}
                tasks={tasks}
                onUpdateTask={handleUpdateTask}
                agents={agents}
                onAgentsChange={setAgents}
            />
        </div>
      )}

      {/* Mobile CRM Layout (Full Width) */}
      {isMobile && (
         <div className="flex-1 h-full min-w-0">
            <CRM 
                leads={leads} 
                properties={properties} 
                onSelectLead={handleLeadSelect}
                selectedLeadId={activeLead?.id || null}
                onUpdateLead={handleUpdateLead}
                currentUser={currentUser}
                onLogout={handleLogout}
                agentPersona={agentPersona}
                onUpdateAgentPersona={setAgentPersona}
                onSwitchUser={handleSwitchUser}
                tasks={tasks}
                onUpdateTask={handleUpdateTask}
                agents={agents}
                onAgentsChange={setAgents}
                onToggleDialer={() => setShowMobileDialer(true)}
            />
         </div>
      )}

      {/* Phone Overlay / Sidebar */}
      <div className={`
        transition-all duration-500 ease-in-out shrink-0
        ${isMobile 
            ? `fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 ${showMobileDialer ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}` 
            : 'w-[420px] h-full border-l border-slate-200 bg-white shadow-2xl relative z-40 p-8 flex items-center justify-center'
        }
      `}>
         {/* Close Button for Mobile Overlay */}
         {isMobile && (
             <button 
                onClick={() => setShowMobileDialer(false)}
                className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg text-slate-500 hover:text-slate-800 z-50"
             >
                 <X className="w-6 h-6" />
             </button>
         )}

         <div className={`${isMobile ? 'w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden h-[80vh]' : 'w-[360px] h-[720px]'} transition-all relative`}>
            <Dialer 
                callState={callState}
                onCallStart={startCall}
                onCallEnd={handleEndCall}
                activeLeadName={activeLead ? `${activeLead.firstName} ${activeLead.lastName}` : undefined}
                activeLeadPhone={activeLead?.phone}
                inputVolume={audioVols.in}
                outputVolume={audioVols.out}
                onToggleRecording={toggleRecording}
                isRecording={isRecording}
                leads={leads}
                onLeadSelected={(lead) => handleLeadSelect(lead)}
                agents={agents}
                selectedAgentId={agentPersona.id || 'default'}
                onSelectAgent={handleSelectAgent}
            />
         </div>
      </div>

      {/* Loading Overlay for Recording Fetch */}
      {isFetchingRecording && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-sm">
              <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center animate-in zoom-in-95">
                  <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
                  <p className="text-slate-800 font-bold">Processing Recording...</p>
                  <p className="text-xs text-slate-500">Retrieving audio file from server</p>
              </div>
          </div>
      )}

      {/* Recording Review Modal */}
      {pendingRecording && !isFetchingRecording && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
             <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200 border border-slate-200">
                 <div className="flex justify-between items-center mb-4">
                     <h3 className="text-xl font-bold text-slate-800">Call Recording</h3>
                     <button onClick={handleDiscardRecording} className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                     </button>
                 </div>
                 
                 <p className="text-sm text-slate-500 mb-6 font-medium leading-relaxed">
                    The call has ended. Please categorize the outcome and save the recording.
                 </p>

                 <div className="bg-slate-100 rounded-2xl p-4 mb-6 border border-slate-200">
                     <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        <span>{new Date(pendingRecording.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        <span>{Math.floor(pendingRecording.duration / 60)}:{(pendingRecording.duration % 60).toFixed(0).padStart(2, '0')}</span>
                     </div>
                     <audio controls src={pendingRecording.url} className="w-full h-8 accent-indigo-600" />
                 </div>

                 {/* Outcome Selector */}
                 <div className="mb-6">
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Call Outcome</label>
                     <div className="grid grid-cols-2 gap-2">
                         {(['connected', 'voicemail', 'missed', 'follow_up', 'closed'] as const).map(outcome => (
                             <button
                                key={outcome}
                                onClick={() => setRecordingOutcome(outcome)}
                                className={`px-2 py-2 text-xs font-bold rounded-lg border transition-all ${
                                    recordingOutcome === outcome 
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                                }`}
                             >
                                 {outcome.replace('_', ' ').charAt(0).toUpperCase() + outcome.replace('_', ' ').slice(1)}
                             </button>
                         ))}
                     </div>
                     {recordingOutcome === 'follow_up' && (
                         <div className="mt-2 flex items-start gap-2 text-xs text-indigo-600 bg-indigo-50 p-2 rounded-lg">
                             <AlertCircle className="w-4 h-4 shrink-0" />
                             <span>A task will be automatically created for tomorrow.</span>
                         </div>
                     )}
                 </div>

                 <div className="space-y-3">
                    <button 
                        onClick={handleConfirmSave}
                        disabled={!activeLead}
                        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="w-4 h-4" />
                        {activeLead ? `Save to ${activeLead.firstName}` : 'Select a Lead to Save'}
                    </button>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={handleDownloadRecording}
                            className="w-full py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Download
                        </button>
                        <button 
                            onClick={handleDiscardRecording}
                            className="w-full py-3 bg-white border border-slate-200 hover:bg-red-50 hover:border-red-100 text-slate-700 hover:text-red-600 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            Discard
                        </button>
                    </div>
                 </div>
             </div>
          </div>
      )}

    </div>
  );
};

export default AdminPortal;
