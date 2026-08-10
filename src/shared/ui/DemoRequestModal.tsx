'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from '@/shared/ui/icons';

interface DemoRequestModalProps {
 isOpen: boolean;
 onClose: () => void;
}

export default function DemoRequestModal({ isOpen, onClose }: DemoRequestModalProps) {
 const [email, setEmail] = useState('');
 const [submitted, setSubmitted] = useState(false);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 // TODO: integrate with actual webhook / CRM later
 console.log('Demo request submitted', email);
 setSubmitted(true);
 // Simulate async request
 await new Promise((res) => setTimeout(res, 500));
 onClose();
 };

 if (!isOpen) return null;

 return createPortal(
 <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
 <div className="bg-surface-1 rounded-xl shadow-card p-6 w-full max-w-md relative">
 <button
 onClick={onClose}
 className="absolute top-3 right-3 text-text-tertiary hover:text-text-primary transition"
 >
 <CloseIcon className="size-5" />
 </button>
 <h2 className="text-2xl font-semibold mb-4 text-text-primary">
 Request a Live Demo
 </h2>
 {submitted ? (
 <p className="text-text-secondary">Thank you! We'll be in touch soon.</p>
 ) : (
 <form onSubmit={handleSubmit} className="space-y-4">
 <label className="block">
 <span className="text-text-secondary mb-1 block">Email address</span>
 <input
 type="email"
 required
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 className="w-full rounded border border-border-subtle bg-surface-2 p-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
 />
 </label>
 <button
 type="submit"
 className="w-full bg-brand-primary text-text-on-brand py-2 rounded hover:bg-brand-primary-hover transition"
 >
 Send Request
 </button>
 </form>
 )}
 </div>
 </div>,
 document.body
 );
}
