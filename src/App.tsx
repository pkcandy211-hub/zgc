/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserCheck, Sliders, FileSpreadsheet, Sparkles, 
  RefreshCw, CheckSquare, Award, PlayCircle, HelpCircle, Lock, AlertTriangle
} from 'lucide-react';
import { Player, Event } from './types';
import PlayerSignIn from './components/PlayerSignIn';
import AdminDashboard from './components/AdminDashboard';
import HistoryAndRoster from './components/HistoryAndRoster';

export default function App() {
  const [activeTab, setActiveTab] = useState<'signin' | 'admin' | 'roster'>('signin');
  const [players, setPlayers] = useState<Player[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Track selected event ID in the administration section
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Admin section password gate (Requirement 3)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [isRosterAuthenticated, setIsRosterAuthenticated] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  useEffect(() => {
    // Check URL parameters for custom view paths (e.g., ?view=admin or ?view=roster)
    const params = new URLSearchParams(window.location.search);
    const viewWord = params.get('view');
    if (viewWord === 'admin') {
      setActiveTab('admin');
    } else if (viewWord === 'roster') {
      setActiveTab('roster');
    }
    
    // Load initial server database
    refreshAllData();
  }, []);

  const refreshAllData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      // Parallelize fetches
      const [playersRes, eventsRes] = await Promise.all([
        fetch('/api/players'),
        fetch('/api/events')
      ]);

      if (!playersRes.ok || !eventsRes.ok) {
        throw new Error('伺服器資料加載失敗');
      }

      const playersData = await playersRes.json();
      const eventsData = await eventsRes.json();

      if (playersData.success && eventsData.success) {
        setPlayers(playersData.players);
        setEvents(eventsData.events);
      } else {
        throw new Error('解析伺服器數據時發生錯誤');
      }
    } catch (err: any) {
      setErrorMessage(err.message || '無法連線到點名伺服器，請稍候重試。');
    } finally {
      setLoading(false);
    }
  };

  const handleResetAllData = async () => {
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        refreshAllData();
      }
    } catch (err) {
      console.error('重置失敗', err);
    } finally {
      setShowResetConfirm(false);
    }
  };

  // Find all active sign-in events (Requirement 5)
  const activeEvents = events.filter(e => e.isActive);
  const activeEvent = activeEvents[0] || null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased flex flex-col justify-between" id="app-root-container">
      {/* Upper Navigation Header Bar */}
      <header className="bg-slate-50 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sticky top-0 z-40" id="global-header">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Branding */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#f63939] flex items-center justify-center text-white shadow-md shadow-indigo-150 shrink-0 font-display font-bold text-xl">
              周
            </div>
            <div>
              <span className="font-display font-extrabold text-slate-800 tracking-tight block text-lg md:text-xl">
                周瑜英雄命世集合區
              </span>
              <span className="text-[10px] font-bold text-slate-400 block tracking-widest uppercase font-mono">
                ROLL CALL SYSTEM • MULTI-DEVICE SUPPORT
              </span>
            </div>
          </div>

          {/* Tools & Tab Switch Router */}
          <div className="flex flex-wrap items-center gap-3 self-center md:self-auto">
            <div className="flex bg-slate-100 p-1 rounded-xl self-center" id="navigation-tabs">
              <button
                id="tab-signin"
                onClick={() => setActiveTab('signin')}
                className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                  activeTab === 'signin'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>玩家簽到</span>
              </button>

              <button
                id="tab-admin"
                onClick={() => setActiveTab('admin')}
                className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                  activeTab === 'admin'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>活動主控台</span>
              </button>

              <button
                id="tab-roster"
                onClick={() => setActiveTab('roster')}
                className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                  activeTab === 'roster'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>名冊與歷史</span>
              </button>
            </div>

            {/* Quick status refresher button */}
            <button
              id="global-refresher-btn"
              onClick={refreshAllData}
              title="點擊同步最新點名進度"
              className="p-2 px-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-all text-xs cursor-pointer flex items-center gap-2 font-bold shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${loading ? 'animate-spin' : ''}`} />
              <span className="text-slate-700">重新整理</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full" id="global-main-content">
        {loading && players.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
            <span className="text-xs font-mono text-slate-400 tracking-wider">正在連線資料庫載入遊戲名單中...</span>
          </div>
        ) : errorMessage ? (
          <div className="max-w-md mx-auto my-12 bg-rose-50 border border-rose-100 rounded-2xl p-6 text-center">
            <div className="bg-rose-100 text-rose-700 p-2.5 rounded-full w-10 h-10 mx-auto flex items-center justify-center mb-3 font-mono font-bold text-lg">!</div>
            <h3 className="font-bold text-rose-950">系統加載異常</h3>
            <p className="text-xs text-rose-800 mt-2">{errorMessage}</p>
            <button
              onClick={refreshAllData}
              className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              再試一次
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'signin' && (
                <PlayerSignIn 
                  activeEvents={activeEvents} 
                  players={players} 
                  onSignInSuccess={refreshAllData} 
                  allEvents={events}
                />
              )}

              {activeTab === 'admin' && (
                !isAdminAuthenticated ? (
                  <div className="max-w-md mx-auto my-8 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center space-y-6" id="admin-password-gate">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                      <Lock className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-xl font-display font-extrabold text-slate-800">活動主控台</h3>
                      <p className="text-xs font-semibold text-slate-400 mt-1">此區域受管理密碼保護，請輸入密碼以進行存取。</p>
                    </div>
                    
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const pwdInput = form.elements.namedItem('adminPassword') as HTMLInputElement;
                      if (pwdInput.value === '1231') {
                        setIsAdminAuthenticated(true);
                      } else {
                        alert('密碼錯誤！請重新嘗試。');
                        pwdInput.value = '';
                        pwdInput.focus();
                      }
                    }} className="space-y-4">
                      <input
                        type="password"
                        name="adminPassword"
                        required
                        placeholder="請輸入管理密碼"
                        className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-center font-bold tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold shadow-xs cursor-pointer transition-colors"
                      >
                        確認並登入
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-end pr-2">
                      <button
                        onClick={() => setIsAdminAuthenticated(false)}
                        className="text-xs text-rose-600 hover:text-rose-700 font-bold px-3 py-1.5 bg-rose-50 rounded-xl hover:bg-rose-100 transition-colors cursor-pointer"
                      >
                        🔒 登出活動主控台
                      </button>
                    </div>
                    <AdminDashboard 
                      events={events}
                      players={players}
                      activeEvent={activeEvent}
                      onRefresh={refreshAllData}
                      onSelectEvent={setSelectedEventId}
                      selectedEventId={selectedEventId}
                    />
                  </div>
                )
              )}

              {activeTab === 'roster' && (
                !isRosterAuthenticated ? (
                  <div className="max-w-md mx-auto my-8 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center space-y-6" id="roster-password-gate">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                      <Lock className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-xl font-display font-extrabold text-slate-800">名冊與歷史記錄</h3>
                      <p className="text-xs font-semibold text-slate-400 mt-1">此區域受管理密碼保護，請輸入密碼以進行存取。</p>
                    </div>
                    
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const pwdInput = form.elements.namedItem('rosterPassword') as HTMLInputElement;
                      if (pwdInput.value === '1231') {
                        setIsRosterAuthenticated(true);
                      } else {
                        alert('密碼錯誤！請重新嘗試。');
                        pwdInput.value = '';
                        pwdInput.focus();
                      }
                    }} className="space-y-4">
                      <input
                        type="password"
                        name="rosterPassword"
                        required
                        placeholder="請輸入管理密碼"
                        className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-center font-bold tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold shadow-xs cursor-pointer transition-colors"
                      >
                        確認並登入
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-end pr-2">
                      <button
                        onClick={() => setIsRosterAuthenticated(false)}
                        className="text-xs text-rose-600 hover:text-rose-700 font-bold px-3 py-1.5 bg-rose-50 rounded-xl hover:bg-rose-100 transition-colors cursor-pointer"
                      >
                        🔒 登出名冊與歷史
                      </button>
                    </div>
                    <HistoryAndRoster 
                      players={players}
                      onRefresh={refreshAllData}
                      onResetAll={() => setShowResetConfirm(true)}
                    />
                  </div>
                )
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Footer info line */}
      <footer className="bg-white border-t border-slate-100 py-5 text-center text-xs text-slate-400 font-mono tracking-wide" id="global-footer">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 周瑜英雄命世集合區 • 支援智慧自動排版 CSV 讀取</span>
          <div className="flex items-center gap-1 text-[10px] text-slate-300">
            <span>伺服器通訊正常</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
          </div>
        </div>
      </footer>

      {/* 全域資料清空確認對話框 */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-xs" id="reset-confirm-overlay">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-display font-extrabold text-slate-800">確定清除所有資料？</h3>
              <p className="text-xs font-semibold text-slate-450 mt-1.5 leading-relaxed">
                🚨 警告：這將會清空全體玩家名冊以及建立過的所有簽到活動、點名存檔。此操作不可還原，您確定要清零嗎？
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleResetAllData}
                className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs animate-pulse"
              >
                確認清除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
