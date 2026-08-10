'use client';

import { useState } from 'react';
import DemoRequestModal from './DemoRequestModal';

export default function DemoCTA() {
 const [isDemoOpen, setDemoOpen] = useState(false);

 return (
 <>
 <div className="flex justify-center mt-6">
 <button
 onClick={() => setDemoOpen(true)}
 className="bg-white/10 backdrop-blur-md border border-border-subtle text-text-primary py-2 px-6 rounded-lg hover:bg-white/20 transition"
 >
 Request a Live Demo
 </button>
 </div>
 <DemoRequestModal isOpen={isDemoOpen} onClose={() => setDemoOpen(false)} />
 </>
 );
}
