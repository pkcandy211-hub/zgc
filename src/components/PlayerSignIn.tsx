/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserCheck, CheckCircle2, Search, ArrowRight, AlertCircle, RefreshCw, Users, HelpCircle,
  Clock, MapPin, User, GraduationCap
} from 'lucide-react';
import { Player, Event } from '../types';
import CountdownTimer from './CountdownTimer';

const getEventMeta = (event: Event) => {
  const title = event.title;
  let category = event.category || '焦點活動';
  let type = event.eventType || '開放簽到';
  let colorTheme = 'indigo';
  
  // Dynamic color selection based on category
  const cat = category.toLowerCase();
  if (cat.includes('境外') || cat.includes('學習')) {
    colorTheme = 'emerald';
  } else if (cat.includes('steam')) {
    colorTheme = 'amber';
  } else if (cat.includes('生涯') || cat.includes('規劃')) {
    colorTheme = 'emerald';
  } else if (cat.includes('學術') || cat.includes('輔導')) {
    colorTheme = 'rose';
  } else if (cat.includes('音樂') || cat.includes('體育')) {
    colorTheme = 'emerald';
  } else if (cat.includes('戰略') || cat.includes('整備')) {
    colorTheme = 'purple';
  } else if (cat.includes('日常') || cat.includes('點名')) {
    colorTheme = 'indigo';
  }

  let location = event.location || '現場同步 / 線上指揮部';
  let staff = '活動組織高層';
  let target = event.target || '全體登載玩家成員';
  let hours = event.hours || '今日日程辦理';

  const t = title.toLowerCase();
  
  // If ANY of the fields are missing on the object, try guessing based on title keywords
  if (!event.category || !event.hours || !event.location || !event.target || !event.eventType) {
    if (t.includes('大灣區') || t.includes('大灣') || t.includes('內地') || t.includes('考察')) {
      if (!event.category) { category = '境外學習'; colorTheme = 'emerald'; }
      if (!event.eventType) type = '依名單出席';
      if (!event.location) location = '大灣區';
      staff = '境外學習組';
      if (!event.target) target = 'S4, S5 (部分同學)';
      if (!event.hours) hours = '15/6 - 16/6';
    } else if (t.includes('台北') || t.includes('宜蘭') || t.includes('音樂') || t.includes('文化')) {
      if (!event.category) { category = '境外學習'; colorTheme = 'emerald'; }
      if (!event.eventType) type = '依名單出席';
      if (!event.location) location = '台北、宜蘭';
      staff = '甘慧怡、LTY';
      if (!event.target) target = 'S1, S2, S3, S4, S5 (部分同學)';
      if (!event.hours) hours = '15/6 - 19/6';
    } else if (t.includes('江門') || t.includes('白沙') || t.includes('尋根')) {
      if (!event.category) { category = '境外學習'; colorTheme = 'emerald'; }
      if (!event.eventType) type = '依名單出席';
      if (!event.location) location = '江門白沙';
      staff = '境外學習組';
      if (!event.target) target = 'S1 (中一(2)班)';
      if (!event.hours) hours = '15/6 - 16/6';
    } else if (t.includes('一創科') || t.includes('創科') || t.includes('沉浸式') || t.includes('虛擬實境')) {
      if (!event.category) { category = 'STEAM'; colorTheme = 'amber'; }
      if (!event.eventType) type = '全體強制✓';
      if (!event.location) location = '灣仔 LBE 體驗館';
      staff = 'STEAM及創意媒體組';
      if (!event.target) target = 'S1 (1B, 1D 班全體同學)';
      if (!event.hours) hours = '15/6 (09:00-12:30)';
    } else if (t.includes('生涯') || t.includes('職場') || t.includes('參觀')) {
      if (!event.category) { category = '生涯規劃'; colorTheme = 'emerald'; }
      if (!event.eventType) type = '依名單出席';
      if (!event.location) location = '邵氏影城/沙田駕駛學院';
      staff = '生涯規劃組';
      if (!event.target) target = 'S5 (部分同學)';
      if (!event.hours) hours = '15/6 (08:45-12:15)';
    } else if (t.includes('ai') || t.includes('人工智能') || t.includes('工作坊') || t.includes('web3')) {
      if (!event.category) { category = 'STEAM'; colorTheme = 'amber'; }
      if (!event.eventType) type = '全體強制✓';
      if (!event.location) location = 'ILH + 101 + 103 室';
      staff = 'STEAM及創意媒體組';
      if (!event.target) target = 'S1 (1A, 1C 班全體同學)';
      if (!event.hours) hours = '15/6 (08:30-12:00)';
    } else if (t.includes('english') || t.includes('camp') || t.includes('英語')) {
      if (!event.category) { category = '學術輔導'; colorTheme = 'rose'; }
      if (!event.eventType) type = '依名單出席';
      if (!event.location) location = '205-206 課室';
      staff = '英文組 (LTY)';
      if (!event.target) target = 'S4, S5 (部分同學)';
      if (!event.hours) hours = '15/6 (09:00-16:15)';
    } else if (t.includes('籃球') || t.includes('體育') || t.includes('球隊') || t.includes('訓練')) {
      if (!event.category) { category = '音樂體育'; colorTheme = 'emerald'; }
      if (!event.eventType) type = '依名單出席';
      if (!event.location) location = '操場 / 禮堂';
      staff = '何世強';
      if (!event.target) target = 'S1, S2, S3, S4, S5 (男子籃球隊隊員)';
      if (!event.hours) hours = '15/6 (14:00-17:00)';
    } else if (t.includes('備戰') || t.includes('戰') || t.includes('會') || t.includes('星')) {
      if (!event.category) { category = '戰略整備'; colorTheme = 'purple'; }
      if (!event.eventType) type = '全體盟友';
      if (!event.location) location = 'DC大廳語音 / 線上';
      staff = '聯盟管理組';
      if (!event.target) target = '全體登載將士';
      if (!event.hours) hours = '今日 19:30 - 22:30';
    } else if (t.includes('點名') || t.includes('日常')) {
      if (!event.category) { category = '日常點名'; colorTheme = 'indigo'; }
      if (!event.eventType) type = '當日計分';
      if (!event.location) location = '聯盟大殿 / 線上';
      staff = '總務同工群';
      if (!event.target) target = '全體預填成員';
      if (!event.hours) hours = '開放點名時段';
    }
  }

  return { category, type, colorTheme, location, staff, target, hours };
};

