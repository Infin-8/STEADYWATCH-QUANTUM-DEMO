// NIST PQC Comparison Visualization with D3.js
function initNISTComparison(containerId) {
    console.log('Initializing NIST Comparison, container:', containerId);
    
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('Container not found:', containerId);
        return;
    }

    // Check if D3 is loaded
    if (typeof d3 === 'undefined') {
        console.error('D3.js is not loaded! Make sure the D3 script is included before this script.');
        container.innerHTML = '<p style="color: red; padding: 20px;">Error: D3.js library not loaded. Please check your script tags.</p>';
        return;
    }

    console.log('D3.js loaded, container found, proceeding...');

    const width = Math.min(container.clientWidth || 1000, 1200);
    const height = 700;
    const margin = { top: 80, right: 100, bottom: 120, left: 220 };

    // Data - Fixed structure
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
        svg.append("rect")
            .attr("x", centerX - barWidth)
            .attr("y", yScale(keySizeData.nist))
            .attr("width", barWidth)
            .attr("height", height - margin.bottom - yScale(keySizeData.nist))
            .attr("fill", colors.nist)
            .attr("opacity", 0.7)
            .attr("rx", 5);
        
        svg.append("text")
            .attr("x", centerX - barWidth / 2)
            .attr("y", yScale(keySizeData.nist) - 8)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("font-weight", "600")
            .attr("fill", colors.nist)
            .text(`${keySizeData.nist.toLocaleString()} bytes`);
        
        // Hybrid bar
        svg.append("rect")
            .attr("x", centerX)
            .attr("y", yScale(keySizeData.hybrid))
            .attr("width", barWidth)
            .attr("height", height - margin.bottom - yScale(keySizeData.hybrid))
            .attr("fill", colors.hybrid)
            .attr("opacity", 0.9)
            .attr("rx", 5);
        
        svg.append("text")
            .attr("x", centerX + barWidth / 2)
            .attr("y", yScale(keySizeData.hybrid) - 8)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("font-weight", "700")
            .attr("fill", colors.hybrid)
            .text(`${keySizeData.hybrid.toLocaleString()} bytes`);
    }

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

    // Y-axis
    svg.append("g")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(yScale).tickFormat(d => `${d} bytes`))
        .selectAll("text")
        .attr("font-size", "10px")
        .attr("fill", "#666");

    console.log('Visualization created successfully');
}
