// NIST PQC Comparison Visualization with D3.js
function initNISTComparison(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const width = Math.min(container.clientWidth || 1000, 1200);
    const height = 700;
    const margin = { top: 80, right: 100, bottom: 120, left: 220 };

    // Data
    const data = [
        {
            aspect: "Security Basis",
            nist: "Computational hardness",
            hybrid: "Information-theoretic + Computational",
            advantage: "hybrid",
            category: "text"
        },
        {
            aspect: "Key Size",
            nist: 1700, // bytes
            hybrid: 512, // bytes (4096 bits)
            advantage: "hybrid",
            category: "numeric",
            reduction: "70% smaller"
        },
        {
            aspect: "Long-Term Guarantee",
            nist: "Secure until math breakthrough",
            hybrid: "Unconditional (GHZ layer)",
            advantage: "hybrid",
            category: "text"
        },
        {
            aspect: "Migration Complexity",
            nist: "High (hard forks)",
            hybrid: "Hybrid-friendly (layer on top)",
            advantage: "hybrid",
            category: "text"
        },
        {
            aspect: "Proof of Security",
            nist: "Theoretical + standardization",
            hybrid: "Empirical hardware validation",
            advantage: "hybrid",
            category: "text"
        },
        {
            aspect: "Current Readiness",
            nist: "Software libraries ready",
            hybrid: "Production SDK with hardware validation",
            advantage: "hybrid",
            category: "text"
        }
    ];

    // Clear container
    container.innerHTML = '';

    // Create SVG
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
        .padding(0.4);

    const yScale = d3.scaleLinear()
        .domain([0, 2000])
        .range([height - margin.bottom, margin.top]);

    // Color scheme
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

    // Key Size Comparison (Numeric)
    const keySizeData = data.find(d => d.category === "numeric");
    
    if (keySizeData) {
        const x = xScale(keySizeData.aspect);
        const barWidth = xScale.bandwidth() / 3;
        const centerX = x + xScale.bandwidth() / 2;
        
        // NIST bar
        const nistBar = svg.append("g").attr("class", "nist-bar");
        nistBar.append("rect")
            .attr("x", centerX - barWidth)
            .attr("y", yScale(keySizeData.nist))
            .attr("width", barWidth)
            .attr("height", height - margin.bottom - yScale(keySizeData.nist))
            .attr("fill", colors.nist)
            .attr("opacity", 0.7)
            .attr("rx", 5)
            .style("cursor", "pointer")
            .on("mouseover", function() {
                d3.select(this).attr("opacity", 0.9);
                showTooltip(d3.event, `NIST PQC: ${keySizeData.nist.toLocaleString()} bytes`);
            })
            .on("mouseout", function() {
                d3.select(this).attr("opacity", 0.7);
                hideTooltip();
            });
        
        nistBar.append("text")
            .attr("x", centerX - barWidth / 2)
            .attr("y", yScale(keySizeData.nist) - 8)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("font-weight", "600")
            .attr("fill", colors.nist)
            .text(`${keySizeData.nist.toLocaleString()} bytes`);
        
        // Hybrid bar (highlighted)
        const hybridBar = svg.append("g").attr("class", "hybrid-bar");
        hybridBar.append("rect")
            .attr("x", centerX)
            .attr("y", yScale(keySizeData.hybrid))
            .attr("width", barWidth)
            .attr("height", height - margin.bottom - yScale(keySizeData.hybrid))
            .attr("fill", colors.hybrid)
            .attr("opacity", 0.9)
            .attr("rx", 5)
            .style("cursor", "pointer")
            .on("mouseover", function() {
                d3.select(this).attr("opacity", 1);
                showTooltip(d3.event, `Our Hybrid: ${keySizeData.hybrid.toLocaleString()} bytes (4096 bits)<br><strong>${keySizeData.reduction}!</strong>`);
            })
            .on("mouseout", function() {
                d3.select(this).attr("opacity", 0.9);
                hideTooltip();
            });
        
        hybridBar.append("text")
            .attr("x", centerX + barWidth / 2)
            .attr("y", yScale(keySizeData.hybrid) - 8)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("font-weight", "700")
            .attr("fill", colors.hybrid)
            .text(`${keySizeData.hybrid.toLocaleString()} bytes`);
        
        // Reduction indicator
        svg.append("text")
            .attr("x", centerX + barWidth / 2)
            .attr("y", yScale(keySizeData.hybrid) - 25)
            .attr("text-anchor", "middle")
            .attr("font-size", "11px")
            .attr("font-weight", "600")
            .attr("fill", colors.highlight)
            .text("70% smaller!");
    }

    // Text comparisons for non-numeric aspects
    const textAspects = data.filter(d => d.category === "text");
    const cardHeight = 80;
    const cardSpacing = 20;
    const startY = margin.top + 100;
    
    textAspects.forEach((d, i) => {
        const x = xScale(d.aspect);
        const barWidth = xScale.bandwidth();
        const y = startY + i * (cardHeight + cardSpacing);
        
        // Background cards group
        const cardGroup = svg.append("g").attr("class", `text-comparison-${i}`);
        
        // NIST card
        const nistCard = cardGroup.append("g").attr("class", "nist-card");
        nistCard.append("rect")
            .attr("x", x + 10)
            .attr("y", y)
            .attr("width", barWidth / 2 - 15)
            .attr("height", cardHeight)
            .attr("fill", colors.nist)
            .attr("opacity", 0.08)
            .attr("rx", 8)
            .attr("stroke", colors.nist)
            .attr("stroke-width", 1.5);
        
        nistCard.append("text")
            .attr("x", x + barWidth / 4)
            .attr("y", y + 20)
            .attr("text-anchor", "middle")
            .attr("font-size", "11px")
            .attr("font-weight", "700")
            .attr("fill", colors.nist)
            .text("NIST PQC");
        
        nistCard.append("text")
            .attr("x", x + barWidth / 4)
            .attr("y", y + 40)
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
            .attr("fill", "#555")
            .text(d.nist.length > 30 ? d.nist.substring(0, 27) + "..." : d.nist)
            .call(wrap, barWidth / 2 - 20);
        
        // Hybrid card (highlighted)
        const hybridCard = cardGroup.append("g").attr("class", "hybrid-card");
        hybridCard.append("rect")
            .attr("x", x + barWidth / 2 + 5)
            .attr("y", y)
            .attr("width", barWidth / 2 - 15)
            .attr("height", cardHeight)
            .attr("fill", colors.hybrid)
            .attr("opacity", 0.12)
            .attr("rx", 8)
            .attr("stroke", colors.hybrid)
            .attr("stroke-width", 2.5);
        
        hybridCard.append("text")
            .attr("x", x + barWidth * 3 / 4)
            .attr("y", y + 20)
            .attr("text-anchor", "middle")
            .attr("font-size", "11px")
            .attr("font-weight", "700")
            .attr("fill", colors.hybrid)
            .text("Our Hybrid");
        
        hybridCard.append("text")
            .attr("x", x + barWidth * 3 / 4)
            .attr("y", y + 40)
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
            .attr("font-weight", "500")
            .attr("fill", "#333")
            .text(d.hybrid.length > 30 ? d.hybrid.substring(0, 27) + "..." : d.hybrid)
            .call(wrap, barWidth / 2 - 20);
    });

    // X-axis labels
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

    // Y-axis for key size
    svg.append("g")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(yScale).tickFormat(d => `${d} bytes`))
        .selectAll("text")
        .attr("font-size", "10px")
        .attr("fill", "#666");

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

    // Tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "viz-tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background", "rgba(0, 0, 0, 0.85)")
        .style("color", "white")
        .style("padding", "12px 16px")
        .style("border-radius", "8px")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("z-index", "1000")
        .style("box-shadow", "0 5px 15px rgba(0,0,0,0.3)");

    function showTooltip(event, text) {
        tooltip.transition()
            .duration(200)
            .style("opacity", 1);
        tooltip.html(text)
            .style("left", (event.pageX + 15) + "px")
            .style("top", (event.pageY - 10) + "px");
    }

    function hideTooltip() {
        tooltip.transition()
            .duration(200)
            .style("opacity", 0);
    }

    // Text wrapping function
    function wrap(text, width) {
        text.each(function() {
            const text = d3.select(this);
            const words = text.text().split(/\s+/).reverse();
            let word;
            let line = [];
            let lineNumber = 0;
            const lineHeight = 1.2;
            const y = text.attr("y");
            const dy = parseFloat(text.attr("dy"));
            let tspan = text.text(null).append("tspan").attr("x", text.attr("x")).attr("y", y).attr("dy", dy + "em");
            
            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan.node().getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append("tspan").attr("x", text.attr("x")).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                }
            }
        });
    }

    // Animate on load
    svg.selectAll("rect")
        .attr("height", 0)
        .attr("y", height - margin.bottom)
        .transition()
        .duration(1200)
        .delay((d, i) => i * 150)
        .ease(d3.easeCubicOut)
        .attr("height", function(d) {
            if (d.category === "numeric") {
                return height - margin.bottom - yScale(d.hybrid || d.nist);
            }
            return cardHeight;
        })
        .attr("y", function(d) {
            if (d.category === "numeric") {
                return yScale(d.hybrid || d.nist);
            }
            const index = textAspects.findIndex(t => t.aspect === d.aspect);
            return startY + index * (cardHeight + cardSpacing);
        });

    // Handle resize
    function handleResize() {
        const newWidth = Math.min(container.clientWidth || 1000, 1200);
        svg.attr("width", newWidth)
           .attr("viewBox", `0 0 ${newWidth} ${height}`);
        
        xScale.range([margin.left, newWidth - margin.right]);
        
        // Update positions
        svg.selectAll(".aspect-group")
            .attr("transform", d => `translate(${xScale(d.aspect)}, 0)`);
        
        // Update legend position
        legend.attr("transform", `translate(${newWidth - 140}, ${margin.top + 20})`);
    }

    window.addEventListener("resize", handleResize);
}
