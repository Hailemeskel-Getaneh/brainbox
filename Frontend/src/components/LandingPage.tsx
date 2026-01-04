import { useEffect, useState } from 'react';

const LandingPage = () => {
    const [status, setStatus] = useState<'loading' | 'online' | 'offline'>('loading');

    useEffect(() => {
        fetch('http://localhost:5000/api/health')
            .then((res) => {
                if (res.ok) setStatus('online');
                else setStatus('offline');
            })
            .catch(() => setStatus('offline'));
    }, []);

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
            <div className="max-w-3xl text-center space-y-8">
                <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                    BrainBox
                </h1>
                <p className="text-xl text-gray-400">
                    The next generation of cognitive computing.
                </p>

                <div className="flex justify-center gap-4">
                    <button className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors">
                        Get Started
                    </button>
                    <button className="px-8 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-colors border border-gray-700">
                        Learn More
                    </button>
                </div>

                <div className="mt-12 p-4 rounded-lg bg-gray-800/50 backdrop-blur-sm border border-gray-700 inline-block">
                    <div className="flex items-center gap-2 text-sm font-mono">
                        <span>System Status:</span>
                        <span className={`flex items-center gap-1.5 ${status === 'online' ? 'text-green-400' :
                                status === 'offline' ? 'text-red-400' : 'text-yellow-400'
                            }`}>
                            <span className={`w-2 h-2 rounded-full ${status === 'online' ? 'bg-green-400' :
                                    status === 'offline' ? 'bg-red-400' : 'bg-yellow-400 animate-pulse'
                                }`} />
                            {status.toUpperCase()}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
