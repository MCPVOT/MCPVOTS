'use client';

import { useEffect, useState } from 'react';

interface TerminalTextProps {
    text: string;
    delay?: number;
    className?: string;
    glitch?: boolean;
}

export default function TerminalText({ text, delay = 0, className = '', glitch = false }: TerminalTextProps) {
    const [displayedText, setDisplayedText] = useState('');
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        let timeout: NodeJS.Timeout;
        let index = 0;

        const typeText = () => {
            if (index < text.length) {
                setDisplayedText(text.substring(0, index + 1));
                index++;
                timeout = setTimeout(typeText, 30 + Math.random() * 20); // Variable typing speed
            } else {
                setIsComplete(true);
            }
        };

        timeout = setTimeout(() => {
            typeText();
        }, delay);

        return () => clearTimeout(timeout);
    }, [text, delay]);

    const spanClasses = [
        'font-mono',
        glitch && isComplete ? 'animate-glitch' : '',
        glitch && isComplete ? 'drop-shadow-[0_0_8px_rgba(0,255,0,0.5)]' : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <span className={spanClasses}>
            {displayedText}
            {!isComplete && (
                <span className="animate-blink inline-block ml-1 w-2 h-5 bg-green-500" />
            )}
        </span>
    );
}
