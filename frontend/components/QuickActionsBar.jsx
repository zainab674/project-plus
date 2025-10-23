"use client";

import React from 'react';
import { QuickActions } from './quickActions';

const QuickActionsBar = ({ children }) => {
    return (
        <QuickActions>
            {children}
        </QuickActions>
    );
};

export default QuickActionsBar;