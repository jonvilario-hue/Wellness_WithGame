'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Save, History, Trash2, CheckCircle, AlertTriangle, Download, Upload, Loader2, List } from 'lucide-react';
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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { format } from 'date-fns';

const SNAPSHOT_KEY_PREFIX = 'cognitune-snapshot-';
const SNAPSHOT_META_KEY_PREFIX = 'cognitune-snapshot-meta-';
const MAX_SNAPSHOTS = 10;

type SnapshotMeta = {
  date: string;
  trialCount: number;
};

export function CacheSettings() {
  const { exportData, importData, clearAllData } = usePerformanceStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{type: 'success' | 'error', msg: string} | null>(null);
  const [snapshots, setSnapshots] = useState<(SnapshotMeta | null)[]>(Array(MAX_SNAPSHOTS).fill(null));
  const [isLoading, setIsLoading] = useState<number | null>(null);

  const loadSnapshotMetadata = useCallback(() => {
    try {
      const metas = Array.from({ length: MAX_SNAPSHOTS }, (_, i) => {
        const metaJson = localStorage.getItem(`${SNAPSHOT_META_KEY_PREFIX}${i}`);
        return metaJson ? JSON.parse(metaJson) : null;
      });
      setSnapshots(metas);
    } catch (e) {
      console.error("Failed to load snapshot metadata:", e);
    }
  }, []);

  useEffect(() => {
    loadSnapshotMetadata();
  }, [loadSnapshotMetadata]);

  const handleSaveToNextSnapshot = async () => {
    const nextSlot = snapshots.findIndex(s => s === null);
    if (nextSlot === -1) {
      setStatus({ type: 'error', msg: 'All snapshot slots are full. Please delete one to save.' });
      return;
    }
    setIsLoading(nextSlot);
    setStatus(null);
    try {
      const json = await exportData();
      const trialCount = (json.match(/"type":"trial_complete"/g) || []).length;
      const meta: SnapshotMeta = {
        date: new Date().toISOString(),
        trialCount: trialCount,
      };

      localStorage.setItem(`${SNAPSHOT_KEY_PREFIX}${nextSlot}`, json);
      localStorage.setItem(`${SNAPSHOT_META_KEY_PREFIX}${nextSlot}`, JSON.stringify(meta));
      
      loadSnapshotMetadata();
      setStatus({ type: 'success', msg: `Snapshot saved to slot ${nextSlot + 1}.` });
    } catch (e) {
      console.error(e);
      setStatus({ type: 'error', msg: `Failed to save snapshot.` });
    } finally {
      setIsLoading(null);
    }
  };


  const handleLoadSnapshot = async (slotIndex: number) => {
    setIsLoading(slotIndex);
    setStatus(null);
    try {
      const json = localStorage.getItem(`${SNAPSHOT_KEY_PREFIX}${slotIndex}`);
      if (!json) throw new Error('Snapshot data not found.');
      await importData(json);
      setStatus({ type: 'success', msg: `Snapshot ${slotIndex + 1} restored. Please reload the page to see changes.` });
    } catch (e) {
      console.error(e);
      setStatus({ type: 'error', msg: `Failed to restore snapshot ${slotIndex + 1}.` });
    } finally {
      setIsLoading(null);
    }
  };

  const handleDeleteSnapshot = (slotIndex: number) => {
    localStorage.removeItem(`${SNAPSHOT_KEY_PREFIX}${slotIndex}`);
    localStorage.removeItem(`${SNAPSHOT_META_KEY_PREFIX}${slotIndex}`);
    loadSnapshotMetadata();
    setStatus({ type: 'success', msg: `Snapshot ${slotIndex + 1} deleted.` });
  };

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
        setStatus({ type: 'success', msg: 'Data imported successfully. Please reload the page.' });
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
  
  const savedCount = snapshots.filter(s => s !== null).length;

  return (
    <div className="w-full max-w-3xl space-y-8">
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

      <Card>
        <CardHeader>
          <CardTitle>Local Snapshots</CardTitle>
          <CardDescription>Save or restore points-in-time of your training data. This data is stored only in this browser.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex flex-col">
                    <p className="font-semibold">Snapshots Used</p>
                    <p className="text-sm text-muted-foreground">You have saved {savedCount} of {MAX_SNAPSHOTS} available snapshots.</p>
                </div>
                <div className="flex items-center text-2xl font-bold text-primary">
                    {savedCount} / {MAX_SNAPSHOTS}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={handleSaveToNextSnapshot} disabled={isLoading !== null || savedCount >= MAX_SNAPSHOTS}>
                    {isLoading !== null && savedCount < MAX_SNAPSHOTS ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2" />}
                    Save Current State
                </Button>
                
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="secondary" disabled={savedCount === 0}>
                        <List className="w-4 h-4 mr-2" />
                        Manage Snapshots
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-2xl">
                      <AlertDialogHeader>
                          <AlertDialogTitle>Manage Saved Snapshots</AlertDialogTitle>
                          <AlertDialogDescription>Restore a previous state or delete old snapshots to free up space. These actions cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="max-h-96 overflow-y-auto space-y-2 p-1">
                        {snapshots.map((meta, i) => {
                            if (!meta) return null;
                            return (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                    <div>
                                        <p className="font-semibold">Snapshot Slot #{i + 1}</p>
                                        <p className="text-xs text-muted-foreground">{`Saved on ${format(new Date(meta.date), "MMM d, yyyy 'at' h:mm a")} (${meta.trialCount} trials)`}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="outline" size="sm" disabled={isLoading !== null}><History className="w-4 h-4 mr-2"/>Load</Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Restore Snapshot?</AlertDialogTitle>
                                                    <AlertDialogDescription>This will overwrite your current data with Snapshot #{i+1}. This action cannot be undone.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleLoadSnapshot(i)}>Yes, Restore</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="sm" disabled={isLoading !== null}><Trash2 className="w-4 h-4 mr-2"/>Delete</Button>
                                            </AlertDialogTrigger>
                                             <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete Snapshot?</AlertDialogTitle>
                                                    <AlertDialogDescription>This will permanently delete Snapshot #{i+1}. This action cannot be undone.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteSnapshot(i)}>Yes, Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            )
                        })}
                      </div>
                      <AlertDialogFooter>
                          <AlertDialogCancel>Close</AlertDialogCancel>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>File Backup & Restore</CardTitle>
          <CardDescription>Export your data to a file for backup, or import it on another device.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button onClick={handleExport}><Download className="w-4 h-4 mr-2" /> Export to File</Button>
          <Button onClick={() => fileRef.current?.click()} variant="secondary"><Upload className="w-4 h-4 mr-2" /> Import from File</Button>
          <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
           <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full"><Trash2 className="w-4 h-4 mr-2" /> Erase All Local Data</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete all training sessions, trial logs, and adaptive difficulty profiles from this browser. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleClear}>Yes, erase everything</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>
           <p className="text-xs text-muted-foreground mt-2 text-center">This will not affect your saved snapshots.</p>
        </CardContent>
      </Card>

    </div>
  );
}
