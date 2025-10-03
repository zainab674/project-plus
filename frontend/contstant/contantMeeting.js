export const constantMeeting = [
    {
        created_by: 1,
        participants: [
            {
                user: {
                    name: 'Manan Rajpout',
                    email: 'mananrajpout@gmail.com'
                }
            },
            {
                user: {
                    name: 'Zeeshan Raza',
                    email: 'zeeshanraza@gmail.com'
                }
            },
            {
                user: {
                    name: 'Jiya Khan',
                    email: 'jiyakhan@gmail.com'
                }
            },
            {
                user: {
                    name: 'Eli Gindi',
                    email: 'eligindi@gmail.com'
                }
            },
            {
                user: {
                    name: 'Tabish Khan',
                    email: 'tabishkhan@gmail.com'
                }
            }
        ],
        created_at: Date.now() - Math.floor(Math.random() * 100000),
        duration: Math.floor(Math.random() * 120),
        transcription: [
            { name: 'Manan Rajpout', message: 'Hello, can you hear me?' },
            { name: 'Zeeshan Raza', message: 'Yes, I can hear you clearly.' },
            { name: 'Eli Gindi', message: 'Same here, everything is fine.' },
            { name: 'Tabish Khan', message: 'Hi everyone, good to see you all!' },
            { name: 'Jiya Khan', message: 'Hello! Yes, I can hear you too.' }
        ]
    },
    {
        created_by: 2,
        participants: [
            {
                user: {
                    name: 'Zeeshan Raza',
                    email: 'zeeshanraza@gmail.com'
                }
            },
            {
                user: {
                    name: 'Manan Rajpout',
                    email: 'mananrajpout@gmail.com'
                }
            },
            {
                user: {
                    name: 'Eli Gindi',
                    email: 'eligindi@gmail.com'
                }
            }
        ],
        created_at: Date.now() - Math.floor(Math.random() * 100000),
        duration: Math.floor(Math.random() * 120),
        transcription: [
            { name: 'Zeeshan Raza', message: 'Good morning, everyone!' },
            { name: 'Manan Rajpout', message: 'Morning! Ready for the update?' },
            { name: 'Eli Gindi', message: 'Yes, let’s get started.' }
        ]
    },
    {
        created_by: 3,
        participants: [
            {
                user: {
                    name: 'Jiya Khan',
                    email: 'jiyakhan@gmail.com'
                }
            },
            {
                user: {
                    name: 'Tabish Khan',
                    email: 'tabishkhan@gmail.com'
                }
            },
            {
                user: {
                    name: 'Manan Rajpout',
                    email: 'mananrajpout@gmail.com'
                }
            }
        ],
        created_at: Date.now() - Math.floor(Math.random() * 100000),
        duration: Math.floor(Math.random() * 120),
        transcription: [
            { name: 'Jiya Khan', message: 'Let’s finalize the report today.' },
            { name: 'Tabish Khan', message: 'Agreed. I’ll handle the analytics part.' },
            { name: 'Manan Rajpout', message: 'And I’ll review the design.' }
        ]
    },
    {
        created_by: 4,
        participants: [
            {
                user: {
                    name: 'Tabish Khan',
                    email: 'tabishkhan@gmail.com'
                }
            },
            {
                user: {
                    name: 'Eli Gindi',
                    email: 'eligindi@gmail.com'
                }
            },
            {
                user: {
                    name: 'Zeeshan Raza',
                    email: 'zeeshanraza@gmail.com'
                }
            }
        ],
        created_at: Date.now() - Math.floor(Math.random() * 100000),
        duration: Math.floor(Math.random() * 120),
        transcription: [
            { name: 'Tabish Khan', message: 'Did everyone review the latest code changes?' },
            { name: 'Eli Gindi', message: 'Yes, it looks good from my end.' },
            { name: 'Zeeshan Raza', message: 'Same here. Great job, everyone!' },
            { name: 'Jiya Khan', message: 'Let’s finalize the report today.' },
            { name: 'Tabish Khan', message: 'Agreed. I’ll handle the analytics part.' },
            { name: 'Manan Rajpout', message: 'And I’ll review the design.' }
        ]
    }
];
