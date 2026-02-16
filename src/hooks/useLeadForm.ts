'use client';

import { useState, useCallback } from 'react';

export type LeadFormStep = 1 | 2 | 3;
export type LeadFormStatus = 'idle' | 'submitting' | 'success' | 'error';

interface ContactInfo {
  name: string;
  email: string;
  phone: string;
}

interface NeedsAssessment {
  investmentAmount: string;
  timeline: string;
  hasCurrentAdvisor: 'yes' | 'no' | '';
}

interface LeadFormData {
  contact: ContactInfo;
  needs: NeedsAssessment;
  message: string;
}

interface ValidationErrors {
  [key: string]: string;
}

const initialData: LeadFormData = {
  contact: { name: '', email: '', phone: '' },
  needs: { investmentAmount: '', timeline: '', hasCurrentAdvisor: '' },
  message: '',
};

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone: string): boolean {
  if (!phone) return true; // optional
  return /^\+?[\d\s\-()]{7,}$/.test(phone);
}

function validateStep(step: LeadFormStep, data: LeadFormData): ValidationErrors {
  const errors: ValidationErrors = {};

  if (step === 1) {
    if (!data.contact.name.trim()) errors.name = 'Name is required';
    if (!data.contact.email.trim()) errors.email = 'Email is required';
    else if (!validateEmail(data.contact.email)) errors.email = 'Invalid email address';
    if (!validatePhone(data.contact.phone)) errors.phone = 'Invalid phone number';
  }

  if (step === 2) {
    if (!data.needs.investmentAmount) errors.investmentAmount = 'Please select an investment range';
    if (!data.needs.timeline) errors.timeline = 'Please select a timeline';
    if (!data.needs.hasCurrentAdvisor) errors.hasCurrentAdvisor = 'Please select an option';
  }

  return errors;
}

export function useLeadForm(firmCrd: number) {
  const [step, setStep] = useState<LeadFormStep>(1);
  const [data, setData] = useState<LeadFormData>(initialData);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [status, setStatus] = useState<LeadFormStatus>('idle');

  const updateContact = useCallback((field: keyof ContactInfo, value: string) => {
    setData((prev) => ({ ...prev, contact: { ...prev.contact, [field]: value } }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const updateNeeds = useCallback((field: keyof NeedsAssessment, value: string) => {
    setData((prev) => ({ ...prev, needs: { ...prev.needs, [field]: value } }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const updateMessage = useCallback((value: string) => {
    setData((prev) => ({ ...prev, message: value }));
  }, []);

  const nextStep = useCallback(() => {
    const stepErrors = validateStep(step, data);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return false;
    }
    setErrors({});
    if (step < 3) setStep((s) => (s + 1) as LeadFormStep);
    return true;
  }, [step, data]);

  const prevStep = useCallback(() => {
    if (step > 1) {
      setStep((s) => (s - 1) as LeadFormStep);
      setErrors({});
    }
  }, [step]);

  const submit = useCallback(async () => {
    const stepErrors = validateStep(step, data);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    setStatus('submitting');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crd: firmCrd,
          name: data.contact.name,
          email: data.contact.email,
          phone: data.contact.phone || undefined,
          investment_amount: data.needs.investmentAmount,
          timeline: data.needs.timeline,
          has_current_advisor: data.needs.hasCurrentAdvisor === 'yes',
          message: data.message || undefined,
        }),
      });

      if (!res.ok) throw new Error('Failed to submit');
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }, [firmCrd, step, data]);

  const reset = useCallback(() => {
    setStep(1);
    setData(initialData);
    setErrors({});
    setStatus('idle');
  }, []);

  return {
    step,
    data,
    errors,
    status,
    updateContact,
    updateNeeds,
    updateMessage,
    nextStep,
    prevStep,
    submit,
    reset,
  };
}
