
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
  const { exportData, importData, clearAllData } = usePerformanceStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{type: 'success' | 'error', msg: string} | null>(null);

  const handleExport = async () => {
    try {
        const json = await exportData();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cognitune-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setStatus({ type: 'success', msg: 'Data exported successfully.' });
    } catch (e) {
        console.error(e);
        setStatus({ type: 'error', msg: 'Failed to export data.' });
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const json = evt.target?.result as string;
        await importData(json);
        setStatus({ type: 'success', msg: 'Data imported successfully.' });
      } catch {
        setStatus({ type: 'error', msg: 'Invalid backup file.' });
      }
    };
    reader.readAsText(file);
    if (e.target) {
        e.target.value = '';
    }
  };

  const handleClear = async () => {
    try {
        await clearAllData();
        setStatus({ type: 'success', msg: 'All local data has been cleared.' });
    } catch (e) {
        console.error(e);
        setStatus({ type: 'error', msg: 'Failed to clear data.' });
    }
  };

  return (
    <div className="w-full max-w-lg bg-background rounded-2xl border p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Local Data Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            All your training data is stored securely on this device in your browser's IndexedDB. You can export it for backup or import it to another device.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleExport}
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            Export All Data
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
                    Clear All Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete all training sessions, trial logs, and adaptive difficulty profiles from this browser. This action cannot be undone.
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
