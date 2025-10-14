import { useState, useCallback } from 'react';
import greenGuideBestPractices from '@/data/greenGuideBestPractices.json';

export interface GuidedActionsResult {
  actions: string;
  outcome: string;
  confidence: number;
  source: 'ai' | 'template';
}

export interface GuidedQuestion {
  id: string;
  text: string;
  type: 'boolean' | 'text' | 'select' | 'number' | 'multiselect';
  placeholder: string;
  options?: string[];
}

export interface IncidentData {
  occurrence?: string;
  callsign?: string;
  location?: string;
  priority?: string;
  time?: string;
  persons?: string;
  reason?: string;
  symptoms?: string;
  [key: string]: any;
}

interface GenerateParams {
  incidentType: string;
  incidentData: IncidentData;
  userAnswers?: Record<string, any>;
}

export function useGuidedActions() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Get guided questions for a specific incident type
   */
  const getQuestionsForIncidentType = useCallback((
    incidentType: string
  ): GuidedQuestion[] => {
    const guide = (greenGuideBestPractices as any)[incidentType];
    if (!guide || !guide.questions) {
      return [];
    }
    return guide.questions as GuidedQuestion[];
  }, []);

  /**
   * Check if incident type has guided actions available
   */
  const hasGuidedActions = useCallback((incidentType: string): boolean => {
    const guide = (greenGuideBestPractices as any)[incidentType];
    return !!(guide && guide.template && guide.template.actions && guide.template.outcome);
  }, []);

  /**
   * Get template for incident type
   */
  const getTemplate = useCallback((incidentType: string): { actions: string; outcome: string } | null => {
    const guide = (greenGuideBestPractices as any)[incidentType];
    if (!guide || !guide.template) {
      return null;
    }
    return guide.template;
  }, []);

  /**
   * Generate guided actions and outcome
   */
  const generateGuidedActions = useCallback(async (
    params: GenerateParams
  ): Promise<GuidedActionsResult> => {
    const { incidentType, incidentData, userAnswers = {} } = params;

    setIsLoading(true);
    setError(null);

    try {
      // Load template from Green Guide JSON
      const template = getTemplate(incidentType);
      
      if (!template) {
        throw new Error(`No template available for incident type: ${incidentType}`);
      }

      // Prepare current time if not provided
      const now = new Date();
      const currentTime = incidentData.time || now.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });

      // Call API to generate guided actions
      const response = await fetch('/api/guided-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          incidentType,
          template,
          incidentData: {
            ...incidentData,
            time: currentTime,
          },
          userAnswers,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const result: GuidedActionsResult = await response.json();
      
      setIsLoading(false);
      return result;

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to generate guided actions';
      setError(errorMessage);
      setIsLoading(false);
      throw err;
    }
  }, [getTemplate]);

  return {
    generateGuidedActions,
    getQuestionsForIncidentType,
    hasGuidedActions,
    getTemplate,
    isLoading,
    error,
  };
}

