import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Users, Shield, Award, Target } from 'lucide-react';

// --- Styled Components ---

const FlowchartContainer = styled.div`
  width: 100%;
  padding: 6rem 2rem 10rem;
  background: transparent;
  position: relative;
  overflow: visible;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rem;
  min-height: 1600px;
`;

const SvgContainer = styled.svg`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
`;

const LevelContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: ${props => props.$gap || '4rem'};
  width: 100%;
  max-width: 1600px;
  z-index: 2;
  position: relative;
`;

const NodeWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 2;
  width: ${props => props.$isUnit ? '240px' : '300px'};
  flex-shrink: 0;
`;

const AnchorPoint = styled.div`
  position: absolute;
  left: 50%;
  width: 1px;
  height: 1px;
  visibility: hidden;
  pointer-events: none;
  ${props => props.$pos === 'top' ? 'top: -5px;' : 'bottom: -5px;'}
`;

const NodeCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border: 1.5px solid rgba(255, 255, 255, 0.5);
  border-radius: 24px;
  padding: 1.5rem;
  width: 100%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  z-index: 10;
  text-align: center;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: ${props => props.$color || '#3b82f6'};
    box-shadow: 0 0 10px ${props => props.$color || '#3b82f6'}40;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.9);
    border-color: ${props => props.$color || '#3b82f6'};
    transform: translateY(-10px) scale(1.02);
    box-shadow: 0 20px 40px -10px ${props => props.$color || '#3b82f6'}20;
  }
`;

const IconRing = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: ${props => props.$color}10;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  border: 1.5px solid ${props => props.$color}30;
  color: ${props => props.$color || '#1e293b'};
`;

const NodeRank = styled.div`
  font-size: 0.7rem;
  font-weight: 800;
  color: ${props => props.$color || '#94a3b8'};
  text-transform: uppercase;
  letter-spacing: 0.2em;
  margin-bottom: 0.5rem;
  opacity: 0.8;
`;

const OfficerRank = styled.div`
  font-size: 0.85rem;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.15rem;
`;

const NodeName = styled.div`
  font-size: 1.15rem;
  font-weight: 900;
  color: #0f172a;
  line-height: 1.3;
  text-transform: uppercase;
`;

const NodeSubtitle = styled.div`
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.5rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const InfoBadge = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 4px 8px;
  background: #f1f5f9;
  border-radius: 8px;
  font-size: 0.6rem;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
  border: 1px solid #e2e8f0;
`;

// Unused animations removed

const GlowingLine = ({ path }) => {
    // Universal high-visibility Command Blue
    const flowColor = "#3b82f6";

    return (
        <g>
            {/* 1. Underlying structural path (Guide Line) */}
            <path
                d={path}
                stroke={flowColor}
                strokeWidth="2.5"
                fill="none"
                opacity="0.2"
                markerEnd="url(#chevron-marker)"
            />

            {/* 2. Primary Energetic Flow (Glow) */}
            <motion.path
                d={path}
                stroke={flowColor}
                strokeWidth="8"
                fill="none"
                opacity="0.1"
                filter="url(#glow-vibrant)"
            />

            {/* 3. The Repeating Flowing Chevrons (Absolute pixel spacing) */}
            <motion.path
                d={path}
                stroke={flowColor}
                strokeWidth="4"
                fill="none"
                strokeDasharray="20, 30"
                strokeLinecap="round"
                initial={{ strokeDashoffset: 0 }}
                animate={{ strokeDashoffset: -500 }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "linear"
                }}
                filter="url(#glow-vibrant)"
                opacity="0.6"
            />

            {/* 4. High-Speed Energy Bursts with Arrowhead */}
            <motion.path
                d={path}
                stroke={flowColor}
                strokeWidth="5"
                fill="none"
                strokeDasharray="15, 120"
                strokeLinecap="round"
                initial={{ strokeDashoffset: 0 }}
                animate={{ strokeDashoffset: -400 }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear"
                }}
                filter="url(#glow-vibrant)"
                markerEnd="url(#chevron-marker)"
            />

            {/* 5. Hot Neon Core pulse */}
            <motion.path
                d={path}
                stroke="#fff"
                strokeWidth="1.5"
                fill="none"
                strokeDasharray="5, 145"
                strokeLinecap="round"
                initial={{ strokeDashoffset: 0 }}
                animate={{ strokeDashoffset: -400 }}
                transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: "linear"
                }}
            />
        </g>
    );
};

// Hierarchical Structure for Logic
const HIERARCHY = [
    { id: 'dg', children: ['ddg'] },
    { id: 'ddg', children: ['group_a', 'group_b'] },
    { id: 'group_a', children: ['unit_army', 'unit_med'] },
    { id: 'group_b', children: ['unit_air', 'unit_navy'] },
    { id: 'unit_army', children: ['ano_army'] },
    { id: 'unit_med', children: ['ano_med'] },
    { id: 'unit_air', children: ['ano_air'] },
    { id: 'unit_navy', children: ['ano_navy'] },
];

