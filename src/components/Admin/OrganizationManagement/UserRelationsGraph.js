import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import { fetchUserOrganizationalTitles } from '../../../services/UserManagement/UserManagementService';

// Color theme
const colors = {
    primary: '#633394',
    secondary: '#967CB2',
    accentBg: '#f3e5f5',
    borderColor: '#e0e0e0',
    textPrimary: '#212121',
    textSecondary: '#757575',
};

// Column styles
const columnStyles = {
    user: { border: '#633394', dot: '#633394', bg: '#ffffff', headerColor: '#633394' },
    title: { border: '#967CB2', dot: '#967CB2', bg: '#ffffff', headerColor: '#967CB2' },
    organization: { border: '#4a8c5c', dot: '#4a8c5c', bg: '#ffffff', headerColor: '#4a8c5c' },
};

function UserRelationsGraph({ userId, user, organization, orgTitles: propOrgTitles }) {
    const [fetchedTitles, setFetchedTitles] = useState([]);
    const [loading, setLoading] = useState(!propOrgTitles);
    const [hoveredLine, setHoveredLine] = useState(null);
    const svgRef = useRef(null);
    const containerRef = useRef(null);
    const [lineCoords, setLineCoords] = useState([]);

    // Card refs for measuring positions
    const userCardRefs = useRef({});
    const titleCardRefs = useRef({});
    const orgCardRefs = useRef({});

    // Use prop if available, otherwise use fetched state
    const orgTitles = propOrgTitles || fetchedTitles;

    // Load organizational titles if not provided via props
    useEffect(() => {
        if (propOrgTitles) {
            setLoading(false);
            return;
        }

        const loadTitles = async () => {
            try {
                setLoading(true);
                const data = await fetchUserOrganizationalTitles(userId);
                setFetchedTitles(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Error loading organizational titles:', err);
                if (user && organization) {
                    const fallbackTitles = [];
                    if (user.titles && user.titles.length > 0) {
                        user.titles.forEach(t => {
                            fallbackTitles.push({
                                id: t.id,
                                organization_id: organization.id || user.organization_id,
                                title_name: t.name,
                                title_id: t.id,
                                organization_name: organization.name || 'Unknown Organization',
                            });
                        });
                    } else if (user.title) {
                        fallbackTitles.push({
                            id: 1,
                            organization_id: organization.id || user.organization_id,
                            title_name: typeof user.title === 'string' ? user.title : user.title.name,
                            title_id: user.title_id,
                            organization_name: organization.name || 'Unknown Organization',
                        });
                    }
                    setFetchedTitles(fallbackTitles);
                }
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            loadTitles();
        }
    }, [userId, user, organization, propOrgTitles]);

    // Build relationship data
    const buildRelationships = useCallback(() => {
        if (!user) return { users: [], titles: [], organizations: [], connections: [] };

        const userName = `${user.firstname || ''} ${user.lastname || ''}`.trim() || user.username || 'User';

        // Unique titles and organizations
        const titlesMap = new Map();
        const orgsMap = new Map();
        const connections = [];

        orgTitles.forEach(ot => {
            const titleKey = ot.title_name || 'Unknown Title';
            const orgKey = ot.organization_id;

            if (!titlesMap.has(titleKey)) {
                // Use titleKey as ID to ensure it matches the connection logic (which uses titleKey)
                titlesMap.set(titleKey, { id: titleKey, name: titleKey });
            }
            if (!orgsMap.has(orgKey)) {
                orgsMap.set(orgKey, { id: orgKey, name: ot.organization_name || 'Unknown Organization' });
            }

            // User → Title connection (avoid duplicates if same title exists in multiple orgs)
            const userToTitleId = `u-t-${titleKey}`;
            const exists = connections.some(c => c.id === userToTitleId);

            if (!exists) {
                connections.push({
                    id: userToTitleId,
                    from: 'user',
                    fromId: 'user-0',
                    to: 'title',
                    toId: `title-${titleKey}`,
                });
            }

            // Title → Organization connection
            connections.push({
                id: `t-o-${titleKey}-${orgKey}`,
                from: 'title',
                fromId: `title-${titleKey}`,
                to: 'org',
                toId: `org-${orgKey}`,
            });
        });

        // Fallback if no orgTitles
        if (orgTitles.length === 0 && organization) {
            const titleName = user?.titles?.[0]?.name || (typeof user?.title === 'string' ? user.title : user?.title?.name) || null;
            if (titleName) {
                titlesMap.set(titleName, { id: titleName, name: titleName });
                orgsMap.set(organization.id || 0, { id: organization.id || 0, name: organization.name || 'Unknown' });
                connections.push({
                    id: `u-t-${titleName}`,
                    from: 'user',
                    fromId: 'user-0',
                    to: 'title',
                    toId: `title-${titleName}`,
                });
                connections.push({
                    id: `t-o-${titleName}-${organization.id}`,
                    from: 'title',
                    fromId: `title-${titleName}`,
                    to: 'org',
                    toId: `org-${organization.id || 0}`,
                });
            } else {
                // No title at all, just user → org
                orgsMap.set(organization.id || 0, { id: organization.id || 0, name: organization.name || 'Unknown' });
                connections.push({
                    id: `u-o-${organization.id}`,
                    from: 'user',
                    fromId: 'user-0',
                    to: 'org',
                    toId: `org-${organization.id || 0}`,
                });
            }
        }

        return {
            users: [{ id: '0', name: userName, titles: Array.from(titlesMap.keys()) }],
            titles: Array.from(titlesMap.values()),
            organizations: Array.from(orgsMap.values()),
            connections,
        };
    }, [user, organization, orgTitles]);

    const relationships = buildRelationships();

    // Calculate line coordinates after render
    useEffect(() => {
        const calculateLines = () => {
            if (!containerRef.current) return;

            const containerRect = containerRef.current.getBoundingClientRect();
            const newLines = [];

            relationships.connections.forEach(conn => {
                let fromEl, toEl;

                if (conn.from === 'user') {
                    fromEl = userCardRefs.current[conn.fromId];
                } else if (conn.from === 'title') {
                    fromEl = titleCardRefs.current[conn.fromId];
                }

                if (conn.to === 'title') {
                    toEl = titleCardRefs.current[conn.toId];
                } else if (conn.to === 'org') {
                    toEl = orgCardRefs.current[conn.toId];
                }

                if (fromEl && toEl) {
                    const fromRect = fromEl.getBoundingClientRect();
                    const toRect = toEl.getBoundingClientRect();

                    newLines.push({
                        id: conn.id,
                        x1: fromRect.right - containerRect.left,
                        y1: fromRect.top + fromRect.height / 2 - containerRect.top,
                        x2: toRect.left - containerRect.left,
                        y2: toRect.top + toRect.height / 2 - containerRect.top,
                    });
                }
            });

            setLineCoords(newLines);

        };

        // Initial calculation with delay to let DOM settle
        const timer = setTimeout(calculateLines, 100);

        // Also recalc on next paint to ensure refs are populated
        requestAnimationFrame(() => requestAnimationFrame(calculateLines));

        // Recalculate on multiple triggers
        const observer = new ResizeObserver(calculateLines);
        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        // Also recalculate on scroll (in case of nested scrolling)
        window.addEventListener('scroll', calculateLines, true);
        window.addEventListener('resize', calculateLines);

        return () => {
            clearTimeout(timer);
            observer.disconnect();
            window.removeEventListener('scroll', calculateLines, true);
            window.removeEventListener('resize', calculateLines);
        };
    }, [relationships, loading]);

    if (loading) {
        return (
            <Paper sx={{
                borderRadius: 3,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                p: 4,
                textAlign: 'center'
            }}>
                <CircularProgress size={32} sx={{ color: colors.primary }} />
                <Typography variant="body2" sx={{ mt: 1, color: colors.textSecondary }}>
                    Loading relations...
                </Typography>
            </Paper>
        );
    }

    if (relationships.users.length === 0) {
        return (
            <Paper sx={{
                borderRadius: 3,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                p: 4,
                textAlign: 'center'
            }}>
                <BusinessIcon sx={{ fontSize: 48, color: colors.borderColor, mb: 1 }} />
                <Typography color="text.secondary">
                    No organizational relationships found
                </Typography>
            </Paper>
        );
    }

    // Determine if we have titles column
    const hasTitles = relationships.titles.length > 0;

    return (
        <Paper sx={{
            borderRadius: 3,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            overflow: 'hidden',
        }}>
            {/* Header */}
            <Box sx={{
                px: 3, py: 2,
                borderBottom: `1px solid ${colors.borderColor}`,
            }}>
                <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                    Relationships
                </Typography>
            </Box>

            {/* Graph Area */}
            <Box
                ref={containerRef}
                sx={{
                    position: 'relative',
                    px: { xs: 2, sm: 4, md: 6 },
                    py: 4,
                    backgroundColor: '#fafbfd',
                    minHeight: 200,
                }}
            >
                {/* SVG Lines Layer - positioned absolutely behind the cards */}
                <svg
                    ref={svgRef}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'auto',
                        zIndex: 1,
                    }}
                >
                    {lineCoords.map(line => {
                        const isHovered = hoveredLine === line.id;
                        const isAnyHovered = hoveredLine !== null;
                        const isDimmed = isAnyHovered && !isHovered;

                        // Bezier curve control points
                        const midX = (line.x1 + line.x2) / 2;

                        return (
                            <g key={line.id}>
                                {/* Invisible wider path for easier hover detection */}
                                <path
                                    d={`M ${line.x1} ${line.y1} C ${midX} ${line.y1}, ${midX} ${line.y2}, ${line.x2} ${line.y2}`}
                                    fill="none"
                                    stroke="transparent"
                                    strokeWidth={12}
                                    style={{
                                        pointerEvents: 'stroke',
                                        cursor: 'pointer',
                                    }}
                                    onMouseEnter={() => setHoveredLine(line.id)}
                                    onMouseLeave={() => setHoveredLine(null)}
                                />
                                {/* Visible line */}
                                <path
                                    d={`M ${line.x1} ${line.y1} C ${midX} ${line.y1}, ${midX} ${line.y2}, ${line.x2} ${line.y2}`}
                                    fill="none"
                                    stroke={isHovered ? colors.primary : '#8e9aaf'}
                                    strokeWidth={isHovered ? 3 : 2}
                                    strokeOpacity={isDimmed ? 0.2 : isHovered ? 1 : 0.6}
                                    style={{
                                        transition: 'all 0.3s ease',
                                        pointerEvents: 'none',
                                    }}
                                    strokeLinecap="round"
                                    strokeDasharray={isHovered ? '0' : '0'}
                                />
                                {/* Animated gradient overlay on hover */}
                                {isHovered && (
                                    <path
                                        d={`M ${line.x1} ${line.y1} C ${midX} ${line.y1}, ${midX} ${line.y2}, ${line.x2} ${line.y2}`}
                                        fill="none"
                                        stroke={colors.primary}
                                        strokeWidth={3}
                                        strokeOpacity={0.3}
                                        style={{
                                            pointerEvents: 'none',
                                            filter: 'blur(3px)',
                                        }}
                                        strokeLinecap="round"
                                    />
                                )}
                            </g>
                        );
                    })}
                </svg>

                {/* Columns Layout */}
                <Box sx={{
                    display: 'flex',
                    justifyContent: hasTitles ? 'space-between' : 'space-around',
                    alignItems: 'flex-start',
                    position: 'relative',
                    zIndex: 2,
                    gap: { xs: 2, sm: 4, md: 8 },
                }}>
                    {/* USER Column */}
                    <Column
                        header="USER"
                        headerColor={columnStyles.user.headerColor}
                        items={relationships.users}
                        style={columnStyles.user}
                        dotSide="right"
                        cardRefs={userCardRefs}
                        idPrefix="user-"
                    />

                    {/* TITLE Column */}
                    {hasTitles && (
                        <Column
                            header="TITLE"
                            headerColor={columnStyles.title.headerColor}
                            items={relationships.titles.map(t => ({ id: t.id, name: t.name }))}
                            style={columnStyles.title}
                            dotSide="both"
                            cardRefs={titleCardRefs}
                            idPrefix="title-"
                        />
                    )}

                    {/* ORGANIZATION Column */}
                    <Column
                        header="ORGANIZATION"
                        headerColor={columnStyles.organization.headerColor}
                        items={relationships.organizations.map(o => ({ id: o.id, name: o.name }))}
                        style={columnStyles.organization}
                        dotSide="left"
                        cardRefs={orgCardRefs}
                        idPrefix="org-"
                    />
                </Box>
            </Box>
        </Paper>
    );
}

