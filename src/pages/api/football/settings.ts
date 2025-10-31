import { NextApiRequest, NextApiResponse } from 'next';
import { 
  getSupportToolsSettings, 
  getAllSupportToolsSettings,
  upsertSupportToolsSettings,
  SupportToolType 
} from '@/lib/database/supportToolsSettings';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Extract company_id and event_id from headers or query params
  const companyId = req.headers['x-company-id'] as string || req.query.company_id as string;
  const eventId = req.headers['x-event-id'] as string || req.query.event_id as string;

  if (!companyId || !eventId) {
    return res.status(400).json({ error: 'company_id and event_id are required' });
  }

  try {
    if (req.method === 'GET') {
      const toolType = req.query.tool_type as SupportToolType | undefined;
      
      if (toolType) {
        // Get settings for specific tool
        const settings = await getSupportToolsSettings(companyId, eventId, toolType);
        
        if (!settings) {
          return res.status(200).json({
            auto_refresh_enabled: true,
            auto_refresh_interval: 30,
            settings_json: {}
          });
        }
        
        res.status(200).json({
          auto_refresh_enabled: settings.auto_refresh_enabled,
          auto_refresh_interval: settings.auto_refresh_interval,
          settings_json: settings.settings_json || {}
        });
      } else {
        // Get all settings
        const allSettings = await getAllSupportToolsSettings(companyId, eventId);
        const settingsMap: Record<string, any> = {};
        
        allSettings.forEach(setting => {
          settingsMap[setting.tool_type] = {
            auto_refresh_enabled: setting.auto_refresh_enabled,
            auto_refresh_interval: setting.auto_refresh_interval,
            settings_json: setting.settings_json || {}
          };
        });
        
        res.status(200).json(settingsMap);
      }
    } else if (req.method === 'PUT') {
      const { tool_type, auto_refresh_enabled, auto_refresh_interval, settings_json } = req.body;
      
      if (!tool_type) {
        return res.status(400).json({ error: 'tool_type is required' });
      }
      
      const updated = await upsertSupportToolsSettings(companyId, eventId, tool_type as SupportToolType, {
        auto_refresh_enabled,
        auto_refresh_interval,
        settings_json
      });
      
      res.status(200).json({
        auto_refresh_enabled: updated.auto_refresh_enabled,
        auto_refresh_interval: updated.auto_refresh_interval,
        settings_json: updated.settings_json
      });
    } else {
      res.setHeader('Allow', ['GET', 'PUT']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Settings API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

