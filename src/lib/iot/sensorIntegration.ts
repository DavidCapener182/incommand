/**
 * IoT & Sensor Integration
 * Camera feeds, crowd sensors, environmental monitoring
 */

export interface SensorData {
  sensorId: string
  type: 'camera' | 'crowd_density' | 'temperature' | 'air_quality' | 'access_control' | 'emergency_button'
  value: any
  timestamp: string
  location?: { lat: number; lng: number }
  alert?: boolean
}

export interface CameraFeed {
  id: string
  name: string
  url: string
  location: string
  isActive: boolean
  aiDetection?: boolean
}

export class IoTIntegration {
  private sensors: Map<string, SensorData> = new Map()
  private cameraFeeds: Map<string, CameraFeed> = new Map()

  registerSensor(sensor: SensorData): void {
    this.sensors.set(sensor.sensorId, sensor)
    
    if (sensor.alert) {
      this.triggerAlert(sensor)
    }
  }

  async getCameraFeed(cameraId: string): Promise<string | null> {
    const camera = this.cameraFeeds.get(cameraId)
    return camera?.url || null
  }

  async analyzeCrowdDensity(sensorId: string): Promise<{ density: number; alert: boolean }> {
    // Analyze crowd density from sensor data
    return { density: 0.7, alert: false }
  }

  async monitorEnvironment(): Promise<{ temp: number; airQuality: number; alerts: string[] }> {
    // Monitor environmental conditions
    return { temp: 22, airQuality: 85, alerts: [] }
  }

  private triggerAlert(sensor: SensorData): void {
    console.log('IoT Alert:', sensor)
  }
}

export const iotIntegration = new IoTIntegration()
