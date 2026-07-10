import React, { useState, useRef } from 'react';
import Navbar from '../components/Navbar';
import * as attendanceService from '../services/attendanceService';
import { useAuth } from '../hooks/useAuth';
import { Trash2, ShieldAlert, Download, Upload, FileJson } from 'lucide-react';

const Settings = () => {
    const { logout } = useAuth();
    const fileInputRef = useRef(null);
    const [infoMsg, setInfoMsg] = useState('');
    const [errMsg, setErrMsg] = useState('');
    const [loading, setLoading] = useState(false);

    const handleClearLogs = async () => {
        if (!confirm('Are you sure you want to clear your entire Bunk History logs? Your attendance counts will reset to 0% but your courses and timetable will remain intact.')) return;
        setLoading(true);
        setInfoMsg('');
        setErrMsg('');
        
        try {
            const res = await attendanceService.resetState('logs');
            setInfoMsg(res.message || 'Bunk history logs cleared.');
        } catch (error) {
            setErrMsg('Failed to clear logs.');
        } finally {
            setLoading(false);
        }
    };

    const handleFactoryReset = async () => {
        if (!confirm('WARNING: Are you sure you want to trigger a Factory Reset? This will permanently delete all your logged subjects, timetable slots, and activity history. This action CANNOT be undone.')) return;
        setLoading(true);
        setInfoMsg('');
        setErrMsg('');

        try {
            const res = await attendanceService.resetState('factory');
            setInfoMsg(res.message || 'Factory reset completed successfully.');
        } catch (error) {
            setErrMsg('Failed to factory reset database.');
        } finally {
            setLoading(false);
        }
    };

    const handleExportBackup = async () => {
        setInfoMsg('');
        setErrMsg('');
        try {
            // Get all data states
            const [subjects, timetable, logs] = await Promise.all([
                attendanceService.getSubjects(),
                attendanceService.getTimetable(),
                attendanceService.getLogs()
            ]);

            const backupData = {
                subjects,
                timetable,
                logs,
                exportedAt: new Date().toISOString()
            };

            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", `btech_attendance_backup_${new Date().toISOString().slice(0,10)}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();

            setInfoMsg('JSON backup data exported and downloaded successfully.');
        } catch (error) {
            setErrMsg('Failed to export data backup.');
        }
    };

    const handleImportClick = () => {
        fileInputRef.current.click();
    };

    const handleImportBackup = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setInfoMsg('');
        setErrMsg('');
        setLoading(true);

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target.result);
                
                // Simple validation of imports
                if (!data.subjects || !data.timetable) {
                    throw new Error('Invalid backup file structure.');
                }

                // Import subjects and timetable
                // To restore all entries, we can clear the database first, then insert new items.
                // For simplicity, let's write a batch import handler or import it item by item.
                // In MERN, importing state means we can create a dedicated endpoint or update states.
                // Let's call the reset endpoint for factory reset, then loop through subjects and create them!
                // Wait! A cleaner way is to post the backup directly to the server.
                // Let's do that! We can add a POST /api/attendance/import endpoint to server.js!
                // Wait! Let's check: our server currently does not have an import endpoint.
                // But we can easily write the backup restore logic directly on the client by calling addSubject/addTimetableSlot!
                // Let's implement client-side import restore logic to keep it simple and clean:
                
                // 1. Factory Reset
                await attendanceService.resetState('factory');

                // 2. Loop and Create Subjects
                const subjectIdMap = {};
                for (const sub of data.subjects) {
                    const createdSub = await attendanceService.addSubject({
                        name: sub.name,
                        code: sub.code,
                        color: sub.color
                    });
                    
                    // Update the counts
                    await attendanceService.updateSubject(createdSub._id, {
                        attended: sub.attended,
                        conducted: sub.conducted
                    });

                    subjectIdMap[sub._id] = createdSub._id;
                }

                // 3. Loop and Create Timetable Slots
                const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                for (const day of days) {
                    if (data.timetable[day]) {
                        for (const slot of data.timetable[day]) {
                            // Resolve the new subject ID
                            const oldSubId = slot.subjectId?._id || slot.subjectId;
                            const newSubId = subjectIdMap[oldSubId];
                            if (newSubId) {
                                await attendanceService.addTimetableSlot({
                                    day,
                                    time: slot.time,
                                    subjectId: newSubId,
                                    room: slot.room
                                });
                            }
                        }
                    }
                }

                setInfoMsg('JSON backup data imported and restored successfully!');
                setTimeout(() => window.location.reload(), 1500);
            } catch (err) {
                console.error(err);
                setErrMsg('Failed to import backup: ' + err.message);
            } finally {
                setLoading(false);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div style={{ display: 'flex', flex: 1, flexDirection: 'column' }}>
            <Navbar 
                title="System Settings" 
                subtitle="Manage your database storage, backups, and resets" 
            />

            {infoMsg && (
                <div className="projection-banner safe" style={{ marginBottom: '1.5rem' }}>
                    <span>{infoMsg}</span>
                </div>
            )}

            {errMsg && (
                <div className="projection-banner danger" style={{ marginBottom: '1.5rem' }}>
                    <span>{errMsg}</span>
                </div>
            )}

            <div className="settings-grid">
                {/* Backups Panel */}
                <div className="card settings-card">
                    <div className="panel-header" style={{ marginBottom: '0.5rem' }}>
                        <h2>Data Backups</h2>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                        Export your subjects, logs, and timetable schedule as a JSON backup file, 
                        or import a previous backup file to restore your settings on a new device.
                    </p>

                    <div className="settings-actions">
                        <button className="btn btn-outline" onClick={handleExportBackup} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <Download size={18} />
                            <span>Export Backup (JSON)</span>
                        </button>
                        
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleImportBackup} 
                            style={{ display: 'none' }} 
                            accept=".json"
                        />
                        <button className="btn btn-outline" onClick={handleImportClick} disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <Upload size={18} />
                            <span>Import Backup (JSON)</span>
                        </button>
                    </div>
                </div>

                {/* Storage Resets Panel */}
                <div className="card settings-card danger-card">
                    <div className="panel-header" style={{ marginBottom: '0.5rem' }}>
                        <h2>Database Operations</h2>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                        Reset attendance history logs, or completely wipe all database schemas to start clean. 
                        Wiped records cannot be restored.
                    </p>

                    <div className="settings-actions">
                        <button className="btn btn-outline" onClick={handleClearLogs} disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', borderColor: 'rgba(245, 158, 11, 0.3)', color: 'var(--accent-orange)' }}>
                            <Trash2 size={18} />
                            <span>Reset Bunk Logs</span>
                        </button>
                        <button className="btn btn-danger" onClick={handleFactoryReset} disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <ShieldAlert size={18} />
                            <span>Factory Reset App</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
