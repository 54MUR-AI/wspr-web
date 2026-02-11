import React, { useState, useEffect } from 'react';
import { Shield, Smartphone, History, Download, Trash2, Key } from 'lucide-react';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { privacyService, PrivacySettings, DeviceInfo } from '../../services/privacy.service';
import { formatDistanceToNow } from 'date-fns';

const PrivacySettingsComponent: React.FC = () => {
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [retentionStats, setRetentionStats] = useState<{
    totalMessages: number;
    oldestMessage: string;
    storageUsed: number;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [settingsData, devicesData, stats] = await Promise.all([
        privacyService.getPrivacySettings(),
        privacyService.getDevices(),
        privacyService.getMessageRetentionStats(),
      ]);
      setSettings(settingsData);
      setDevices(devicesData);
      setRetentionStats(stats);
    } catch (err) {
      setError('Failed to load privacy settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = async (
    key: keyof PrivacySettings,
    value: any
  ) => {
    try {
      const updatedSettings = await privacyService.updatePrivacySettings({
        [key]: value,
      });
      setSettings(updatedSettings);
    } catch (err) {
      setError('Failed to update settings');
    }
  };

  const handleDeviceRemoval = async (deviceId: string) => {
    try {
      await privacyService.removeDevice(deviceId);
      setDevices(devices.filter((d) => d.id !== deviceId));
    } catch (err) {
      setError('Failed to remove device');
    }
  };

  const handle2FASetup = async () => {
    try {
      const { qrCode, backupCodes } = await privacyService.enable2FA();
      // Show QR code and backup codes to user
      setShow2FADialog(false);
    } catch (err) {
      setError('Failed to enable 2FA');
    }
  };

  const handleAccountDeletion = async () => {
    try {
      await privacyService.deleteAccount(password);
      // Redirect to logout
    } catch (err) {
      setError('Failed to delete account');
    }
  };

  const handleDataExport = async () => {
    try {
      const blob = await privacyService.exportData();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'wspr-data-export.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to export data');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList>
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="devices">Devices</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="data">Data & Backup</TabsTrigger>
      </TabsList>

      <TabsContent value="general">
        <Card>
          <CardHeader>
            <CardTitle>Privacy Settings</CardTitle>
            <CardDescription>
              Configure your privacy and visibility preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="readReceipts">Read Receipts</Label>
                <Switch
                  id="readReceipts"
                  checked={settings.readReceipts}
                  onCheckedChange={(checked) =>
                    handleSettingChange('readReceipts', checked)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Online Status</Label>
                <Select
                  value={settings.onlineStatus}
                  onValueChange={(value) =>
                    handleSettingChange('onlineStatus', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="everyone">Everyone</SelectItem>
                    <SelectItem value="contacts">Contacts Only</SelectItem>
                    <SelectItem value="nobody">Nobody</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Last Seen</Label>
                <Select
                  value={settings.lastSeen}
                  onValueChange={(value) =>
                    handleSettingChange('lastSeen', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="everyone">Everyone</SelectItem>
                    <SelectItem value="contacts">Contacts Only</SelectItem>
                    <SelectItem value="nobody">Nobody</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="typingIndicators">Typing Indicators</Label>
                <Switch
                  id="typingIndicators"
                  checked={settings.typingIndicators}
                  onCheckedChange={(checked) =>
                    handleSettingChange('typingIndicators', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="mediaAutoDownload">Auto-download Media</Label>
                <Switch
                  id="mediaAutoDownload"
                  checked={settings.mediaAutoDownload}
                  onCheckedChange={(checked) =>
                    handleSettingChange('mediaAutoDownload', checked)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="devices">
        <Card>
          <CardHeader>
            <CardTitle>Connected Devices</CardTitle>
            <CardDescription>
              Manage your connected devices and sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {devices.map((device) => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{device.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {device.browser} on {device.os}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Last active{' '}
                        {formatDistanceToNow(new Date(device.lastActive), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeviceRemoval(device.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="security">
        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>
              Configure two-factor authentication and security preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Two-Factor Authentication</h4>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Button
                variant={settings.twoFactorAuth ? 'destructive' : 'default'}
                onClick={() => setShow2FADialog(true)}
              >
                {settings.twoFactorAuth ? 'Disable 2FA' : 'Enable 2FA'}
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Device Limit</Label>
              <Select
                value={settings.deviceLimit.toString()}
                onValueChange={(value) =>
                  handleSettingChange('deviceLimit', parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 device</SelectItem>
                  <SelectItem value="2">2 devices</SelectItem>
                  <SelectItem value="3">3 devices</SelectItem>
                  <SelectItem value="5">5 devices</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="data">
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>
              Manage your data, backups, and message retention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {retentionStats && (
              <div className="space-y-2">
                <h4 className="font-medium">Storage Usage</h4>
                <p className="text-sm text-muted-foreground">
                  {(retentionStats.storageUsed / 1024 / 1024).toFixed(2)} MB used
                </p>
                <p className="text-sm text-muted-foreground">
                  {retentionStats.totalMessages} messages stored
                </p>
                <p className="text-sm text-muted-foreground">
                  Oldest message from{' '}
                  {formatDistanceToNow(new Date(retentionStats.oldestMessage), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label>Message Retention</Label>
                <Select
                  value={settings.messageRetention.toString()}
                  onValueChange={(value) =>
                    handleSettingChange('messageRetention', parseInt(value))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select retention period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Keep forever</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="1">24 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="defaultExpiry">Default Message Expiry</Label>
                <Switch
                  id="defaultExpiry"
                  checked={settings.defaultMessageExpiry !== null}
                  onCheckedChange={(checked) =>
                    handleSettingChange('defaultMessageExpiry', checked ? 24 * 60 * 60 : null)
                  }
                />
              </div>

              {settings.defaultMessageExpiry !== null && (
                <div className="space-y-2">
                  <Label>Default Expiry Time</Label>
                  <Select
                    value={settings.defaultMessageExpiry.toString()}
                    onValueChange={(value) =>
                      handleSettingChange('defaultMessageExpiry', parseInt(value))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select expiry time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3600">1 hour</SelectItem>
                      <SelectItem value="86400">24 hours</SelectItem>
                      <SelectItem value="604800">7 days</SelectItem>
                      <SelectItem value="2592000">30 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label htmlFor="allowScreenshots">Allow Screenshots</Label>
                <Switch
                  id="allowScreenshots"
                  checked={settings.allowScreenshots}
                  onCheckedChange={(checked) =>
                    handleSettingChange('allowScreenshots', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="encryptedBackup">Encrypted Backups</Label>
                <Switch
                  id="encryptedBackup"
                  checked={settings.encryptedBackup}
                  onCheckedChange={(checked) =>
                    handleSettingChange('encryptedBackup', checked)
                  }
                />
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleDataExport}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* 2FA Dialog */}
      <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {settings.twoFactorAuth
                ? 'Disable Two-Factor Authentication'
                : 'Enable Two-Factor Authentication'}
            </DialogTitle>
          </DialogHeader>
          {/* 2FA setup UI */}
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                This action cannot be undone. All your data will be permanently
                deleted.
              </AlertDescription>
            </Alert>
            <Input
              type="password"
              placeholder="Enter your password to confirm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleAccountDeletion}
            >
              Delete Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
};

export default PrivacySettingsComponent;
