/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Search, Users, Download, Upload, Trash2, CalendarCheck, 
  Award, FileSpreadsheet, AlertCircle, RefreshCw, Plus, Heart, User 
} from 'lucide-react';
import { Player } from '../types';

interface HistoryAndRosterProps {
  players: Player[];
  onRefresh: () => void;
  onResetAll: () => void;
}

interface PlayerRecord {
  eventId: string;
  eventTitle: string;
  date: string;
  present: boolean;
  timestamp: string | null;
  method: 'self' | 'admin' | null;
}

interface PlayerHistory {
  playerId: string;
  playerName: string;
  group: string;
  serial?: number;
  attendedCount: number;
  totalEvents: number;
  attendanceRate: number;
  records: PlayerRecord[];
}

export default function HistoryAndRoster({ players, onRefresh, onResetAll }: HistoryAndRosterProps) {
  const [historyData, setHistoryData] = useState<PlayerHistory[]>([]);
  const [historyEvents, setHistoryEvents] = useState<{ id: string; title: string; date: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  
  // Player selected for detailed view modal
  const [selectedHistory, setSelectedHistory] = useState<PlayerHistory | null>(null);

  // Manual Roster Add Action
  const [showAddManual, setShowAddManual] = useState<boolean>(false);
  const [manualName, setManualName] = useState<string>('');
  const [manualGroup, setManualGroup] = useState<string>('');
  const [isCustomGroup, setIsCustomGroup] = useState<boolean>(false);
  const [addingPlayer, setAddingPlayer] = useState<boolean>(false);

  // CSV Import State
  const [csvPasteText, setCsvPasteText] = useState<string>('');
  const [importingCSV, setImportingCSV] = useState<boolean>(false);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvSuccessCount, setCsvSuccessCount] = useState<number | null>(null);
  const [showCSVPanel, setShowCSVPanel] = useState<boolean>(false);

  const groups = Array.from(new Set(players.map(p => p.group))).filter(Boolean);

  useEffect(() => {
    fetchHistory();
  }, [players]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/players/history');
      const data = await res.json();
      if (data.success) {
        setHistoryData(data.history);
        setHistoryEvents(data.events);
      }
    } catch (err) {
      console.error('Failed to fetch attendance history summaries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;

    setAddingPlayer(true);
    try {
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: manualName.trim(),
          group: manualGroup.trim() || '未分組'
        })
      });
      const data = await res.json();
      if (data.success) {
        setManualName('');
        setManualGroup('');
        setIsCustomGroup(false);
        setShowAddManual(false);
        onRefresh();
      }
    } catch (err) {
      alert('新增玩家失敗');
    } finally {
      setAddingPlayer(false);
    }
  };

  const handleCSVImport = async () => {
    if (!csvPasteText.trim()) {
      setCsvError('請先貼上 CSV 內容或匯入檔案');
      return;
    }

    setImportingCSV(true);
    setCsvError(null);
    setCsvSuccessCount(null);

    try {
      const res = await fetch('/api/players/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvText: csvPasteText })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCsvSuccessCount(data.count);
        setCsvPasteText('');
        // Close CSV tab slightly later to show success
        setTimeout(() => {
          setShowCSVPanel(false);
          setCsvSuccessCount(null);
        }, 3000);
        onRefresh();
      } else {
        setCsvError(data.error || '匯入發生錯誤，請檢查儲存格與行數是否吻合。');
      }
    } catch (err) {
      setCsvError('網路連線失敗，請稍後重試');
    } finally {
      setImportingCSV(false);
    }
  };

  // Drag & drop reader
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        setCsvPasteText(text);
      }
    };
    reader.readAsText(file);
  };

  // Core Merged Export to CSV logic with Excel Native Traditional Chinese BOM fix
  const handleExportCSV = () => {
    if (historyData.length === 0) return;

    // Excel Traditional Chinese readable UTF-8 BOM Header
    // Columns: Index, Name, Group, ...Events title columns, Attended count, Rate
    const headers = [
      '編號', 
      '姓名', 
      '分組項目', 
      ...historyEvents.map(e => `活動: ${e.title}`), 
      '累計出席次數', 
      '總活動次數', 
      '出席機率'
    ];
    
    const csvContent = [];
    csvContent.push(headers.join(','));

    historyData.forEach(player => {
      const row = [
        player.serial || '',
        `"${player.playerName.replace(/"/g, '""')}"`,
        `"${player.group.replace(/"/g, '""')}"`,
        ...player.records.map(r => r.present ? `"${new Date(r.timestamp!).toLocaleString('zh-TW', { hour12: false }).replace(/"/g, '""')}"` : '"未簽到"'),
        player.attendedCount,
        player.totalEvents,
        `"${player.attendanceRate}%"`
      ];
      csvContent.push(row.join(','));
    });

    const rawCSV = csvContent.join('\n');
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), rawCSV], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `全體玩家點名出席統計總表_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtering roster display list
  const filteredHistory = historyData.filter(h => {
    const matchesGroup = selectedGroup ? h.group === selectedGroup : true;
    const matchesSearch = searchQuery
      ? h.playerName.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesGroup && matchesSearch;
  });  return (
    <div className="space-y-6" id="history-roster-root">
      
      {/* Top Banner Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 md:p-8 rounded-3xl border border-slate-250 shadow-sm animate-fade-in">
        <div>
          <h2 className="text-xl font-black text-slate-800 font-display flex items-center gap-2.5">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
            名單管理與歷史記錄查詢
          </h2>
          <p className="text-xs font-semibold text-slate-455 mt-1 leading-relaxed">
            搜尋各玩家名單的點名記錄，或一鍵匯出 Excel 點名出席總表。
          </p>
        </div>

        {/* Buttons Group */}
        <div className="flex flex-wrap gap-2.5" id="roster-top-actions">
          <button
            id="btn-show-add-manual"
            onClick={() => setShowAddManual(prev => !prev)}
            className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            手動新增玩家
          </button>
          
          <button
            id="btn-show-import-csv"
            onClick={() => setShowCSVPanel(prev => !prev)}
            className="px-4 py-2 border border-slate-200 text-indigo-700 hover:bg-indigo-50/50 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
          >
            <Upload className="w-4 h-4" />
            匯入 CSV 檔案
          </button>

          <button
            id="btn-export-reports"
            onClick={handleExportCSV}
            disabled={historyData.length === 0}
            className={`px-4 py-2.5 font-bold text-white rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-3xs transition-all active:scale-95 ${
              historyData.length === 0 
                ? 'bg-slate-300 pointer-events-none' 
                : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-50'
            }`}
          >
            <Download className="w-4 h-4" />
            自動匯出簽到記錄 (EXCEL)
          </button>
        </div>
      </div>

      {/* Manual Add Card Panel */}
      {showAddManual && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 md:p-8 rounded-3xl border border-slate-250 shadow-sm animate-fade-in"
          id="manual-add-panel"
        >
          <form onSubmit={handleManualAdd} className="space-y-4">
            <div className="flex items-center gap-1.5 border-b border-slate-150 pb-3 mb-4">
              <Users className="w-4 h-4 text-indigo-600" />
              <h3 className="font-display font-extrabold text-slate-800 text-sm">手動加入單一玩家到名單</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">玩家姓名 *</label>
                <input
                  id="add-player-name-input"
                  type="text"
                  required
                  placeholder="請輸入名字，例如：十單丨陳大夫"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                />
              </div>
              <div>
                {isCustomGroup ? (
                  <>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">輸入自訂分組項目 *</label>
                    <div className="flex gap-2">
                      <input
                        id="add-player-group-input"
                        type="text"
                        required
                        placeholder="例如：風雲組、十單組"
                        value={manualGroup}
                        onChange={(e) => setManualGroup(e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomGroup(false);
                          setManualGroup('');
                        }}
                        className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border border-slate-200"
                      >
                        返回選擇
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">分組項目（選填，預設為未分組）</label>
                    <select
                      id="add-player-group-select"
                      value={manualGroup}
                      onChange={(e) => {
                        if (e.target.value === '__CUSTOM__') {
                          setIsCustomGroup(true);
                          setManualGroup('');
                        } else {
                          setManualGroup(e.target.value);
                        }
                      }}
                      className="w-full h-[38px] px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white cursor-pointer"
                    >
                      <option value="">（未分組）</option>
                      {groups.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                      <option value="__CUSTOM__">➕ 新增自訂分組 / 班級...</option>
                    </select>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowAddManual(false);
                  setIsCustomGroup(false);
                  setManualGroup('');
                }}
                className="px-4 py-2 text-slate-500 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer"
              >
                取消
              </button>
              <button
                type="submit"
                id="btn-submit-player"
                disabled={addingPlayer}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
              >
                {addingPlayer ? '加入中...' : '確認新增玩家'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* CSV Batch Ingestion panel */}
      {showCSVPanel && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 md:p-8 rounded-3xl border border-slate-250 shadow-sm space-y-4 animate-fade-in"
          id="csv-batch-panel"
        >
          <div className="flex items-center justify-between border-b border-slate-150 pb-3 mb-4">
            <h3 className="font-display font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              匯入新玩家名單 (CSV 批量模式)
            </h3>
            
            {/* Quick Template Download Link */}
            <a 
              href="/default-players.csv" 
              download="活動點名預設名單.csv"
              className="text-xs text-indigo-650 hover:underline flex items-center gap-1 font-bold"
            >
              下載標準範本 CSV
            </a>
          </div>

          <div className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200">
            💡 系統支援兩種格式：<br />
            1. <strong>群組並排格式 (如您的遊戲表格)</strong>：第一列包含各個 “風雲組(6)” ，“十單組” 等專欄，其後資料行序號欄與名稱欄並排列舉。<br />
            2. <strong>直列式 2 欄位格式</strong>：首列欄位 header 為 "名稱,組別"，其後每行包含 "王小明,風雲組"。系統會自動判定結構進行載入！
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 font-mono">1. 選取 CSV 檔案</label>
              <input
                id="csv-file-uploader"
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="w-full text-xs text-slate-550 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer border border-dashed border-slate-250 p-2.5 rounded-2xl bg-slate-50/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 font-mono">2. 或者直接貼上 CSV 文字</label>
              <textarea
                id="csv-textarea-input"
                rows={4}
                value={csvPasteText}
                onChange={(e) => setCsvPasteText(e.target.value)}
                placeholder="將 Excel 表格複製或將 CSV 內容整段貼到這裡..."
                className="w-full px-4 py-2 border border-slate-200 bg-slate-50/30 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
              />
            </div>
          </div>

          {/* Feedback logs */}
          {csvError && (
            <div className="p-3 bg-rose-50 text-rose-800 text-xs rounded-xl flex items-start gap-2 border border-rose-100">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{csvError}</span>
            </div>
          )}

          {csvSuccessCount !== null && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-start gap-2 border border-emerald-100 animate-pulse">
              <CalendarCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>成功匯入 {csvSuccessCount} 名玩家！原有名單已被更換。</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              onClick={() => {
                setShowCSVPanel(false);
                setCsvError(null);
                setCsvSuccessCount(null);
              }}
              className="px-4 py-2 text-slate-500 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer"
            >
              取消
            </button>
            <button
              onClick={handleCSVImport}
              id="btn-execute-csv-import"
              disabled={importingCSV}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
            >
              確認匯入並取代名單
            </button>
          </div>
        </motion.div>
      )}

      {/* Main Table view of whole Roster */}
      <div className="bg-white rounded-3xl border border-slate-205 shadow-sm overflow-hidden" id="roster-players-table-card">
        
        {/* Search and control bar in table header */}
        <div className="p-6 md:p-8 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h3 className="font-display font-black text-slate-800 text-sm">
              全體玩家名冊與點名出席率
            </h3>
            <span className="text-[10px] bg-slate-200 text-slate-705 px-2.5 py-0.5 rounded-full font-mono font-extrabold">
              共計 {players.length} 名
            </span>
          </div>

          <div className="flex flex-wrap gap-2.5 items-center">
            {/* Group classifications selection */}
            <select
              id="roster-group-selector"
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">所有分組</option>
              {groups.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>

            {/* Keyword search field */}
            <div className="relative">
              <input
                id="roster-search-field"
                type="text"
                placeholder="搜尋姓名關鍵字..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-2 w-48 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
              />
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
            </div>

            {/* Clear database action */}
            <button
              id="btn-danger-reset"
              onClick={onResetAll}
              className="p-1 px-3 text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-150 rounded-xl text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition-all uppercase"
              title="清空所有玩家與簽到歷史數據以重置系統"
            >
              <Trash2 className="w-3 h-3" /> 清空重置
            </button>
          </div>
        </div>

        {/* Global Listing Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-24 text-center text-slate-400 font-mono text-xs flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
              正在重新核算最新的出缺席記錄...
            </div>
          ) : filteredHistory.length > 0 ? (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-455 font-mono tracking-widest">
                  <th className="py-3 px-6">原分組序號</th>
                  <th className="py-3 px-6 col-span-2">姓名</th>
                  <th className="py-3 px-6">目前分組</th>
                  <th className="py-3 px-6 text-center">簽到出席次數</th>
                  <th className="py-3 px-6 text-center">出席率率值</th>
                  <th className="py-3 px-6 text-right">詳細列表</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredHistory.map((row, index) => (
                  <tr 
                    key={row.playerId} 
                    className="hover:bg-slate-50/70 transition-colors"
                    id={`roster-row-${row.playerId}`}
                  >
                    <td className="py-3.5 px-6 font-mono text-slate-400 font-bold">
                       {row.serial ? `#${row.serial}` : `${index + 1}`}
                    </td>
                    <td className="py-3.5 px-6 font-extrabold text-slate-800">
                      {row.playerName}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px]">
                        {row.group}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-center font-mono">
                      <span className="font-extrabold text-slate-800">{row.attendedCount}</span>
                      <span className="text-slate-400 text-[10px] font-extrabold"> / {row.totalEvents} 次</span>
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className={`font-mono font-black ${
                          row.attendanceRate >= 80 
                            ? 'text-emerald-600' 
                            : row.attendanceRate >= 50 
                            ? 'text-indigo-650' 
                            : 'text-rose-500'
                        }`}>
                          {row.attendanceRate}%
                        </span>
                        
                        {/* Rating pill style indicator */}
                        <div className="w-12 bg-slate-200/60 h-1.5 rounded-full relative overflow-hidden hidden sm:block">
                          <div 
                            className={`h-full rounded-full ${
                              row.attendanceRate >= 80 
                                ? 'bg-emerald-500' 
                                : row.attendanceRate >= 50 
                                ? 'bg-indigo-500' 
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${row.attendanceRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        id={`btn-view-player-detail-${row.playerId}`}
                        onClick={() => setSelectedHistory(row)}
                        className="px-3 py-1.5 text-xs text-indigo-650 hover:bg-indigo-50/50 rounded-xl border border-indigo-150 hover:border-indigo-250 transition-all font-bold cursor-pointer active:scale-95"
                      >
                        出席明細
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-24 text-center text-slate-400 font-sans text-xs">
              找不到符合搜尋條件的玩家姓名
            </div>
          )}
        </div>
      </div>

      {/* Detailed Modal of single player history */}
      {selectedHistory && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans"
          onClick={() => setSelectedHistory(null)}
          id="player-detail-modal"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-slate-250 shadow-xl max-w-sm w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-slate-50 p-6 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display font-black text-slate-800 text-sm leading-tight">
                    {selectedHistory.playerName}
                  </h4>
                  <span className="text-[10px] text-slate-450 block mt-1 font-semibold">
                    分組: {selectedHistory.group} {selectedHistory.serial ? `(#${selectedHistory.serial})` : ''}
                  </span>
                </div>
              </div>
              
              <div className="text-right">
                <span className="text-xl font-black text-indigo-600 block leading-none font-display">
                  {selectedHistory.attendanceRate}%
                </span>
                <span className="text-[9px] font-mono text-slate-400 font-extrabold block mt-1">累計出席比例</span>
              </div>
            </div>

            {/* List entries */}
            <div className="p-6 max-h-72 overflow-y-auto space-y-2.5 bg-white" id="modal-events-timeline">
              <h5 className="text-[10px] font-bold text-slate-450 uppercase tracking-widest font-mono mb-2">所有活動出席軌跡</h5>
              {selectedHistory.records.length > 0 ? (
                selectedHistory.records.map(record => (
                  <div 
                    key={record.eventId} 
                    className="p-3 bg-slate-50/50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs transition-shadow hover:shadow-2xs"
                  >
                    <div>
                      <span className="font-bold text-slate-700 block">{record.eventTitle}</span>
                      <span className="text-[9px] text-slate-400 font-mono block mt-1.5 font-semibold">
                        活動日期: {new Date(record.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      {record.present ? (
                        <div className="text-right">
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg font-sans">
                            已出席
                          </span>
                          <span className="text-[8px] font-mono text-slate-405 block mt-1">
                            {record.timestamp ? new Date(record.timestamp).toLocaleTimeString('zh-TW', { hour12: false }) : '管理員代簽'}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-rose-600 font-bold bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-lg font-sans">
                          未簽到
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs font-bold">
                  歷史上沒有發過任何點名活動
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-200 text-center">
              <button
                id="btn-close-modal"
                onClick={() => setSelectedHistory(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors w-full cursor-pointer transition-all active:scale-95"
              >
                關閉視窗
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
