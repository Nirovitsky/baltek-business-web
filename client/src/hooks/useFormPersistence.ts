import { useCallback, useState, useEffect } from 'react';
import { UseFormReturn, FieldValues } from 'react-hook-form';

export function useFormPersistence<T extends FieldValues>(
  form: UseFormReturn<T>,
  storageKey: string,
  options: {
    enabled?: boolean;
    debounceMs?: number;
    excludeFields?: string[];
  } = {}
) {
  const { enabled = true, debounceMs = 1000, excludeFields = [] } = options;
  const [isDraftSaved, setIsDraftSaved] = useState(false);

  // Function to save draft to localStorage
  const saveDraft = useCallback((data: any) => {
    if (!enabled) return;
    
    try {
      // Remove excluded fields before saving
      const dataToSave = { ...data };
      excludeFields.forEach(field => {
        delete dataToSave[field];
      });
      
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      setIsDraftSaved(true);
      // Hide the indicator after 2 seconds
      setTimeout(() => setIsDraftSaved(false), 2000);
    } catch (error) {
      console.warn('Failed to save form draft:', error);
    }
  }, [storageKey, enabled, excludeFields]);

  // Function to load draft from localStorage
  const loadDraft = useCallback(() => {
    if (!enabled) return null;
    
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.warn('Failed to load form draft:', error);
      return null;
    }
  }, [storageKey, enabled]);

  // Function to clear draft
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setIsDraftSaved(false);
    } catch (error) {
      console.warn('Failed to clear form draft:', error);
    }
  }, [storageKey]);

  // Auto-save form data as user types (debounced)
  useEffect(() => {
    if (!enabled) return;

    let timeoutId: NodeJS.Timeout;
    const subscription = form.watch((data) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        saveDraft(data);
      }, debounceMs);
    });
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [form, saveDraft, debounceMs, enabled]);

  return {
    loadDraft,
    clearDraft,
    isDraftSaved,
    saveDraft
  };
}