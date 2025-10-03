import React, { useEffect, useState } from 'react';
import ReactD3Tree from 'react-d3-tree';
import { Scale, Users, Briefcase, Clock, DollarSign, Calendar, FileText, AlertCircle } from 'lucide-react';

// Enhanced Professional Tooltip component
const Tooltip = ({ details, position, close }) => {
    if (!details) return null;

    const getStatusColor = (status) => {
        const colors = {
            'active': '#10b981',
            'completed': '#3b82f6',
            'pending': '#f59e0b',
            'on hold': '#ef4444',
            'draft': '#6b7280'
        };
        return colors[status?.toLowerCase()] || '#6b7280';
    };

    const getPriorityIcon = (priority) => {
        if (priority?.toLowerCase() === 'high') return <AlertCircle className="w-4 h-4 text-red-500" />;
        if (priority?.toLowerCase() === 'medium') return <Clock className="w-4 h-4 text-yellow-500" />;
        return <Clock className="w-4 h-4 text-green-500" />;
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: Math.min(position.y, window.innerHeight - 400),
                left: Math.min(position.x, window.innerWidth - 350),
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                fontSize: '14px',
                maxWidth: '350px',
                minWidth: '300px',
                zIndex: 1000,
                pointerEvents: 'auto',
                overflow: 'hidden',
            }}
        >
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                color: 'white',
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Briefcase className="w-5 h-5" />
                    <h3 style={{ margin: 0, fontSize: '16px', }}>{details.name}</h3>
                </div>
                <button
                    onClick={close}
                    style={{
                        background: 'rgba(255,255,255,0.2)',
                        border: 'none',
                        borderRadius: '6px',
                        width: '28px',
                        height: '28px',
                        color: 'white',
                        fontSize: '18px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.3)'}
                    onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                >
                    ×
                </button>
            </div>

            {/* Content */}
            <div style={{ padding: '20px' }}>
                {/* Status Badge */}
                {details.status && (
                    <div style={{ marginBottom: '16px' }}>
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            backgroundColor: getStatusColor(details.status),
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            textTransform: 'uppercase'
                        }}>
                            {details.status}
                        </span>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {details.description && (
                        <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>DESCRIPTION</div>
                            <div style={{ color: '#334155' }}>{details.description}</div>
                        </div>
                    )}

                    {/* Priority */}
                    {details.priority && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {getPriorityIcon(details.priority)}
                            <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Priority:</span>
                            <span style={{ color: '#334155' }}>{details.priority}</span>
                        </div>
                    )}

                    {/* Client Information */}
                    {details.client_name && (
                        <div style={{ backgroundColor: '#fefefe', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <Users className="w-4 h-4 text-blue-600" />
                                <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Client Information</span>
                            </div>
                            <div style={{ color: '#334155', marginBottom: '4px' }}>{details.client_name}</div>
                            {details.client_address && (
                                <div style={{ fontSize: '13px', color: '#64748b' }}>{details.client_address}</div>
                            )}
                        </div>
                    )}

                    {/* Financial Information */}
                    {details.budget && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <DollarSign className="w-4 h-4 text-green-600" />
                            <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Budget:</span>
                            <span style={{ color: '#059669' }}>{details.budget}</span>
                        </div>
                    )}

                    {/* Legal Information */}
                    {details.opposing && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Scale className="w-4 h-4 text-red-600" />
                            <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Opposing Party:</span>
                            <span style={{ color: '#334155' }}>{details.opposing}</span>
                        </div>
                    )}

                    {/* Dates */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
                        {details.created_at && (
                            <div>
                                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Created</div>
                                <div style={{ fontSize: '13px', color: '#334155', }}>{new Date(details.created_at).toLocaleDateString()}</div>
                            </div>
                        )}
                        {details.updated_at && (
                            <div>
                                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Updated</div>
                                <div style={{ fontSize: '13px', color: '#334155', }}>{new Date(details.updated_at).toLocaleDateString()}</div>
                            </div>
                        )}
                    </div>

                    {details.filingDate && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Calendar className="w-4 h-4 text-blue-600" />
                            <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filing Date:</span>
                            <span style={{ color: '#334155' }}>{new Date(details.filingDate).toLocaleDateString()}</span>
                        </div>
                    )}

                    {details.phases && (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <FileText className="w-4 h-4 text-purple-600" />
                                <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phases</span>
                            </div>
                            <div style={{ fontSize: '13px', color: '#334155', }}>{details.phases}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const UserTreeView = ({ user }) => {
    const [treeData, setTreeData] = useState(null);
    const [tooltip, setTooltip] = useState(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (user) {
            const treeStructure = formatTreeData(user);
            setTreeData(treeStructure);
        }
    }, [user]);

    const formatTreeData = (user) => ({
        name: user.name,
        children: [
            {
                name: 'Created Projects',
                children: user.Projects?.map((project) => ({
                    name: project.name,
                    attributes: {
                        description: project.description,
                        status: project.status,
                        created_at: project.created_at,
                        updated_at: project.updated_at,
                        priority: project.priority,
                        client_name: project.client_name,
                        client_address: project.client_address,
                        budget: project.budget,
                        opposing: project.opposing,
                        filingDate: project.filingDate,
                        phases: project.phases,
                    },
                    children: [
                        {
                            name: 'Team Members',
                            children: project.Members?.map((m) => ({ name: m.user.name })) || [],
                        },
                        {
                            name: 'Clients',
                            children: project.Clients?.map((c) => ({ name: c.user.name })) || [],
                        },
                        {
                            name: 'Tasks',
                            children: project.Tasks?.map((t) => ({ name: `${t.name}` })) || [],
                        },
                    ],
                })) || [],
            },
        ],
    });

    const handleClick = (node, event) => {
        if (node.attributes) {
            setTooltip({ name: node.name, ...node.attributes });
            setTooltipPosition({ x: event.clientX + 10, y: event.clientY + 10 });
        }
    };

    const handleCloseTooltip = () => setTooltip(null);

    return (
        <div style={{
            width: '100%',
            height: 'calc(100vh - 60px)', // Give room for fixed header
            position: 'relative',
            overflow: 'auto', // Add scrollbar
        }}>
            {treeData ? (
                <ReactD3Tree
                    data={treeData}
                    renderCustomNodeElement={(rd3tProps) => {
                        const { nodeDatum } = rd3tProps;
                        return (
                            <g onClick={(e) => handleClick(nodeDatum, e)} style={{ cursor: 'pointer' }}>
                                <rect
                                    x={-100}
                                    y={-30}
                                    width={200}
                                    height={60}
                                    rx="10"
                                    ry="10"
                                    fill="#ffffff"
                                    stroke="#4f86f7"
                                    strokeWidth={2}
                                />
                                <text
                                    x={0}
                                    y={0}
                                    dominantBaseline="middle"
                                    textAnchor="middle"
                                    style={{
                                        fontSize: 14,
                                        fill: '#0f172a',
                                        stroke: 'none',
                                        paintOrder: 'fill',
                                        fontWeight: 600,
                                        pointerEvents: 'none',
                                    }}
                                >
                                    {nodeDatum.name}
                                </text>

                            </g>
                        );
                    }}
                    collapsible={false}
                    separation={{ siblings: 1.2, nonSiblings: 1.8 }}
                    orientation="vertical"
                    nodeSize={{ x: 220, y: 120 }}
                />
            ) : (
                <p>Loading...</p>
            )}

            <Tooltip details={tooltip} position={tooltipPosition} close={handleCloseTooltip} />
        </div>
    );
};

export default UserTreeView;