interface PlayerSignInProps {
  activeEvents: Event[];
  players: Player[];
  onSignInSuccess: () => void;
  allEvents?: Event[];
}

const getLocalDateString = (dateObj: Date = new Date()) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function PlayerSignIn({ activeEvents, players, onSignInSuccess, allEvents }: PlayerSignInProps) {
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Sign-in additional choices (Requirement 2)
  const [mainForceCount, setMainForceCount] = useState<string>('1主');
  const [siegeCarCount, setSiegeCarCount] = useState<string>('0車');

  // Local state for dynamically selected date (Requirement - "different days")
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString());

  // Support multiple active events selection (Requirement 5)
  const [selectedEventId, setSelectedEventId] = useState<string>('');

  // Filter events based on selected date
  const eventsForSelectedDate = (allEvents || activeEvents || []).filter(event => {
    const eventDateStr = getLocalDateString(new Date(event.date));
    return eventDateStr === selectedDate;
  });

  useEffect(() => {
    if (eventsForSelectedDate.length > 0) {
      if (!selectedEventId || !eventsForSelectedDate.some(e => e.id === selectedEventId)) {
        // Pick first active event if possible, otherwise first available
        const firstActive = eventsForSelectedDate.find(e => e.isActive);
        setSelectedEventId(firstActive ? firstActive.id : eventsForSelectedDate[0].id);
      }
    } else {
      setSelectedEventId('');
    }
  }, [eventsForSelectedDate, selectedEventId]);

  const currentActiveEvent = eventsForSelectedDate.find(e => e.id === selectedEventId) || eventsForSelectedDate[0] || null;

  // Extract all unique groups
  const groups = Array.from(new Set(players.map(p => p.group))).filter(Boolean);

  // Filter players based on group and search query
  const filteredPlayers = players.filter(p => {
    const matchesGroup = selectedGroup ? p.group === selectedGroup : true;
    const matchesSearch = searchQuery
      ? p.name.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesGroup && matchesSearch;
  });

  // Automatically pick group of selected player if name searched globally
  const handleSelectPlayer = (player: Player) => {
    setSelectedPlayer(player);
    setMessage(null);
  };

  const handleSignIn = async () => {
    if (!currentActiveEvent) {
      setMessage({ type: 'error', text: '當前沒有進行中的簽到活動。' });
      return;
    }
    if (!selectedPlayer) {
      setMessage({ type: 'error', text: '請先選擇或搜尋您的姓名。' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const res = await fetch(`/api/events/${currentActiveEvent.id}/sign-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: selectedPlayer.id,
          deviceInfo: `${isMobile ? '行動裝置' : '電腦版'} (${navigator.userAgent.substring(0, 40)}...)`,
          mainForceCount, // Submit main force quantity
          siegeCarCount   // Submit siege car quantity
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.already) {
          setMessage({ type: 'info', text: data.message });
        } else {
          setMessage({ type: 'success', text: data.message });
          // Reset selector
          setSelectedPlayer(null);
          setSearchQuery('');
          onSignInSuccess();
        }
      } else {
        setMessage({ type: 'error', text: data.error || '簽到失敗，請重試。' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: '網路錯誤，請確認伺服器連線狀態。' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full px-4 py-4 space-y-8" id="player-signin-container">
      {/* Event Header Panel */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden animate-fade-in" id="event-header-panel">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 md:p-6 bg-slate-50 border-b border-slate-200/60">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse shrink-0" />
              <h2 className="text-base md:text-lg font-display font-extrabold text-slate-800">
                {selectedDate === getLocalDateString() ? '今日' : `${selectedDate} `}日程即時焦點活動
              </h2>
            </div>
            <p className="text-xs font-semibold text-slate-450 leading-relaxed">
              系統將即時線上同步簽到（請點擊下方焦點活動卡片，即可開始選取您的姓名進行簽到與設定兵力）
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            {currentActiveEvent && (currentActiveEvent.mainForce || currentActiveEvent.siegeCar) && (
              <div className="flex items-center gap-2 bg-indigo-50/60 border border-indigo-100 rounded-xl px-3 py-1.5 shadow-3xs">
                {currentActiveEvent.mainForce && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-indigo-950">
                    <span className="px-2 py-0.5 rounded bg-indigo-600 text-white text-[9px] tracking-wide font-mono shrink-0 uppercase">主力</span>
                    {currentActiveEvent.mainForce}
                  </span>
                )}
                {currentActiveEvent.mainForce && currentActiveEvent.siegeCar && (
                  <span className="w-px h-3.5 bg-indigo-200/50" />
                )}
                {currentActiveEvent.siegeCar && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-indigo-950">
                    <span className="px-2 py-0.5 rounded bg-amber-550 text-black text-[9px] tracking-wide font-mono shrink-0 uppercase">攻城車</span>
                    {currentActiveEvent.siegeCar}
                  </span>
                )}
              </div>
            )}
            <div className="flex items-center gap-2 bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl shadow-3xs">
              <span className="text-[10px] font-bold text-slate-405 shrink-0 select-none">目前/測試日期 :</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedEventId('');
                }}
                className="text-xs font-mono font-extrabold text-slate-700 bg-transparent border-none p-0 focus:outline-none focus:ring-0 cursor-pointer outline-none w-[115px]"
              />
            </div>
          </div>
        </div>

        <div className="p-5 md:p-6 bg-white">
          {eventsForSelectedDate.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" id="events-cards-grid">
              {eventsForSelectedDate.map(event => {
                const isSelected = event.id === selectedEventId;
                const activeRecordCount = Object.keys(event.records).length;
                const meta = getEventMeta(event);
                
                // Color mapping
                const themes: Record<string, { bg: string, text: string, border: string, pill: string }> = {
                  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', pill: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
                  amber: { bg: 'bg-amber-50 border border-amber-100', text: 'text-amber-700', border: 'border-amber-100', pill: 'bg-amber-50 text-amber-750' },
                  purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100', pill: 'bg-purple-50 text-purple-700' },
                  sky: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-100', pill: 'bg-sky-50 text-sky-700' },
                  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100', pill: 'bg-indigo-50 text-indigo-700' },
                  rose: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100', pill: 'bg-rose-50 text-rose-700' },
                  violet: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-100', pill: 'bg-violet-50 text-violet-750' }
                };
                const c = themes[meta.colorTheme] || themes.indigo;

                return (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => {
                      setSelectedEventId(event.id);
                      setMessage(null);
                      setSelectedPlayer(null);
                    }}
                    className={`text-left rounded-3xl p-5 md:p-6 border transition-all relative flex flex-col justify-between cursor-pointer focus:outline-none w-full group ${
                      isSelected
                        ? 'bg-indigo-50/15 border-indigo-600 ring-3 ring-indigo-500/10 shadow-sm'
                        : !event.isActive
                        ? 'bg-slate-50/70 border-slate-200/60 opacity-75 hover:opacity-100 hover:bg-slate-50 text-slate-500'
                        : 'bg-white hover:bg-slate-50 border-slate-200/90 shadow-3xs'
                    }`}
                    id={`active-event-card-${event.id}`}
                  >
                    <div className="w-full">
                      {/* Badge row */}
                      <div className="flex gap-1.5 items-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-sans tracking-wide border ${c.bg} ${c.border} ${c.text}`}>
                          {meta.category}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-sans tracking-wide bg-slate-50 border border-slate-200 text-slate-500">
                          {meta.type}
                        </span>
                        {!event.isActive && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-sans bg-rose-50 border border-rose-200 text-rose-600 inline-flex items-center shrink-0">
                            已截止
                          </span>
                        )}
                        {isSelected && (
                          <span className="ml-auto px-2 py-0.5 rounded text-[9px] font-extrabold bg-indigo-600 text-white flex items-center gap-0.5 shadow-3xs tracking-tight animate-fade-in shrink-0">
                            已選定
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h4 className={`font-extrabold text-sm leading-snug mt-3.5 break-words group-hover:text-indigo-650 transition-colors ${
                        event.isActive ? 'text-slate-850' : 'text-slate-500'
                      }`}>
                        {event.title}
                      </h4>

                      {/* Description / Notes */}
                      {event.description && (
                        <p className="mt-2 text-[11px] font-medium text-slate-550 bg-slate-50 border border-slate-105 p-2.5 rounded-2xl leading-relaxed whitespace-pre-wrap break-words font-sans">
                          {event.description}
                        </p>
                      )}

                      {/* 4 details row list with icons */}
                      <div className="mt-4 pt-3.5 border-t border-slate-100/80 space-y-2.5 text-slate-500 text-[11px] font-bold font-sans">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{meta.hours}</span>
                          </div>
                          <CountdownTimer targetDate={event.date} isActive={event.isActive} />
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">地點：{meta.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">對象：{meta.target}</span>
                        </div>
                        {(event.mainForce || event.siegeCar) && (
                          <div className="flex items-center gap-2 pt-1.5 border-t border-slate-100/50 mt-1 flex-wrap">
                            {event.mainForce && (
                              <span className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-100/80 text-indigo-755 text-[10px] px-2 py-0.5 rounded-lg font-extrabold shadow-3xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                                主力：{event.mainForce}
                              </span>
                            )}
                            {event.siegeCar && (
                              <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-100/80 text-amber-705 text-[10px] px-2 py-0.5 rounded-lg font-extrabold shadow-3xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                攻城車：{event.siegeCar}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom row displaying checked people stats */}
                    <div className="flex items-center justify-between mt-5 pt-3.5 border-t border-slate-100 w-full">
                      <span className="text-[10px] text-slate-400 font-bold">
                        已點名人數：
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-black transition-all ${
                        isSelected 
                          ? 'bg-indigo-650 text-white border-indigo-650 shadow-3xs'
                          : 'bg-indigo-50 border border-indigo-100 text-indigo-700'
                      }`}>
                        {activeRecordCount} 人
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center max-w-sm mx-auto space-y-3" id="no-events-panel">
              <AlertCircle className="w-10 h-10 text-slate-350 mx-auto" />
              <h3 className="text-sm font-extrabold text-slate-700">該日期沒有找到點名活動</h3>
              <p className="text-xs font-semibold text-slate-450 leading-relaxed">
                {selectedDate === getLocalDateString() 
                  ? '活動管理員在控制台發起新活動後，系統將自動同步並顯示在此處供您簽到。'
                  : `在 「${selectedDate}」 沒有找到任何活動日程。您可以切換其他日期，或通知管理員在主控台發起新活動。`}
              </p>
            </div>
          )}
        </div>
      </div>

      {currentActiveEvent && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto w-full space-y-6"
        >
          {/* Main Action Form Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-205 p-6 md:p-8" id="player-action-form">
            <h2 className="text-lg font-display font-extrabold text-slate-800 mb-5 flex items-center gap-2">
              <UserCheck className="w-5.5 h-5.5 text-indigo-600" />
              請搜尋或點選您的姓名
            </h2>

            {/* Group Tab Selector */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-slate-450 uppercase tracking-widest mb-2.5 font-mono">
                按分組篩選
              </label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pb-1" id="group-tabs">
                <button
                  id="group-tab-all"
                  onClick={() => setSelectedGroup('')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                    selectedGroup === ''
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-650'
                  }`}
                >
                  全部顯示 ({players.length})
                </button>
                {groups.map(group => {
                  const groupCount = players.filter(p => p.group === group).length;
                  return (
                    <button
                      key={group}
                      id={`group-tab-${group}`}
                      onClick={() => setSelectedGroup(group)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                        selectedGroup === group
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-650'
                      }`}
                    >
                      {group} ({groupCount})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Name Filter */}
            <div className="relative mb-5" id="name-search-box">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Search className="w-4.5 h-4.5" />
              </span>
              <input
                id="player-search-input"
                type="text"
                placeholder="輸入您的名字進行快速搜尋..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans font-medium"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  清除
                </button>
              )}
            </div>

            {/* Interactive Player Grid */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-slate-455 font-mono">
                  候選名單 ({filteredPlayers.length} / {players.length}人)
                </span>
                {selectedPlayer && (
                  <span className="text-xs text-indigo-600 font-bold">
                    已選取：{selectedPlayer.name} ({selectedPlayer.group})
                  </span>
                )}
              </div>

              <div 
                className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-2xl"
                id="players-grid"
              >
                {filteredPlayers.length > 0 ? (
                  filteredPlayers.map(player => {
                    const isSelected = selectedPlayer?.id === player.id;
                    const isAlreadySigned = currentActiveEvent?.records[player.id];
                    return (
                      <button
                        key={player.id}
                        id={`player-btn-${player.id}`}
                        disabled={!!isAlreadySigned && !isSelected}
                        onClick={() => handleSelectPlayer(player)}
                        className={`text-left p-3 rounded-xl border text-xs cursor-pointer relative transition-all flex flex-col justify-between h-15 ${
                          isSelected
                            ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-900 font-bold'
                            : isAlreadySigned
                            ? 'bg-slate-100/70 border-slate-200 text-slate-400 opacity-60 font-medium'
                            : 'bg-white hover:bg-slate-50 border-slate-150 text-slate-700 shadow-2xs font-semibold'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-extrabold truncate pr-1">{player.name}</span>
                          {isAlreadySigned && (
                            <span className="text-[9px] bg-emerald-50 text-emerald-700 px-1 py-0.5 rounded flex items-center gap-0.5 font-bold shrink-0">
                              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                              已簽
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between w-full text-[10px] text-slate-400 font-mono font-bold">
                          <span className="truncate">{player.group}</span>
                          {player.serial && <span>#{player.serial}</span>}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="col-span-full py-8 text-center text-slate-400 flex flex-col items-center justify-center">
                    <HelpCircle className="w-8 h-8 text-slate-300 mb-1" />
                    <span className="text-xs font-semibold">找不到符合的名字，請調整篩選</span>
                  </div>
                )}
              </div>
            </div>

            {/* Interactive choices for main force & siege car count (Requirement 2) */}
            <AnimatePresence>
              {selectedPlayer && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mb-6 p-4 rounded-2xl bg-indigo-50/30 border border-indigo-100 overflow-hidden space-y-4"
                  id="additional-signin-options"
                >
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                    請選擇您的兵力設定
                  </h3>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">
                      主力數量：
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {['0主', '1主', '2主', '2主以上'].map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setMainForceCount(opt)}
                          className={`py-2 px-1 text-xs font-extrabold border rounded-xl text-center cursor-pointer transition-all ${
                            mainForceCount === opt
                              ? 'bg-indigo-600 text-white border-indigo-650 shadow-2xs'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 font-bold'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">
                      攻城車數量：
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {['0車', '1車', '2車', '2車以上'].map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setSiegeCarCount(opt)}
                          className={`py-2 px-1 text-xs font-extrabold border rounded-xl text-center cursor-pointer transition-all ${
                            siegeCarCount === opt
                              ? 'bg-indigo-600 text-white border-indigo-650 shadow-2xs'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 font-bold'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Prompt Messages */}
            <AnimatePresence mode="wait">
              {message && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`p-4 rounded-2xl flex gap-3 text-sm mb-5 leading-relaxed items-start ${
                    message.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-3xs'
                      : message.type === 'info'
                      ? 'bg-blue-50 text-blue-800 border border-blue-200 shadow-3xs'
                      : 'bg-rose-50 text-rose-800 border border-rose-200 shadow-3xs'
                  }`}
                  id="signin-status-message"
                >
                  {message.type === 'success' && <CheckCircle2 className="w-5.5 h-5.5 text-emerald-600 shrink-0 mt-0.5" />}
                  {message.type === 'info' && <CheckCircle2 className="w-5.5 h-5.5 text-blue-600 shrink-0 mt-0.5" />}
                  {message.type === 'error' && <AlertCircle className="w-5.5 h-5.5 text-rose-600 shrink-0 mt-0.5" />}
                  <div>
                    <span className="font-extrabold">{message.type === 'success' ? '簽到成功！' : message.type === 'info' ? '提示' : '發生錯誤'}</span>
                    <p className="mt-0.5 text-xs font-semibold text-opacity-95">{message.text}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form Submit Row */}
            <div className="flex flex-col gap-2.5" id="signin-submit-btn-row">
              <button
                id="btn-confirm-signin"
                disabled={!selectedPlayer || loading}
                onClick={handleSignIn}
                className={`w-full py-4 px-4 rounded-2xl text-sm font-bold text-white cursor-pointer shadow-xs transition-all flex items-center justify-center gap-2 ${
                  !selectedPlayer
                    ? 'bg-slate-205 text-slate-400 pointer-events-none'
                    : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-xs active:scale-[0.99] active:shadow-none'
                }`}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    正在處理點名...
                  </>
                ) : selectedPlayer ? (
                  <>
                    確認是我，送出活動簽到
                    <ArrowRight className="w-4 h-4 text-emerald-200" />
                  </>
                ) : (
                  '請先在上面點選您的姓名'
                )}
              </button>
              
              {selectedPlayer && (
                <button
                  id="btn-cancel-selection"
                  onClick={() => setSelectedPlayer(null)}
                  className="w-full py-2 text-xs text-slate-450 hover:text-slate-700 transition-colors cursor-pointer font-bold"
                >
                  重選姓名
                </button>
              )}
            </div>
          </div>

          {/* Quick Informational Panel list for mobile check in */}
          <div className="bg-indigo-900 border border-indigo-950 text-indigo-100 rounded-3xl p-6 md:p-8 shadow-md space-y-3 leading-relaxed" id="signin-tip-box">
            <h4 className="font-display font-extrabold text-white text-base flex items-center gap-2 mb-1">
              <Users className="w-5.5 h-5.5 text-indigo-300" /> 簽到步驟說明
            </h4>
            <div className="space-y-2 text-xs text-indigo-200 font-medium">
              <p className="flex items-start gap-1.5"><span className="font-bold font-mono text-indigo-300">①</span> <span>請在上排點選您所在的分組（如「風雲組」、「十單組」）。</span></p>
              <p className="flex items-start gap-1.5"><span className="font-bold font-mono text-indigo-300">②</span> <span>在下方名單中尋找並點按您的名字，或利用快速輸入框直接搜尋您的名稱。</span></p>
              <p className="flex items-start gap-1.5"><span className="font-bold font-mono text-indigo-300">③</span> <span>點選名字後，按下綠色按鈕「確認是我，送出活動簽到」即可完成。</span></p>
              <p className="flex items-start gap-1.5"><span className="font-bold font-mono text-indigo-300">④</span> <span>簽到結果會立即同步至管理員統計儀表板上，可點右上角重新整理確認。</span></p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
