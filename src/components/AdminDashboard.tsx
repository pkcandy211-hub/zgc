/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, Play, Square, Trash2, CheckCircle2, XCircle, Users, 
  HelpCircle, Search, Sparkles, Sliders, CheckSquare, Calendar, RefreshCw,
  Edit2
} from 'lucide-react';
import { Player, Event, EventStats, GroupSummary } from '../types';

interface AdminDashboardProps {
  events: Event[];
  players: Player[];
  activeEvent: Event | null;
  onRefresh: () => void;
  onSelectEvent: (eventId: string) => void;
  selectedEventId: string | null;
}

export default function AdminDashboard({
  events,
  players,
  activeEvent,
  onRefresh,
  onSelectEvent,
  selectedEventId
}: AdminDashboardProps) {
  // Local state for event creation
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newLocation, setNewLocation] = useState('');

  const getTodayLocalDateStr = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [newDate, setNewDate] = useState(getTodayLocalDateStr());
  const [newStartTime, setNewStartTime] = useState('19:30');
  const [newTarget, setNewTarget] = useState('全體登載玩家成員');
  const [newCategory, setNewCategory] = useState('日常點名');
  const [newEventType, setNewEventType] = useState('開放簽到');
  const [newMainForce, setNewMainForce] = useState('0主');
  const [newSiegeCar, setNewSiegeCar] = useState('0車');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [submittingEvent, setSubmittingEvent] = useState(false);

  // Local state for search & filtering inside current event records
  const [recordTab, setRecordTab] = useState<'present' | 'absent'>('present');
  const [searchRoster, setSearchRoster] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('');

  // Local state for active event statistics
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Local state for event editing
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editTarget, setEditTarget] = useState('全體登載玩家成員');
  const [editCategory, setEditCategory] = useState('日常點名');
  const [editEventType, setEditEventType] = useState('開放簽到');
  const [editMainForce, setEditMainForce] = useState('0主');
  const [editSiegeCar, setEditSiegeCar] = useState('0車');
  const [editSelectedGroups, setEditSelectedGroups] = useState<string[]>([]);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Unique groups for filtering
  const groups = Array.from(new Set(players.map(p => p.group))).filter(Boolean);

  // Fetch stats for the selected event
  const currentEventId = selectedEventId || (events.length > 0 ? events[0].id : null);
  const currentEvent = events.find(e => e.id === currentEventId) || null;

  useEffect(() => {
    if (currentEventId) {
      fetchStats(currentEventId);
    } else {
      setStats(null);
    }
  }, [currentEventId, events, players]);

  const fetchStats = async (eventId: string) => {
    setLoadingStats(true);
    try {
      const res = await fetch(`/api/events/${eventId}/stats`);
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching event statistics:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setSubmittingEvent(true);
    try {
      const composedHours = newStartTime;
      const composedDate = `${newDate}T${newStartTime}:00`;

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim(),
          location: newLocation.trim(),
          hours: composedHours,
          date: composedDate,
          target: newTarget.trim(),
          category: newCategory.trim(),
          eventType: newEventType.trim(),
          mainForce: newMainForce,
          siegeCar: newSiegeCar
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewTitle('');
        setNewDescription('');
        setNewLocation('');
        setNewDate(getTodayLocalDateStr());
        setNewStartTime('19:30');
        setNewTarget('全體登載玩家成員');
        setNewCategory('日常點名');
        setNewEventType('開放簽到');
        setNewMainForce('0主');
        setNewSiegeCar('0車');
        setSelectedGroups([]);
        setShowCreateForm(false);
        onRefresh();
        if (data.event) {
          onSelectEvent(data.event.id);
        }
      }
    } catch (err) {
      alert('活動建立失敗，請稍後重試');
    } finally {
      setSubmittingEvent(false);
    }
  };

  const startEditing = (event: Event) => {
    setEditingEventId(event.id);
    setEditTitle(event.title);
    setEditDescription(event.description || '');
    setEditLocation(event.location || '');
    
    // Parse Date and Time
    const evDate = new Date(event.date);
    const yyyy = evDate.getFullYear();
    const mm = String(evDate.getMonth() + 1).padStart(2, '0');
    const dd = String(evDate.getDate()).padStart(2, '0');
    setEditDate(`${yyyy}-${mm}-${dd}`);
    
    const hh = String(evDate.getHours()).padStart(2, '0');
    const min = String(evDate.getMinutes()).padStart(2, '0');
    setEditStartTime(`${hh}:${min}`);

    setEditTarget(event.target || '全體登載玩家成員');
    setEditCategory(event.category || '日常點名');
    setEditEventType(event.eventType || '開放簽到');
    setEditMainForce(event.mainForce || '0主');
    setEditSiegeCar(event.siegeCar || '0車');

    // Parse selected groups if target includes them
    const matchedGroups = groups.filter(g => event.target?.includes(g));
    setEditSelectedGroups(matchedGroups);
  };

  const handleEditEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEventId || !editTitle.trim()) return;

    setSubmittingEdit(true);
    try {
      const composedHours = editStartTime;
      const composedDate = `${editDate}T${editStartTime}:00`;

      const res = await fetch(`/api/events/${editingEventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim(),
          location: editLocation.trim(),
          hours: composedHours,
          date: composedDate,
          target: editTarget.trim(),
          category: editCategory.trim(),
          eventType: editEventType.trim(),
          mainForce: editMainForce,
          siegeCar: editSiegeCar
        })
      });
      const data = await res.json();
      if (data.success) {
        setEditingEventId(null);
        onRefresh();
      }
    } catch (err) {
      console.error('Error editing event:', err);
      alert('活動修改失敗，請稍後重試');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleToggleEvent = async (eventId: string) => {
    setActionLoading(`toggle-${eventId}`);
    try {
      const res = await fetch(`/api/events/${eventId}/toggle`, {
        method: 'PATCH'
      });
      const data = await res.json();
      if (data.success) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    setActionLoading(`delete-${eventId}`);
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        onRefresh();
        // If current selection is deleted, clear or fallback
        if (selectedEventId === eventId) {
          onSelectEvent('');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
      setDeleteConfirmId(null);
    }
  };

  const handleAdminToggleSignIn = async (playerId: string) => {
    if (!currentEventId) return;

    setActionLoading(`signin-${playerId}`);
    try {
      const res = await fetch(`/api/events/${currentEventId}/admin-toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId })
      });
      const data = await res.json();
      if (data.success) {
        onRefresh(); // fetch updated event state
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  // Compute Present and Absent player lists for display
  const records = currentEvent?.records || {};
  
  const presentPlayers = players.filter(p => !!records[p.id]);
  const absentPlayers = players.filter(p => !records[p.id]);

  // Filter roster listings
  const filteredPresent = presentPlayers.filter(p => {
    const matchesGroup = selectedGroupFilter ? p.group === selectedGroupFilter : true;
    const matchesSearch = searchRoster
      ? p.name.toLowerCase().includes(searchRoster.toLowerCase())
      : true;
    return matchesGroup && matchesSearch;
  });

  const filteredAbsent = absentPlayers.filter(p => {
    const matchesGroup = selectedGroupFilter ? p.group === selectedGroupFilter : true;
    const matchesSearch = searchRoster
      ? p.name.toLowerCase().includes(searchRoster.toLowerCase())
      : true;
    return matchesGroup && matchesSearch;
  });

  // Calculate aggregate counts for mainForce and siegeCars of currentEvent
  const countMF = { '0主': 0, '1主': 0, '2主': 0, '2主以上': 0 };
  const countSC = { '0車': 0, '1車': 0, '2車': 0, '2車以上': 0 };

  if (currentEvent && currentEvent.records) {
    Object.values(currentEvent.records).forEach(rec => {
      const mf = rec.mainForceCount || '1主';
      if (mf in countMF) {
        countMF[mf as keyof typeof countMF]++;
      } else {
        countMF['1主']++;
      }
      
      const sc = rec.siegeCarCount || '0車';
      if (sc in countSC) {
        countSC[sc as keyof typeof countSC]++;
      } else {
        countSC['0車']++;
      }
    });
  }

  const totalMainForce = (countMF['1主'] * 1) + (countMF['2主'] * 2) + (countMF['2主以上'] * 2); 
  const totalSiegeCar = (countSC['1車'] * 1) + (countSC['2車'] * 2) + (countSC['2車以上'] * 2);

  return (
    <div className="space-y-6" id="admin-dashboard-root">
      {/* Upper Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl md:text-2xl font-display font-extrabold text-slate-800 flex items-center gap-2">
            <Sliders className="w-5.5 h-5.5 text-indigo-600" />
            活動簽到控制台 ({events.length} 個活動)
          </h2>
          <p className="text-sm font-semibold text-slate-400 mt-1">建立和管理簽到活動，並查看即時數據報表。</p>
        </div>
        
        <button
          id="btn-trigger-create-form"
          onClick={() => setShowCreateForm(prev => !prev)}
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto shadow-2xs"
        >
          <Plus className="w-4.5 h-4.5" />
          建立新活動
        </button>
      </div>

      {/* Event Creation Form Panel Modal/Card */}
      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 md:p-8 rounded-3xl border border-indigo-200 ring-4 ring-indigo-500/5 shadow-md animate-fade-in"
          id="create-event-form-panel"
        >
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-500 mb-1.5 font-mono uppercase tracking-wider">活動名稱 / 標題 *</label>
                <input
                  id="event-title-input"
                  type="text"
                  required
                  placeholder="例如：6/5 伺魔大會、週三例行點名"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1.5 font-mono uppercase tracking-wider">描述或備註（選填）</label>
                <input
                  id="event-desc-input"
                  type="text"
                  placeholder="輸入本次簽到的詳細說明或玩家叮嚀事項..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 font-mono uppercase tracking-wider">活動類別（選填）</label>
                <input
                  id="event-category-input"
                  type="text"
                  placeholder="例如：日常點名、境外學習、STEAM"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 font-mono uppercase tracking-wider">簽到類型 / 下拉標籤（選填）</label>
                <input
                  id="event-type-input"
                  type="text"
                  placeholder="例如：開放簽到、依名單出席、全體強制✓"
                  value={newEventType}
                  onChange={(e) => setNewEventType(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 font-mono uppercase tracking-wider">活動日期 / 時間 *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    id="event-date-input"
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                  />
                  <input
                    id="event-hours-input"
                    type="time"
                    required
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-center"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 font-mono uppercase tracking-wider">活動地點（選填）</label>
                <input
                  id="event-location-input"
                  type="text"
                  placeholder="例如：聯盟大殿 / 線上、灣仔 LBE 體驗館"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 font-mono uppercase tracking-wider">活動對象（選填）</label>
                <div className="space-y-2.5 bg-slate-50 border border-slate-200/80 p-3 rounded-2xl" id="target-pill-container">
                  {/* Selected summary text display */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-slate-400">目前設定之對象說明：</span>
                    <span className="text-xs font-extrabold text-indigo-750 font-sans">{newTarget}</span>
                  </div>
                  
                  {/* Pill selections */}
                  <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-200/40">
                    {/* All group select pill button */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedGroups([]);
                        setNewTarget('全體登載玩家成員');
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        selectedGroups.length === 0
                          ? 'bg-indigo-600 text-white border-indigo-600 font-extrabold shadow-3xs'
                          : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200 font-medium'
                      }`}
                    >
                      全體玩家成員
                    </button>

                    {/* Individual group selection tags */}
                    {groups.map(groupName => {
                      const isSelected = selectedGroups.includes(groupName);
                      return (
                        <button
                          key={groupName}
                          type="button"
                          onClick={() => {
                            let updated: string[];
                            if (selectedGroups.includes(groupName)) {
                              updated = selectedGroups.filter(g => g !== groupName);
                            } else {
                              updated = [...selectedGroups, groupName];
                            }
                            setSelectedGroups(updated);
                            
                            if (updated.length === 0) {
                              setNewTarget('全體登載玩家成員');
                            } else {
                              const hasOnlyStandardClasses = updated.every(g => g.startsWith('S') || /^\d/.test(g));
                              if (hasOnlyStandardClasses) {
                                setNewTarget(`${updated.join(', ')} 班全體同學`);
                              } else {
                                setNewTarget(`${updated.join(', ')} 成員`);
                              }
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs transition-all border cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-extrabold ring-1 ring-indigo-500/20'
                              : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200 font-medium'
                          }`}
                        >
                          {groupName} 班 / 組
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 font-mono uppercase tracking-wider">主力（最少需求數）</label>
                <select
                  id="event-mainforce-input"
                  value={newMainForce}
                  onChange={(e) => setNewMainForce(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold bg-white"
                >
                  <option value="0主">0主</option>
                  <option value="1主">1主</option>
                  <option value="2主">2主</option>
                  <option value="2主以上">2主以上</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 font-mono uppercase tracking-wider">攻城車（最少需求數）</label>
                <select
                  id="event-siegecar-input"
                  value={newSiegeCar}
                  onChange={(e) => setNewSiegeCar(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold bg-white"
                >
                  <option value="0車">0車</option>
                  <option value="1車">1車</option>
                  <option value="2車">2車</option>
                  <option value="2車以上">2車以上</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                id="btn-cancel-create-event"
                onClick={() => {
                  setShowCreateForm(false);
                  setSelectedGroups([]);
                  setNewTarget('全體登載玩家成員');
                  setNewMainForce('0主');
                  setNewSiegeCar('0車');
                }}
                className="px-4.5 py-2.5 text-slate-500 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer"
              >
                取消
              </button>
              <button
                type="submit"
                id="btn-submit-create-event"
                disabled={submittingEvent}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                {submittingEvent ? '建立中...' : '確認建立活動'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Event List Card */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-205 shadow-sm" id="event-list-card">
            <h3 className="font-display font-extrabold text-slate-800 text-sm mb-4 flex items-center justify-between">
              <span>歷史活動列表 ({events.length})</span>
              <button onClick={onRefresh} className="text-xs text-slate-400 hover:text-indigo-600 flex items-center gap-1 cursor-pointer font-bold">
                <RefreshCw className="w-3 h-3 animate-pulse" /> 重新整理
              </button>
            </h3>
            
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1" id="event-buttons-list">
              {events.length > 0 ? (
                events.map(event => {
                  const isSelected = event.id === currentEventId;
                  const activeRecordCount = Object.keys(event.records).length;
                  const totalCount = players.length;
                  const percent = totalCount > 0 ? Math.round((activeRecordCount / totalCount) * 100) : 0;
                  
                  return (
                    <div
                      key={event.id}
                      className={`group p-4 rounded-2xl border transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                        isSelected 
                          ? 'bg-slate-50 border-indigo-505 ring-2 ring-indigo-550/10' 
                          : 'bg-white border-slate-150 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                      onClick={() => onSelectEvent(event.id)}
                      id={`event-item-${event.id}`}
                    >
                      <div className="flex items-start justify-between gap-1.5 w-full">
                        <div className="flex items-center gap-3 truncate">
                          {/* 視覺化環形進度條 */}
                          <div className="relative flex items-center justify-center w-10 h-10 shrink-0" title={`已簽到 ${activeRecordCount}/${totalCount} (${percent}%)`}>
                            <svg className="w-10 h-10 transform -rotate-90">
                              {/* Background track circle */}
                              <circle
                                cx="20"
                                cy="20"
                                r="16"
                                className="text-slate-100"
                                strokeWidth="3"
                                stroke="currentColor"
                                fill="transparent"
                              />
                              {/* Foreground dynamic progress circle */}
                              <circle
                                cx="20"
                                cy="20"
                                r="16"
                                className={`${event.isActive ? 'text-indigo-600' : 'text-slate-400'} transition-all duration-300`}
                                strokeWidth="3"
                                strokeDasharray={2 * Math.PI * 16}
                                strokeDashoffset={(1 - percent / 100) * (2 * Math.PI * 16)}
                                strokeLinecap="round"
                                stroke="currentColor"
                                fill="transparent"
                              />
                            </svg>
                            <span className="absolute text-[9px] font-sans font-extrabold text-slate-700">
                              {percent}%
                            </span>
                          </div>

                          <div className="truncate">
                            <h4 className="font-extrabold text-slate-800 text-sm truncate leading-snug group-hover:text-indigo-650 transition-colors">{event.title}</h4>
                            <span className="text-[10px] text-slate-400 font-mono font-bold block mt-0.5">
                              {new Date(event.date).toLocaleString('zh-TW', { hour12: false })}
                            </span>
                          </div>
                        </div>

                        <span className={`inline-flex shrink-0 items-center px-2 py-0.5 rounded text-[10px] font-bold font-sans ${
                          event.isActive 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          {event.isActive ? '簽到中' : '已結束'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-100 text-xs text-slate-500">
                        <span className="font-mono text-[11px] font-bold">已簽到: <span className="text-indigo-650">{activeRecordCount}</span> 人</span>
                        
                        {/* Event control actions inside list */}
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            id={`btn-toggle-event-${event.id}`}
                            title={event.isActive ? '點擊結束簽到' : '點擊開啟簽到'}
                            onClick={() => handleToggleEvent(event.id)}
                            disabled={actionLoading === `toggle-${event.id}`}
                            className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                              event.isActive 
                                ? 'text-amber-500 hover:bg-amber-50' 
                                : 'text-emerald-500 hover:bg-emerald-50'
                            }`}
                          >
                            {event.isActive ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                          </button>

                          <button
                            id={`btn-edit-event-${event.id}`}
                            title="編輯活動內容"
                            onClick={() => startEditing(event)}
                            className="p-1.5 rounded-lg text-indigo-505 hover:bg-slate-100 cursor-pointer transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            id={`btn-delete-event-${event.id}`}
                            title="刪除活動"
                            onClick={() => setDeleteConfirmId(event.id)}
                            disabled={actionLoading === `delete-${event.id}`}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-slate-400 font-mono text-xs font-bold">
                  目前沒有任何活動點名記錄
                </div>
              )}
            </div>
          </div>
          
          {/* Preset templates list tip */}
          <div className="bg-indigo-900 text-indigo-100 p-6 border border-indigo-950 rounded-3xl text-sm space-y-1.5 shadow-md">
            <h4 className="font-display font-extrabold text-white flex items-center gap-1 text-sm">
              <Sparkles className="w-4 h-4 text-indigo-300" /> 操作提示
            </h4>
            <div className="space-y-1 text-xs text-indigo-200 font-medium">
              <p>點擊活動項目即可在右側檢视即時的名單統計與分組分析。</p>
              <p>可以獨立切換各活動的「簽到中/已結束」狀態，同時間只有處於「簽到中」狀態的活動才接受玩家自行點名。</p>
            </div>
          </div>
        </div>

        {/* Right Column: Statistics Panel + Live Attendance Status lists */}
        <div className="lg:col-span-8 space-y-6">
          {currentEvent ? (
            <div className="space-y-6">
              {/* Event Stat Counters */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4" id="stats-counters-grid">
                <div className="bg-white p-6 rounded-3xl border border-slate-205 shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-sm transition-all">
                  <span className="text-xs font-bold text-slate-450 font-mono uppercase tracking-wider">即時總出席率</span>
                  <div className="flex items-baseline gap-1 mt-3 mb-1">
                    <span className="text-3xl font-display font-black text-indigo-600 tracking-tight">
                      {stats ? stats.attendanceRate : 0}
                    </span>
                    <span className="text-xs font-bold text-indigo-400">%</span>
                  </div>
                  {/* Subtle progression bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${stats ? stats.attendanceRate : 0}%` }}
                    />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-205 shadow-xs flex flex-col justify-between hover:shadow-sm transition-all">
                  <span className="text-xs font-bold text-slate-455 font-mono uppercase tracking-wider">已簽到人數</span>
                  <div className="flex items-baseline gap-1 mt-3 justify-start items-center">
                    <span className="text-3xl font-display font-black text-emerald-600 tracking-tight">
                      {stats ? stats.totalPresent : 0}
                    </span>
                    <span className="text-xs text-slate-450 font-mono font-bold">/ {players.length} 人</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold mt-3 block flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> 出席人數
                  </span>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-205 shadow-xs flex flex-col justify-between hover:shadow-sm transition-all">
                  <span className="text-xs font-bold text-slate-455 font-mono uppercase tracking-wider">未出席人數</span>
                  <div className="flex items-baseline gap-1 mt-3">
                    <span className="text-3xl font-display font-black text-rose-500 tracking-tight">
                      {stats ? stats.totalAbsent : 0}
                    </span>
                    <span className="text-xs text-slate-450 font-mono font-bold">/ {players.length} 人</span>
                  </div>
                  <span className="text-[10px] text-rose-500 font-bold mt-3 block flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5 shrink-0" /> 尚未報到
                  </span>
                </div>

                {/* 主力總計 */}
                <div className="bg-white p-5 rounded-3xl border border-slate-205 shadow-xs flex flex-col justify-between hover:shadow-sm transition-all relative overflow-hidden">
                  <span className="text-xs font-bold text-indigo-700 font-mono uppercase tracking-wider">主力總計</span>
                  <div className="flex items-baseline gap-1 mt-3">
                    <span className="text-3xl font-display font-black text-indigo-650 tracking-tight">
                      {totalMainForce}
                    </span>
                    <span className="text-xs text-indigo-400 font-mono font-bold">主</span>
                  </div>
                  <div className="text-[10px] text-slate-450 space-y-0.5 mt-3 pt-2 border-t border-slate-100 leading-tight">
                    <div className="flex justify-between font-medium">
                      <span>1主:</span>
                      <span className="font-mono text-slate-600 font-bold">{countMF['1主']} 人</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>2主及以上:</span>
                      <span className="font-mono text-slate-600 font-bold">{countMF['2主'] + countMF['2主以上']} 人</span>
                    </div>
                  </div>
                </div>

                {/* 攻城車總計 */}
                <div className="bg-white p-5 rounded-3xl border border-slate-205 shadow-xs flex flex-col justify-between hover:shadow-sm transition-all">
                  <span className="text-xs font-bold text-amber-700 font-mono uppercase tracking-wider">攻城車總計</span>
                  <div className="flex items-baseline gap-1 mt-3">
                    <span className="text-3xl font-display font-black text-amber-650 tracking-tight">
                      {totalSiegeCar}
                    </span>
                    <span className="text-xs text-amber-500 font-mono font-bold">車</span>
                  </div>
                  <div className="text-[10px] text-slate-455 space-y-0.5 mt-3 pt-2 border-t border-slate-100 leading-tight">
                    <div className="flex justify-between font-medium">
                      <span>1車:</span>
                      <span className="font-mono text-slate-600 font-bold">{countSC['1車']} 輛</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>2車及以上:</span>
                      <span className="font-mono text-slate-600 font-bold">{countSC['2車'] + countSC['2車以上']} 輛</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-205 shadow-xs flex flex-col justify-between hover:shadow-sm transition-all">
                  <span className="text-xs font-bold text-slate-455 font-mono uppercase tracking-wider">活動狀態</span>
                  <div className="mt-3 text-slate-800 font-bold">
                    <span className="text-sm truncate block max-w-full font-display text-indigo-650">
                      {currentEvent?.title || '未選取活動'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 block mt-1">
                      狀態: {currentEvent?.isActive ? '🟢 開放簽到中' : '🔴 已結束'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-405 mt-2 block flex items-center gap-1 font-mono font-bold">
                    <Calendar className="w-3.5 h-3.5" /> {currentEvent ? new Date(currentEvent.date).toLocaleDateString() : ''}
                  </span>
                </div>
              </div>

              {/* Group Classification Progress Grid */}
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-205 shadow-sm" id="group-classification-stats">
                <h3 className="font-display font-extrabold text-slate-800 text-sm mb-5 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  分組簽到數據統計面板 (即時更新)
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {stats && stats.byGroup.length > 0 ? (
                    stats.byGroup.map(group => (
                      <div 
                        key={group.groupName} 
                        className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2"
                        id={`group-summary-${group.groupName}`}
                      >
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-extrabold text-slate-800">{group.groupName}</span>
                          <span className="font-mono text-slate-500 font-bold">
                            {group.signedCount} / {group.totalCount} ({group.percentage}%)
                          </span>
                        </div>
                        
                        {/* Custom progress bar */}
                        <div className="w-full bg-slate-200/60 h-2.5 rounded-full relative overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              group.percentage === 100 
                                ? 'bg-emerald-500' 
                                : group.percentage >= 70 
                                ? 'bg-indigo-500' 
                                : group.percentage >= 40 
                                ? 'bg-amber-500' 
                                : 'bg-slate-400'
                            }`}
                            style={{ width: `${group.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-6 text-center text-slate-400 font-mono text-xs font-bold">
                      暫無分組統計數據，請至活動首頁匯入名單。
                    </div>
                  )}
                </div>
              </div>

              {/* Attendance Records Manager Tab Table */}
              <div className="bg-white rounded-3xl border border-slate-205 shadow-sm overflow-hidden animate-fade-in" id="attendance-roster-checklist">
                {/* Header Selector Tabs */}
                <div className="bg-slate-50/80 px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex bg-slate-200/50 p-1 rounded-2xl w-fit" id="present-absent-tabs">
                    <button
                      id="tab-view-present"
                      onClick={() => setRecordTab('present')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                        recordTab === 'present'
                          ? 'bg-white text-emerald-800 shadow-3xs'
                          : 'text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      已簽到名單 ({presentPlayers.length})
                    </button>
                    <button
                      id="tab-view-absent"
                      onClick={() => setRecordTab('absent')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                        recordTab === 'absent'
                          ? 'bg-white text-rose-800 shadow-3xs'
                          : 'text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      未簽到名單 ({absentPlayers.length})
                    </button>
                  </div>

                  {/* Filtering / Searching Row */}
                  <div className="flex gap-2 items-center" id="roster-filtering-row">
                    {/* Group Filter */}
                    <select
                      id="select-group-filter"
                      value={selectedGroupFilter}
                      onChange={(e) => setSelectedGroupFilter(e.target.value)}
                      className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="">所有分組</option>
                      {groups.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>

                    {/* Simple Search */}
                    <div className="relative">
                      <input
                        id="input-search-roster"
                        type="text"
                        placeholder="搜尋姓名..."
                        value={searchRoster}
                        onChange={(e) => setSearchRoster(e.target.value)}
                        className="pl-8 pr-3 py-2 w-36 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                      />
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Tab Table Content */}
                <div className="max-h-96 overflow-y-auto" id="table-scroll-container">
                  {recordTab === 'present' ? (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-450 font-mono tracking-widest">
                          <th className="py-3.5 px-6">序號/編號</th>
                          <th className="py-3.5 px-6">姓名</th>
                          <th className="py-3.5 px-6">分組分類</th>
                          <th className="py-3.5 px-6">兵力設定</th>
                          <th className="py-3.5 px-6">簽到時間</th>
                          <th className="py-3.5 px-6">管道 & 裝置</th>
                          <th className="py-3.5 px-6 text-right">人工操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredPresent.length > 0 ? (
                          filteredPresent.map((p, index) => {
                            const rec = records[p.id];
                            return (
                              <tr 
                                key={p.id} 
                                className="hover:bg-slate-50/70 transition-colors text-slate-700"
                                id={`present-row-${p.id}`}
                              >
                                <td className="py-3.5 px-6 font-mono text-slate-400 font-bold">
                                  {p.serial ? `#${p.serial}` : `${index + 1}`}
                                </td>
                                <td className="py-3.5 px-6 font-extrabold text-slate-800">{p.name}</td>
                                <td className="py-3.5 px-6">
                                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px]">
                                    {p.group}
                                  </span>
                                </td>
                                <td className="py-3.5 px-6">
                                  <div className="flex gap-1.5 font-bold text-[10px]">
                                    <span className="px-1.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700">
                                      {rec?.mainForceCount || '1主'}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded-md bg-amber-50 border border-amber-100 text-amber-700">
                                      {rec?.siegeCarCount || '0車'}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3.5 px-6 font-mono text-[11px] text-slate-500 font-semibold">
                                  {rec ? new Date(rec.timestamp).toLocaleTimeString('zh-TW', { hour12: false }) : '-'}
                                </td>
                                <td className="py-3.5 px-6 font-mono max-w-xs truncate text-[10px] text-slate-400" title={rec?.deviceInfo}>
                                  {rec?.method === 'admin' ? (
                                    <span className="text-indigo-600 font-bold bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                                      管理員代簽
                                    </span>
                                  ) : (
                                    <span>{rec?.deviceInfo || '行動網路端'}</span>
                                  )}
                                </td>
                                <td className="py-3.5 px-6 text-right">
                                  <button
                                    id={`btn-uncheck-${p.id}`}
                                    onClick={() => handleAdminToggleSignIn(p.id)}
                                    disabled={actionLoading === `signin-${p.id}`}
                                    className="px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 active:scale-95 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                                  >
                                    撤銷簽到
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-slate-400 font-mono font-bold">
                              沒有符合條件的已出席玩家
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  ) : (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-455 font-mono tracking-widest">
                          <th className="py-3.5 px-6">序號/編號</th>
                          <th className="py-3.5 px-6">姓名</th>
                          <th className="py-3.5 px-6">分組分類</th>
                          <th className="py-3.5 px-6">報到狀態</th>
                          <th className="py-3.5 px-6 text-right">人工操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredAbsent.length > 0 ? (
                          filteredAbsent.map((p, index) => (
                            <tr 
                              key={p.id} 
                              className="hover:bg-slate-50/70 transition-colors text-slate-700"
                              id={`absent-row-${p.id}`}
                            >
                              <td className="py-3.5 px-6 font-mono text-slate-400 font-bold">
                                {p.serial ? `#${p.serial}` : `${index + 1}`}
                              </td>
                              <td className="py-3.5 px-6 font-extrabold text-slate-800">{p.name}</td>
                              <td className="py-3.5 px-6">
                                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px]">
                                  {p.group}
                                </span>
                              </td>
                              <td className="py-3.5 px-6">
                                <span className="text-[10px] text-rose-600 font-bold flex items-center gap-1 font-mono">
                                  <XCircle className="w-3.5 h-3.5" /> 尚未報到
                                </span>
                              </td>
                              <td className="py-3.5 px-6 text-right">
                                <button
                                  id={`btn-manual-signin-${p.id}`}
                                  onClick={() => handleAdminToggleSignIn(p.id)}
                                  disabled={actionLoading === `signin-${p.id}`}
                                  className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-150 hover:bg-emerald-100 active:scale-95 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                                >
                                  手動代簽
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="py-12 text-center text-slate-400 font-mono font-bold">
                              沒有符合條件的未出席玩家
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 text-center rounded-3xl border border-dashed border-slate-205 flex flex-col items-center justify-center min-h-[300px]">
              <Calendar className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="font-display font-extrabold text-slate-750 text-base">請點選或建立一項點名活動</h3>
              <p className="text-slate-450 text-xs mt-2 max-w-sm font-medium leading-relaxed">
                在左方列表中點按您要開始管理的活動。如果目前列表空空如也，請點按上方「建立新活動」按鈕發起第一個活動。
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 刪除確認對話框 */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-xs" id="delete-confirm-overlay">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
              <Trash2 className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-display font-extrabold text-slate-800">確定刪除此活動？</h3>
              <p className="text-xs font-semibold text-slate-450 mt-1.5 leading-relaxed">
                您確定要刪除「{events.find(e => e.id === deleteConfirmId)?.title}」此活動及其所有簽到記錄嗎？此動作將無法復原。
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => handleDeleteEvent(deleteConfirmId)}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                確認刪除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 編輯活動對話框 Modal */}
      {editingEventId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-xs overflow-y-auto" id="edit-event-overlay">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-2xl w-full p-6 md:p-8 space-y-4 my-8"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base md:text-lg font-display font-extrabold text-slate-800 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-600" />
                編輯活動內容
              </h3>
              <button 
                type="button" 
                onClick={() => setEditingEventId(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditEvent} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 font-mono uppercase tracking-wider">活動名稱 / 標題 *</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 font-mono uppercase tracking-wider">描述或備註（選填）</label>
                  <input
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 font-mono uppercase tracking-wider">活動類別（選填）</label>
                  <input
                    type="text"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 font-mono uppercase tracking-wider">簽到類型 / 下拉標籤（選填）</label>
                  <input
                    type="text"
                    value={editEventType}
                    onChange={(e) => setEditEventType(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 font-mono uppercase tracking-wider">活動日期 / 時間 *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="date"
                      required
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                    />
                    <input
                      type="time"
                      required
                      value={editStartTime}
                      onChange={(e) => setEditStartTime(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-center"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 font-mono uppercase tracking-wider">活動地點（選填）</label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 font-mono uppercase tracking-wider">活動對象（選填）</label>
                  <div className="space-y-2.5 bg-slate-50 border border-slate-200/80 p-3 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-slate-400">目前設定之對象說明：</span>
                      <span className="text-xs font-extrabold text-indigo-750 font-sans">{editTarget}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-200/40">
                      <button
                        type="button"
                        onClick={() => {
                          setEditSelectedGroups([]);
                          setEditTarget('全體登載玩家成員');
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          editSelectedGroups.length === 0
                            ? 'bg-indigo-600 text-white border-indigo-600 font-extrabold shadow-3xs'
                            : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200 font-medium'
                        }`}
                      >
                        全體玩家成員
                      </button>

                      {groups.map(groupName => {
                        const isSelected = editSelectedGroups.includes(groupName);
                        return (
                          <button
                            key={groupName}
                            type="button"
                            onClick={() => {
                              let updated: string[];
                              if (editSelectedGroups.includes(groupName)) {
                                updated = editSelectedGroups.filter(g => g !== groupName);
                              } else {
                                updated = [...editSelectedGroups, groupName];
                              }
                              setEditSelectedGroups(updated);
                              
                              if (updated.length === 0) {
                                setEditTarget('全體登載玩家成員');
                              } else {
                                const hasOnlyStandardClasses = updated.every(g => g.startsWith('S') || /^\d/.test(g));
                                if (hasOnlyStandardClasses) {
                                  setEditTarget(`${updated.join(', ')} 班全體同學`);
                                } else {
                                  setEditTarget(`${updated.join(', ')} 成員`);
                                }
                              }
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs transition-all border cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-extrabold ring-1 ring-indigo-500/20'
                                : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200 font-medium'
                            }`}
                          >
                            {groupName} 班 / 組
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 font-mono uppercase tracking-wider">主力（最少需求數）</label>
                  <select
                    value={editMainForce}
                    onChange={(e) => setEditMainForce(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold bg-white"
                  >
                    <option value="0主">0主</option>
                    <option value="1主">1主</option>
                    <option value="2主">2主</option>
                    <option value="2主以上">2主以上</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 font-mono uppercase tracking-wider">攻城車（最少需求數）</label>
                  <select
                    value={editSiegeCar}
                    onChange={(e) => setEditSiegeCar(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold bg-white"
                  >
                    <option value="0車">0車</option>
                    <option value="1車">1車</option>
                    <option value="2車">2車</option>
                    <option value="2車以上">2車以上</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingEventId(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  {submittingEdit ? '儲存中...' : '確認修改內容'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