const OrganizationFlowchart = ({ officerData, onNodeClick }) => {
    const [lines, setLines] = useState([]);



    const updateLines = useCallback(() => {
        const newLines = [];
        const container = document.getElementById('flowchart-container');
        if (!container) return;

        const containerRect = container.getBoundingClientRect();

        HIERARCHY.forEach(parent => {
            const parentBottomEl = document.getElementById(`anchor-bottom-${parent.id}`);
            if (!parentBottomEl) return;
            const parentRect = parentBottomEl.getBoundingClientRect();
            const startX = parentRect.left + parentRect.width / 2 - containerRect.left;
            const startY = parentRect.top - containerRect.top;

            parent.children.forEach(childId => {
                const childTopEl = document.getElementById(`anchor-top-${childId}`);
                if (!childTopEl) return;
                const childRect = childTopEl.getBoundingClientRect();

                const endX = childRect.left + childRect.width / 2 - containerRect.left;
                const endY = childRect.top - containerRect.top;

                // Create a clean stepped path, avoid redundant segments for vertical lines
                let path = "";
                if (Math.abs(startX - endX) < 1) {
                    // Perfectly vertical line
                    path = `M ${startX} ${startY} L ${endX} ${endY}`;
                } else {
                    // Stepped path
                    const midY = startY + (endY - startY) / 2;
                    path = `M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`;
                }

                newLines.push({
                    id: `${parent.id}-${childId}`,
                    path: path,
                    color: officerData[parent.id]?.color || '#3b82f6'
                });
            });
        });
        setLines(newLines);
    }, [officerData]);

    React.useLayoutEffect(() => {
        const handleResize = () => updateLines();
        const timer = setTimeout(updateLines, 1000); // Increased delay for better stability

        // ResizeObserver for nodes to handle layout shifts
        const observer = new ResizeObserver(() => {
            requestAnimationFrame(updateLines);
        });

        const container = document.getElementById('flowchart-container');
        if (container) observer.observe(container);

        window.addEventListener('resize', handleResize);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', handleResize);
            observer.disconnect();
        };
    }, [officerData, updateLines]);

    const getIconForId = (id) => {
        if (id === 'dg') return <Shield size={24} />;
        if (id === 'ddg') return <Users size={24} />;
        if (id.includes('group')) return <Award size={24} />;
        if (id.includes('unit')) return <Target size={24} />;
        return <Users size={20} />;
    };

    const renderNode = (id, level) => {
        const data = officerData[id] || {};
        const color = data.color || (
            id.includes('army') || id.includes('med') ? '#ef4444' :
                id.includes('air') ? '#0ea5e9' :
                    id.includes('navy') ? '#2563eb' :
                        id === 'dg' || id === 'ddg' ? '#f59e0b' : '#3b82f6'
        );

        return (
            <NodeWrapper key={id} $isUnit={level >= 3}>
                <AnchorPoint id={`anchor-top-${id}`} $pos="top" />
                <NodeCard
                    $color={color}
                    initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
                    whileInView={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: level * 0.1 }}
                    onClick={() => onNodeClick(data)}
                >
                    <InfoBadge>
                        {id.includes('army') ? 'BTY' : id.split('_').pop().toUpperCase()}
                    </InfoBadge>
                    <NodeRank $color={color}>{data.rank}</NodeRank>
                    <IconRing $color={color}>
                        {getIconForId(id)}
                    </IconRing>
                    {data.officerRank && <OfficerRank>{data.officerRank}</OfficerRank>}
                    <NodeName>{data.name}</NodeName>
                    {data.subtitle && <NodeSubtitle>{data.subtitle}</NodeSubtitle>}
                </NodeCard>
                <AnchorPoint id={`anchor-bottom-${id}`} $pos="bottom" />
            </NodeWrapper>
        );
    };

    return (
        <FlowchartContainer id="flowchart-container">
            <SvgContainer>
                <defs>
                    <filter id="glow-vibrant" filterUnits="userSpaceOnUse" x="-100%" y="-100%" width="300%" height="300%">
                        <feGaussianBlur stdDeviation="3.5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>

                    <marker
                        id="chevron-marker"
                        markerWidth="16"
                        markerHeight="16"
                        refX="14"
                        refY="8"
                        orient="auto"
                        markerUnits="userSpaceOnUse"
                        overflow="visible"
                    >
                        {/* High-visibility professional chevron */}
                        <path
                            d="M2 2 L12 8 L2 14"
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </marker>
                </defs>
                {lines.map(line => (
                    <GlowingLine key={line.id} {...line} />
                ))}
            </SvgContainer>

            {/* Row 1: DG */}
            <LevelContainer>{renderNode('dg', 0)}</LevelContainer>

            {/* Row 2: DDG */}
            <LevelContainer>{renderNode('ddg', 1)}</LevelContainer>

            {/* Row 3: Groups */}
            <LevelContainer $gap="28rem">
                {renderNode('group_a', 2)}
                {renderNode('group_b', 2)}
            </LevelContainer>

            {/* Row 4: Units */}
            <LevelContainer $gap="12rem" style={{ flexWrap: 'nowrap' }}>
                <div style={{ display: 'flex', gap: '6rem', justifyContent: 'center', flexShrink: 0 }}>
                    {renderNode('unit_army', 3)}
                    {renderNode('unit_med', 3)}
                </div>
                <div style={{ display: 'flex', gap: '6rem', justifyContent: 'center', flexShrink: 0 }}>
                    {renderNode('unit_air', 3)}
                    {renderNode('unit_navy', 3)}
                </div>
            </LevelContainer>

            {/* Row 5: ANOs */}
            <LevelContainer $gap="12rem" style={{ flexWrap: 'nowrap' }}>
                <div style={{ display: 'flex', gap: '6rem', justifyContent: 'center', flexShrink: 0 }}>
                    {renderNode('ano_army', 4)}
                    {renderNode('ano_med', 4)}
                </div>
                <div style={{ display: 'flex', gap: '6rem', justifyContent: 'center', flexShrink: 0 }}>
                    {renderNode('ano_air', 4)}
                    {renderNode('ano_navy', 4)}
                </div>
            </LevelContainer>
        </FlowchartContainer>
    );
};

export default OrganizationFlowchart;
