import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface Node extends d3.SimulationNodeDatum {
  id: number;
  app_title: string;
  intent: string;
  cluster_id: number;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: number | Node;
  target: number | Node;
  weight: number;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

export const CognitiveGraph: React.FC<{ data: GraphData }> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Grouping / Hull Layer
    const hullGroup = svg.append("g").attr("class", "hulls");

    const simulation = d3.forceSimulation<Node>(data.nodes)
      .force("link", d3.forceLink<Node, Link>(data.links).id(d => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(65).iterations(2))
      .force("cluster", forceCluster());

    // Custom clustering force to pull same cluster_id together
    function forceCluster() {
      let nodes: Node[];
      function force(alpha: number) {
        const centroids = d3.rollup(nodes, 
          v => ({
            x: d3.mean(v, d => d.x || 0) || 0, 
            y: d3.mean(v, d => d.y || 0) || 0
          }), 
          d => d.cluster_id
        );
        for (const d of nodes) {
          const c = centroids.get(d.cluster_id);
          if (c && d.x !== undefined && d.y !== undefined) {
            d.vx! -= (d.x - c.x) * alpha * 0.1;
            d.vy! -= (d.y - c.y) * alpha * 0.1;
          }
        }
      }
      force.initialize = (_: Node[]) => nodes = _;
      return force;
    }

    let selectedLink: Link | null = null;

    svg.on("click", () => {
      selectedLink = null;
      updateHighlight();
    });

    const link = svg.append("g")
      .attr("stroke", "#2A2A2A")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(data.links)
      .join("line")
      .attr("stroke-width", d => Math.sqrt(d.weight) * 2)
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        selectedLink = d;
        updateHighlight();
      });

    const node = svg.append("g")
      .selectAll("g")
      .data(data.nodes)
      .join("g")
      .call(d3.drag<SVGGElement, Node>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any);

    const getColor = (clusterId: number) => {
      const hue = (clusterId * 137.508) % 360;
      return `hsl(${hue}, 80%, 60%)`;
    };

    const getShadowColor = (clusterId: number) => {
      const hue = (clusterId * 137.508) % 360;
      return `hsla(${hue}, 80%, 60%, 0.5)`;
    };

    const getClusterName = (clusterId: number) => {
      const names = ["Dev", "Business", "Research", "Comms", "Other"];
      return names[(clusterId - 1) % names.length] || `Cluster ${clusterId}`;
    };

    node.append("circle")
      .attr("r", 8)
      .attr("fill", d => getColor(d.cluster_id))
      .attr("stroke", "#000")
      .attr("stroke-width", 1.5)
      .style("filter", d => `drop-shadow(0 0 5px ${getShadowColor(d.cluster_id)})`);

    node.append("text")
      .attr("dx", 12)
      .attr("dy", 4)
      .text(d => d.intent)
      .attr("fill", "#888")
      .attr("font-size", "10px")
      .attr("font-family", "JetBrains Mono");

    function updateHighlight() {
      if (selectedLink) {
        link.attr("stroke-opacity", d => d === selectedLink ? 1 : 0.1)
            .attr("stroke", d => d === selectedLink ? "#00FF9D" : "#2A2A2A");
        
        node.style("opacity", d => {
          const isConnected = d === selectedLink!.source || d === selectedLink!.target;
          return isConnected ? 1 : 0.2;
        });
      } else {
        link.attr("stroke-opacity", 0.6)
            .attr("stroke", "#2A2A2A");
        node.style("opacity", 1);
      }
    }

    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as Node).x!)
        .attr("y1", d => (d.source as Node).y!)
        .attr("x2", d => (d.target as Node).x!)
        .attr("y2", d => (d.target as Node).y!);

      node.attr("transform", d => `translate(${d.x},${d.y})`);

      // Update Hulls
      const groups = d3.group(data.nodes, d => d.cluster_id);
      const hullData = Array.from(groups.entries()).map(([key, values]) => {
        let points: [number, number][] = [];
        const pad = 45; // Increased padding for a more spacious feel
        values.forEach(v => {
          if (v.x !== undefined && v.y !== undefined) {
            // Add points in a circle around each node to create a smooth, rounded hull
            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
              points.push([v.x + Math.cos(angle) * pad, v.y + Math.sin(angle) * pad]);
            }
          }
        });
        const hull = d3.polygonHull(points);
        return { cluster_id: key, hull: hull };
      }).filter(d => d.hull !== null);

      const curve = d3.line().curve(d3.curveCatmullRomClosed);

      hullGroup.selectAll("path")
        .data(hullData)
        .join("path")
        .attr("d", d => curve(d.hull!))
        .attr("fill", d => getColor(d.cluster_id))
        .attr("fill-opacity", 0.15) // Increased opacity for distinct background
        .attr("stroke", d => getColor(d.cluster_id))
        .attr("stroke-width", 2)
        .attr("stroke-opacity", 0.8)
        .style("filter", "drop-shadow(0 4px 12px rgba(0,0,0,0.5))"); // Added shadow for depth
        
      hullGroup.selectAll("text")
        .data(hullData)
        .join("text")
        .attr("x", d => d.hull![0][0])
        .attr("y", d => d.hull![0][1] - 15)
        .text(d => `Mission: ${getClusterName(d.cluster_id)}`)
        .attr("fill", d => getColor(d.cluster_id))
        .attr("font-size", "12px")
        .attr("font-family", "JetBrains Mono")
        .attr("font-weight", "bold")
        .attr("opacity", 0.9)
        .style("text-shadow", "0px 2px 4px rgba(0,0,0,0.8)");
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => { simulation.stop(); };
  }, [data]);

  return (
    <svg ref={svgRef} className="w-full h-full" style={{ background: 'transparent' }} />
  );
};
