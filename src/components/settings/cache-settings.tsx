'use client';

import React, { useRef, useState } from 'react';
import { Download, Upload, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePerformanceStore } from '@/hooks/use-performance-store';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function CacheSettings() {
  const { trialLog, gameStates, clearLog, importLog } = usePerformanceStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{type: 'success' | 'error', msg: string} | null>(null);

  const handleExport = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      version: 1,
      gameStates: gameStates,
      trialLog: trialLog,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cognitive-crucible-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatus({ type: 'success', msg: 'Cache exported successfully.' });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target?.result as string);
        if (!data.gameStates || !data.trialLog) throw new Error('Invalid format');
        importLog({ gameStates: data.gameStates, trialLog: data.trialLog });
        setStatus({ type: 'success', msg: `Imported ${data.trialLog.length} trials.` });
      } catch {
        setStatus({ type: 'error', msg: 'Invalid backup file.' });
      }
    };
    reader.readAsText(file);
    if (e.target) {
        e.target.value = '';
    }
  };

  const handleClear = () => {
    clearLog();
    setStatus({ type: 'success', msg: 'Cache cleared and all levels reset.' });
  };

  return (
    <div className="w-full max-w-lg bg-background rounded-2xl border p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Data Cache Settings</h2>
          <p className="text-sm text-muted-foreground mt-1">
            All trial data is stored locally on this device. Export to back up, import to restore, or clear to start fresh.
          </p>
        </div>

        <div className="bg-muted/50 rounded-xl p-4 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Cached trials</span>
            <span className="font-mono text-foreground">{trialLog.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Modules with data</span>
            <span className="font-mono text-foreground">
              {new Set(trialLog.map((t) => t.module_id)).size} / 8
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleExport}
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Cache as JSON
          </Button>

          <Button
            onClick={() => fileRef.current?.click()}
            className="w-full"
            variant="secondary"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import from Backup
          </Button>
          <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />

          <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                    variant="destructive"
                    className="w-full"
                >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All Cached Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete all your locally stored trial data and reset your progress levels for all games.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClear}>Yes, clear everything</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>
        </div>

        {status && (
          <div
            className={`flex items-center gap-2 text-sm p-3 rounded-lg ${
              status.type === 'success' ? 'bg-green-500/10 text-green-700 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-500/10 text-red-700 dark:bg-red-900/50 dark:text-red-300'
            }`}
          >
            {status.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {status.msg}
          </div>
        )}
      </div>
  );
}
