import { Camera, CameraResultType, CameraSource, CameraDirection } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export class CameraService {
  static async checkPermissions() {
    if (!Capacitor.isNativePlatform()) {
      return { camera: 'granted' };
    }
    
    return await Camera.checkPermissions();
  }

  static async requestPermissions() {
    if (!Capacitor.isNativePlatform()) {
      return { camera: 'granted' };
    }
    
    return await Camera.requestPermissions();
  }

  static async takePicture() {
    try {
      // Check permissions first
      const permissions = await this.checkPermissions();
      
      if (permissions.camera !== 'granted') {
        const requestResult = await this.requestPermissions();
        if (requestResult.camera !== 'granted') {
          throw new Error('Camera permission denied');
        }
      }

      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        direction: CameraDirection.Rear
      });

      return image;
    } catch (error) {
      console.error('Camera error:', error);
      throw error;
    }
  }

  static async selectFromGallery() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos
      });

      return image;
    } catch (error) {
      console.error('Gallery error:', error);
      throw error;
    }
  }
}