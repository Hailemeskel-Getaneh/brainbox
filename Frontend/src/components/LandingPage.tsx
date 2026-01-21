import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
    const [isOnline, setIsOnline] = useState<boolean | null>(null);
    const featuresRef = useRef<HTMLDivElement>(null);

    const navigate = useNavigate();

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/health');
                setIsOnline(res.ok);
            } catch {
                setIsOnline(false);
            }
        };
        checkStatus();
    }, []);

    const scrollToFeatures = () => {
        featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
            <div className="max-w-3xl text-center space-y-8">
                <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600" data-testid="brainbox-heading">
                    BrainBox
                </h1>
                <p className="text-xl text-gray-400">
                    The next generation of cognitive computing.
                </p>

                <div className="flex justify-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
                    >
                        Get Started
                    </button>
                    <button
                        onClick={scrollToFeatures}
                        className="px-8 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-colors border border-gray-700">
                        Learn More
                    </button>
                </div>

                <div className="mt-12 p-4 rounded-lg bg-gray-800/50 backdrop-blur-sm border border-gray-700 inline-block">
                    <div className="flex items-center gap-2 text-sm font-mono">
                        <span>System Status:</span>
                        <span className={`flex items-center gap-1.5 ${isOnline === true ? 'text-green-400' :
                            isOnline === false ? 'text-red-400' : 'text-yellow-400'
                            }`}>
                            <span className={`w-2 h-2 rounded-full ${isOnline === true ? 'bg-green-400' :
                                isOnline === false ? 'bg-red-400' : 'bg-yellow-400 animate-pulse'
                                }`} />
                            {isOnline === null ? 'LOADING' : isOnline ? 'ONLINE' : 'OFFLINE'}
                        </span>
                    </div>
                </div>
            </div>
            <div ref={featuresRef} className="max-w-5xl mx-auto py-24">
                <h2 className="text-4xl font-bold text-center mb-12">Features</h2>
                <div className="grid md:grid-cols-3 gap-8 text-center">
                    <div className="p-8 border border-gray-700 rounded-lg">
                        <h3 className="text-2xl font-bold mb-4">Organize Your Thoughts</h3>
                        <p className="text-gray-400">Create topics and add notes to keep your ideas structured and accessible.</p>
                    </div>
                    <div className="p-8 border border-gray-700 rounded-lg">
                        <h3 className="text-2xl font-bold mb-4">AI-Powered Insights</h3>
                        <p className="text-gray-400">Leverage the power of AI to gain new perspectives on your notes.</p>
                    </div>
                    <div className="p-8 border border-gray-700 rounded-lg">
                        <h3 className="text-2xl font-bold mb-4">Seamless Experience</h3>
                        <p className="text-gray-400">A clean and intuitive interface that lets you focus on your ideas.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;