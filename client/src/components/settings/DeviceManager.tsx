import React, { useEffect, useState } from 'react';
import { Device, deviceService } from '../../services/device.service';
import { errorService } from '../../services/error.service';
import { Laptop, Smartphone, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const DeviceManager: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDevices();
    window.addEventListener('wspr:devices:updated', handleDevicesUpdate);
    return () => {
      window.removeEventListener('wspr:devices:updated', handleDevicesUpdate);
    };
  }, []);

  const loadDevices = async () => {
    try {
      setLoading(true);
      const deviceList = deviceService.getDevices();
      setDevices(deviceList);
    } catch (error) {
      errorService.handleError(error, 'LOAD_DEVICES_FAILED', 'medium');
    } finally {
      setLoading(false);
    }
  };

  const handleDevicesUpdate = (event: CustomEvent) => {
    setDevices(event.detail);
  };

  const handleRemoveDevice = async (deviceId: string) => {
    try {
      await deviceService.removeDevice(deviceId);
      setDevices(devices.filter(d => d.id !== deviceId));
    } catch (error) {
      errorService.handleError(error, 'REMOVE_DEVICE_FAILED', 'medium');
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="w-5 h-5" />;
      default:
        return <Laptop className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Connected Devices</h2>
      <div className="space-y-2">
        {devices.map(device => (
          <div
            key={device.id}
            className="flex items-center justify-between p-4 bg-white rounded-lg shadow"
          >
            <div className="flex items-center space-x-4">
              {getDeviceIcon(device.type)}
              <div>
                <h3 className="font-medium">
                  {device.name}
                  {device.isCurrentDevice && (
                    <span className="ml-2 text-sm text-green-600">(Current)</span>
                  )}
                </h3>
                <p className="text-sm text-gray-500">
                  Last active {formatDistanceToNow(device.lastActive)} ago
                </p>
              </div>
            </div>
            {!device.isCurrentDevice && (
              <button
                onClick={() => handleRemoveDevice(device.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title="Remove device"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
      </div>
      {devices.length === 0 && (
        <p className="text-center text-gray-500">No devices connected</p>
      )}
      <p className="text-sm text-gray-500 mt-4">
        You can connect up to {deviceService['MAX_DEVICES']} devices
      </p>
    </div>
  );
};
