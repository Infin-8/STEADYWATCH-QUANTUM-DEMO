// NIST PQC Comparison Visualization with D3.js - FIXED VERSION
function initNISTComparison(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('Container not found:', containerId);
        return;
    }

    if (typeof d3 === 'undefined') {
        console.error('D3.js is not loaded!');
        container.innerHTML = '<p style="color: red; padding: 20px;">Error: D3.js library not loaded.</p>';
        return;
    }

    const width = Math.min(container.clientWidth || 1000, 1200);
    const height = 800; // Increased height for text cards
    const margin = { top: 80, right: 100, bottom: 120, left: 220 };

    // Data
    const data = [
        {
            aspect: "Security Basis",
            nist: "Computational hardness",
            hybrid: "Information-theoretic + Computational",
            category: "text"
        },
        {
            aspect: "Key Size",
            nist: 1700,
            hybrid: 512,
            category: "numeric",
            reduction: "70% smaller"
        },
        {
            aspect: "Long-Term Guarantee",
            nist: "Secure until math breakthrough",
            hybrid: "Unconditional (GHZ layer)",
            category: "text"
        },
        {
            aspect: "Migration Complexity",
            nist: "High (hard forks)",
            hybrid: "Hybrid-friendly (layer on top)",
            category: "text"
        },
        {
            aspect: "Proof of Security",
            nist: "Theoretical + standardization",
            hybrid: "Empirical hardware validation",
            category: "text"
        },
        {
            aspect: "Current Readiness",
            nist: "Software libraries ready",
            hybrid: "Production SDK with hardware validation",
            category: "text"
        }
    ];

    container.innerHTML = '';

    const svg = d3.select(container)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .style("background", "linear-gradient(135deg, #f9f9f9 0%, #ffffff 100%)");

    // Scales
    const xScale = d3.scaleBand()
        .domain(data.map(d => d.aspect))
        .range([margin.left, width - margin.right])
        .padding(0.3);

    const yScale = d3.scaleLinear()
        .domain([0, 2000])
        .range([height - margin.bottom, margin.top]);

    const colors = {
        nist: "#9e9e9e",
        hybrid: "#667eea",
        highlight: "#764ba2"
    };

    // Title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 40)
        .attr("text-anchor", "middle")
        .attr("font-size", "24px")
        .attr("font-weight", "700")
        .attr("fill", "#333")
        .text("NIST PQC vs Our Hybrid System");

    // Separate numeric and text data
    const numericData = data.filter(d => d.category === "numeric");
    const textData = data.filter(d => d.category === "text");

    // Draw Key Size bars (numeric)
    numericData.forEach(d => {
        const x = xScale(d.aspect);
        const barWidth = xScale.bandwidth() / 3;
        const centerX = x + xScale.bandwidth() / 2;
        
        // NIST bar
        svg.append("rect")
            .attr("x", centerX - barWidth)
            .attr("y", yScale(d.nist))
            .attr("width", barWidth)
            .attr("height", height - margin.bottom - yScale(d.nist))
            .attr("fill", colors.nist)
            .attr("opacity", 0.7)
            .attr("rx", 5)
            .style("cursor", "pointer")
            .on("mouseover", function() {
                d3.select(this).attr("opacity", 0.9);
            })
            .on("mouseout", function() {
                d3.select(this).attr("opacity", 0.7);
            });
        
        svg.append("text")
            .attr("x", centerX - barWidth / 2)
            .attr("y", yScale(d.nist) - 8)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("font-weight", "600")
            .attr("fill", colors.nist)
            .text(`${d.nist.toLocaleString()} bytes`);
        
        // Hybrid bar
        svg.append("rect")
            .attr("x", centerX)
            .attr("y", yScale(d.hybrid))
            .attr("width", barWidth)
            .attr("height", height - margin.bottom - yScale(d.hybrid))
            .attr("fill", colors.hybrid)
            .attr("opacity", 0.9)
            .attr("rx", 5)
            .style("cursor", "pointer")
            .on("mouseover", function() {
                d3.select(this).attr("opacity", 1);
            })
            .on("mouseout", function() {
                d3.select(this).attr("opacity", 0.9);
            });
        
        svg.append("text")
            .attr("x", centerX + barWidth / 2)
            .attr("y", yScale(d.hybrid) - 8)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("font-weight", "700")
            .attr("fill", colors.hybrid)
            .text(`${d.hybrid.toLocaleString()} bytes`);
        
        // Reduction indicator
        svg.append("text")
            .attr("x", centerX + barWidth / 2)
            .attr("y", yScale(d.hybrid) - 25)
            .attr("text-anchor", "middle")
            .attr("font-size", "11px")
            .attr("font-weight", "600")
            .attr("fill", colors.highlight)
            .text("70% smaller!");
    });

    // Draw text comparison cards
    const cardHeight = 90;
    const cardSpacing = 15;
    const startY = 150; // Start position for text cards
    
    textData.forEach((d, i) => {
        const x = xScale(d.aspect);
        const barWidth = xScale.bandwidth();
        const y = startY + i * (cardHeight + cardSpacing);
        const cardWidth = barWidth / 2 - 20;
        
        // NIST card
        const nistCard = svg.append("g").attr("class", `nist-card-${i}`);
        
        nistCard.append("rect")
            .attr("x", x + 10)
            .attr("y", y)
            .attr("width", cardWidth)
            .attr("height", cardHeight)
            .attr("fill", colors.nist)
            .attr("opacity", 0.08)
            .attr("rx", 8)
            .attr("stroke", colors.nist)
            .attr("stroke-width", 1.5);
        
        nistCard.append("text")
            .attr("x", x + 10 + cardWidth / 2)
            .attr("y", y + 22)
            .attr("text-anchor", "middle")
            .attr("font-size", "11px")
            .attr("font-weight", "700")
            .attr("fill", colors.nist)
            .text("NIST PQC");
        
        // Wrap text for NIST
        const nistWords = d.nist.split(' ');
        let nistLine = [];
        let nistY = y + 42;
        nistWords.forEach((word, idx) => {
            nistLine.push(word);
            const testText = nistCard.append("text")
                .attr("x", x + 10 + cardWidth / 2)
                .attr("y", nistY)
                .attr("text-anchor", "middle")
                .attr("font-size", "9px")
                .attr("fill", "#555")
                .text(nistLine.join(' '))
                .style("opacity", 0);
            
            if (testText.node().getComputedTextLength() > cardWidth - 10) {
                nistLine.pop();
                if (nistLine.length > 0) {
                    nistCard.append("text")
                        .attr("x", x + 10 + cardWidth / 2)
                        .attr("y", nistY)
                        .attr("text-anchor", "middle")
                        .attr("font-size", "9px")
                        .attr("fill", "#555")
                        .text(nistLine.join(' '));
                }
                nistLine = [word];
                nistY += 14;
            }
            
            if (idx === nistWords.length - 1 && nistLine.length > 0) {
                nistCard.append("text")
                    .attr("x", x + 10 + cardWidth / 2)
                    .attr("y", nistY)
                    .attr("text-anchor", "middle")
                    .attr("font-size", "9px")
                    .attr("fill", "#555")
                    .text(nistLine.join(' '));
            }
            
            testText.remove();
        });
        
        // Hybrid card
        const hybridCard = svg.append("g").attr("class", `hybrid-card-${i}`);
        
        hybridCard.append("rect")
            .attr("x", x + barWidth / 2 + 10)
            .attr("y", y)
            .attr("width", cardWidth)
            .attr("height", cardHeight)
            .attr("fill", colors.hybrid)
            .attr("opacity", 0.12)
            .attr("rx", 8)
            .attr("stroke", colors.hybrid)
            .attr("stroke-width", 2.5);
        
        hybridCard.append("text")
            .attr("x", x + barWidth / 2 + 10 + cardWidth / 2)
            .attr("y", y + 22)
            .attr("text-anchor", "middle")
            .attr("font-size", "11px")
            .attr("font-weight", "700")
            .attr("fill", colors.hybrid)
            .text("Our Hybrid");
        
        // Wrap text for Hybrid
        const hybridWords = d.hybrid.split(' ');
        let hybridLine = [];
        let hybridY = y + 42;
        hybridWords.forEach((word, idx) => {
            hybridLine.push(word);
            const testText = hybridCard.append("text")
                .attr("x", x + barWidth / 2 + 10 + cardWidth / 2)
                .attr("y", hybridY)
                .attr("text-anchor", "middle")
                .attr("font-size", "9px")
                .attr("font-weight", "500")
                .attr("fill", "#333")
                .text(hybridLine.join(' '))
                .style("opacity", 0);
            
            if (testText.node().getComputedTextLength() > cardWidth - 10) {
                hybridLine.pop();
                if (hybridLine.length > 0) {
                    hybridCard.append("text")
                        .attr("x", x + barWidth / 2 + 10 + cardWidth / 2)
                        .attr("y", hybridY)
                        .attr("text-anchor", "middle")
                        .attr("font-size", "9px")
                        .attr("font-weight", "500")
                        .attr("fill", "#333")
                        .text(hybridLine.join(' '));
                }
                hybridLine = [word];
                hybridY += 14;
            }
            
            if (idx === hybridWords.length - 1 && hybridLine.length > 0) {
                hybridCard.append("text")
                    .attr("x", x + barWidth / 2 + 10 + cardWidth / 2)
                    .attr("y", hybridY)
                    .attr("text-anchor", "middle")
                    .attr("font-size", "9px")
                    .attr("font-weight", "500")
                    .attr("fill", "#333")
                    .text(hybridLine.join(' '));
            }
            
            testText.remove();
        });
    });

    // X-axis labels (positioned at bottom)
    svg.append("g")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .attr("text-anchor", "end")
        .attr("dx", "-0.5em")
        .attr("dy", "0.5em")
        .attr("font-size", "11px")
        .attr("fill", "#555");

    // Y-axis for key size (only show for numeric data)
    if (numericData.length > 0) {
        svg.append("g")
            .attr("transform", `translate(${margin.left}, 0)`)
            .call(d3.axisLeft(yScale).tickFormat(d => `${d} bytes`))
            .selectAll("text")
            .attr("font-size", "10px")
            .attr("fill", "#666");
    }

    // Legend
    const legend = svg.append("g")
        .attr("transform", `translate(${width - 140}, ${margin.top + 20})`);

    legend.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 120)
        .attr("height", 70)
        .attr("fill", "white")
        .attr("opacity", 0.95)
        .attr("rx", 8)
        .attr("stroke", "#e0e0e0")
        .attr("stroke-width", 1);

    legend.append("rect")
        .attr("x", 12)
        .attr("y", 18)
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", colors.nist)
        .attr("opacity", 0.7)
        .attr("rx", 3);

    legend.append("text")
        .attr("x", 35)
        .attr("y", 30)
        .attr("font-size", "11px")
        .attr("fill", "#666")
        .text("NIST PQC");

    legend.append("rect")
        .attr("x", 12)
        .attr("y", 45)
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", colors.hybrid)
        .attr("opacity", 0.9)
        .attr("rx", 3);

    legend.append("text")
        .attr("x", 35)
        .attr("y", 57)
        .attr("font-size", "11px")
        .attr("font-weight", "600")
        .attr("fill", colors.hybrid)
        .text("Our Hybrid");

    // Animate on load
    svg.selectAll("rect")
        .attr("opacity", 0)
        .transition()
        .duration(800)
        .delay((d, i) => i * 100)
        .attr("opacity", function() {
            const fill = d3.select(this).attr("fill");
            if (fill === colors.nist) return 0.7;
            if (fill === colors.hybrid) return 0.9;
            return 0.1;
        });
}