// Column component
function Column({ header, headerColor, items, style, dotSide, cardRefs, idPrefix }) {
    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            flex: 1,
            maxWidth: 280,
            minWidth: 140,
        }}>
            {/* Column Header */}
            <Typography
                variant="overline"
                sx={{
                    color: headerColor,
                    fontWeight: 700,
                    letterSpacing: '1.5px',
                    fontSize: '0.75rem',
                    mb: 2.5,
                }}
            >
                {header}
            </Typography>

            {/* Cards */}
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
                width: '100%',
            }}>
                {items.map(item => {
                    const cardId = `${idPrefix}${item.id}`;
                    return (
                        <RelationCard
                            key={cardId}
                            id={cardId}
                            label={item.name}
                            titles={item.titles}
                            style={style}
                            dotSide={dotSide}
                            ref={el => {
                                if (el) cardRefs.current[cardId] = el;
                            }}
                        />
                    );
                })}
            </Box>
        </Box>
    );
}

// Individual card with connector dot(s)
const RelationCard = React.forwardRef(({ id, label, titles, style, dotSide }, ref) => {
    const [hovered, setHovered] = useState(false);

    return (
        <Box
            ref={ref}
            data-card-id={id}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                px: 2,
                py: 1.25,
                borderRadius: '8px',
                border: `1.5px solid ${hovered ? style.border : style.border + '88'}`,
                backgroundColor: style.bg,
                cursor: 'default',
                transition: 'all 0.2s ease',
                boxShadow: hovered
                    ? `0 2px 12px ${style.border}22`
                    : '0 1px 3px rgba(0,0,0,0.04)',
                '&:hover': {
                    transform: 'translateY(-1px)',
                },
                minHeight: 44,
            }}
        >
            {/* Left dot */}
            {(dotSide === 'left' || dotSide === 'both') && (
                <Box sx={{
                    position: 'absolute',
                    left: -5,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    backgroundColor: style.dot,
                    border: '2px solid #ffffff',
                    boxShadow: `0 0 0 1px ${style.dot}44`,
                    transition: 'all 0.2s ease',
                }} />
            )}

            {/* Content Container */}
            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {/* Label */}
                <Typography
                    variant="body2"
                    sx={{
                        fontWeight: 500,
                        color: '#2c3e50',
                        fontSize: '0.875rem',
                        lineHeight: 1.4,
                        width: '100%',
                        textAlign: dotSide === 'right' ? 'left' : dotSide === 'left' ? 'right' : 'center',
                    }}
                >
                    {label}
                </Typography>

                {/* Titles (if provided) */}
                {titles && titles.length > 0 && (
                    <Box sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 0.5,
                        justifyContent: dotSide === 'right' ? 'flex-start' : dotSide === 'left' ? 'flex-end' : 'center',
                        mt: 0.5
                    }}>
                        {titles.map((title, index) => (
                            <Typography
                                key={index}
                                variant="caption"
                                sx={{
                                    fontSize: '0.7rem',
                                    color: 'text.secondary',
                                    bgcolor: 'rgba(0,0,0,0.04)',
                                    px: 0.75,
                                    py: 0.25,
                                    borderRadius: 1,
                                    lineHeight: 1.2
                                }}
                            >
                                {title}
                            </Typography>
                        ))}
                    </Box>
                )}
            </Box>

            {/* Right dot */}
            {(dotSide === 'right' || dotSide === 'both') && (
                <Box sx={{
                    position: 'absolute',
                    right: -5,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    backgroundColor: style.dot,
                    border: '2px solid #ffffff',
                    boxShadow: `0 0 0 1px ${style.dot}44`,
                    transition: 'all 0.2s ease',
                }} />
            )}
        </Box>
    );
});

export default UserRelationsGraph;
