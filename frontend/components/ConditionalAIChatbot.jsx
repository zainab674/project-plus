'use client'

import React from 'react';
import { useUser } from '@/providers/UserProvider';
import AIChatbot from './AIChatbot';

const ConditionalAIChatbot = () => {
    const { user } = useUser();

    // Only show AIChatbot for Provider and Admin roles
    if (user?.Role === 'PROVIDER' || user?.Role === 'ADMIN') {
        return <AIChatbot />;
    }

    return null;
};

export default ConditionalAIChatbot;
