// Particle Life Simulation
// Adapted from C++ version to JavaScript

class HSVtoRGB {
    static convert(h, s, v) {
        let r, g, b;
        const i = Math.floor(h * 6);
        const f = h * 6 - i;
        const p = v * (1 - s);
        const q = v * (1 - f * s);
        const t = v * (1 - (1 - f) * s);
        
        switch (i % 6) {
            case 0: r = v; g = t; b = p; break;
            case 1: r = q; g = v; b = p; break;
            case 2: r = p; g = v; b = t; break;
            case 3: r = p; g = q; b = v; break;
            case 4: r = t; g = p; b = v; break;
            case 5: r = v; g = p; b = q; break;
        }
        
        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }
}

class Particle {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.type = 0;
    }
}

class ParticleTypes {
    constructor() {
        this.colors = [];
        this.attract = [];
        this.minR = [];
        this.maxR = [];
    }
    
    resize(size) {
        this.colors = new Array(size);
        this.attract = new Array(size * size).fill(0);
        this.minR = new Array(size * size).fill(0);
        this.maxR = new Array(size * size).fill(0);
    }
    
    size() {
        return this.colors.length;
    }
    
    color(i) {
        return this.colors[i];
    }
    
    attraction(i, j) {
        return this.attract[i * this.colors.length + j];
    }
    
    setAttraction(i, j, value) {
        this.attract[i * this.colors.length + j] = value;
    }
    
    minRadius(i, j) {
        return this.minR[i * this.colors.length + j];
    }
    
    setMinRadius(i, j, value) {
        this.minR[i * this.colors.length + j] = value;
    }
    
    maxRadius(i, j) {
        return this.maxR[i * this.colors.length + j];
    }
    
    setMaxRadius(i, j, value) {
        this.maxR[i * this.colors.length + j] = value;
    }
}

class Universe {
    constructor(numTypes, numParticles, width, height) {
        // Constants
        this.RADIUS = 5.0;
        this.DIAMETER = 2.0 * this.RADIUS;
        this.R_SMOOTH = 2.0;
        
        // Initialize universe properties
        this.particles = [];
        this.types = new ParticleTypes();
        this.width = width;
        this.height = height;
        this.centerX = width * 0.5;
        this.centerY = height * 0.5;
        this.zoom = 1.0;
        this.attractMean = 0.0;
        this.attractStd = 0.0;
        this.minrLower = 0.0;
        this.minrUpper = 0.0;
        this.maxrLower = 0.0;
        this.maxrUpper = 0.0;
        this.friction = 0.0;
        this.flatForce = false;
        this.wrap = false;
        
        // Set population
        this.setPopulation(numTypes, numParticles);
    }
    
    // Normal distribution random number generator using Box-Muller transform
    normalRandom(mean, stdDev) {
        let u = 0, v = 0;
        while(u === 0) u = Math.random();
        while(v === 0) v = Math.random();
        const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        return z * stdDev + mean;
    }
    
    setPopulation(numTypes, numParticles) {
        this.types.resize(numTypes);
        this.particles = new Array(numParticles).fill().map(() => new Particle());
    }
    
    reseed(attractMean, attractStd, minrLower, minrUpper, maxrLower, maxrUpper, friction, flatForce) {
        this.attractMean = attractMean;
        this.attractStd = attractStd;
        this.minrLower = minrLower;
        this.minrUpper = minrUpper;
        this.maxrLower = maxrLower;
        this.maxrUpper = maxrUpper;
        this.friction = friction;
        this.flatForce = flatForce;
        
        this.setRandomTypes();
        this.setRandomParticles();
    }
    
    setRandomTypes() {
        for (let i = 0; i < this.types.size(); i++) {
            // Set color using HSV
            const color = HSVtoRGB.convert(i / this.types.size(), 1.0, (i % 2) * 0.5 + 0.5);
            this.types.colors[i] = `rgba(${color.r}, ${color.g}, ${color.b}, 1.0)`;
            
            for (let j = 0; j < this.types.size(); j++) {
                if (i === j) {
                    // Same type particles usually repel each other
                    this.types.setAttraction(i, j, -Math.abs(this.normalRandom(this.attractMean, this.attractStd)));
                    this.types.setMinRadius(i, j, this.DIAMETER);
                } else {
                    // Different types have random attractions
                    this.types.setAttraction(i, j, this.normalRandom(this.attractMean, this.attractStd));
                    this.types.setMinRadius(i, j, Math.max(this.minrLower + Math.random() * (this.minrUpper - this.minrLower), this.DIAMETER));
                }
                
                // Set maximum radius
                this.types.setMaxRadius(i, j, Math.max(this.maxrLower + Math.random() * (this.maxrUpper - this.maxrLower), this.types.minRadius(i, j)));
                
                // Keep radii symmetric
                this.types.setMaxRadius(j, i, this.types.maxRadius(i, j));
                this.types.setMinRadius(j, i, this.types.minRadius(i, j));
            }
        }
    }
    
    setRandomParticles() {
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            p.type = Math.floor(Math.random() * this.types.size());
            p.x = (Math.random() * 0.5 + 0.25) * this.width;
            p.y = (Math.random() * 0.5 + 0.25) * this.height;
            p.vx = this.normalRandom(0, 0.2);
            p.vy = this.normalRandom(0, 0.2);
        }
    }
    
    step() {
        // Calculate forces between particles
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            
            // Interactions with other particles
            for (let j = 0; j < this.particles.length; j++) {
                const q = this.particles[j];
                
                // Get deltas
                let dx = q.x - p.x;
                let dy = q.y - p.y;
                
                // Handle wrap-around if enabled
                if (this.wrap) {
                    if (dx > this.width * 0.5) {
                        dx -= this.width;
                    } else if (dx < -this.width * 0.5) {
                        dx += this.width;
                    }
                    
                    if (dy > this.height * 0.5) {
                        dy -= this.height;
                    } else if (dy < -this.height * 0.5) {
                        dy += this.height;
                    }
                }
                
                // Get distance squared
                const r2 = dx * dx + dy * dy;
                const minR = this.types.minRadius(p.type, q.type);
                const maxR = this.types.maxRadius(p.type, q.type);
                
                // Skip if too far away or too close
                if (r2 > maxR * maxR || r2 < 0.01) {
                    continue;
                }
                
                // Normalize displacement
                const r = Math.sqrt(r2);
                dx /= r;
                dy /= r;
                
                // Calculate force
                let f = 0.0;
                if (r > minR) {
                    if (this.flatForce) {
                        f = this.types.attraction(p.type, q.type);
                    } else {
                        const numer = 2.0 * Math.abs(r - 0.5 * (maxR + minR));
                        const denom = maxR - minR;
                        f = this.types.attraction(p.type, q.type) * (1.0 - numer / denom);
                    }
                } else {
                    // Repulsion when too close
                    f = this.R_SMOOTH * minR * (1.0 / (minR + this.R_SMOOTH) - 1.0 / (r + this.R_SMOOTH));
                }
                
                // Apply force
                p.vx += f * dx;
                p.vy += f * dy;
            }
        }
        
        // Update positions
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            
            // Update position and velocity
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= (1.0 - this.friction);
            p.vy *= (1.0 - this.friction);
            
            // Handle boundaries
            if (this.wrap) {
                // Wrap around
                if (p.x < 0) {
                    p.x += this.width;
                } else if (p.x >= this.width) {
                    p.x -= this.width;
                }
                
                if (p.y < 0) {
                    p.y += this.height;
                } else if (p.y >= this.height) {
                    p.y -= this.height;
                }
            } else {
                // Bounce off walls
                if (p.x <= this.DIAMETER) {
                    p.vx = -p.vx;
                    p.x = this.DIAMETER;
                } else if (p.x >= this.width - this.DIAMETER) {
                    p.vx = -p.vx;
                    p.x = this.width - this.DIAMETER;
                }
                
                if (p.y <= this.DIAMETER) {
                    p.vy = -p.vy;
                    p.y = this.DIAMETER;
                } else if (p.y >= this.height - this.DIAMETER) {
                    p.vy = -p.vy;
                    p.y = this.height - this.DIAMETER;
                }
            }
        }
    }
    
    draw(ctx, opacity = 1.0) {
        // Clear the canvas
        ctx.clearRect(0, 0, this.width, this.height);
        
        // Draw each particle
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            const x = (p.x - this.centerX) * this.zoom + this.width / 2;
            const y = (p.y - this.centerY) * this.zoom + this.height / 2;
            
            // Only draw particles that are within view
            if (x >= -this.RADIUS && x <= this.width + this.RADIUS && 
                y >= -this.RADIUS && y <= this.height + this.RADIUS) {
                
                // Draw the particle
                ctx.beginPath();
                ctx.arc(x, y, this.RADIUS * this.zoom, 0, Math.PI * 2);
                
                // Apply color with opacity
                const color = this.types.color(p.type);
                const rgbaColor = color.replace('rgba(', '').replace(')', '').split(',');
                ctx.fillStyle = `rgba(${rgbaColor[0]}, ${rgbaColor[1]}, ${rgbaColor[2]}, ${opacity})`;
                ctx.fill();
            }
        }
    }
    
    setZoom(cx, cy, zoomLevel) {
        // Apply zoom
        this.centerX = cx;
        this.centerY = cy;
        this.zoom = Math.max(1.0, zoomLevel);
        
        // Clamp to make sure camera doesn't go out of bounds
        this.centerX = Math.min(this.centerX, this.width * (1.0 - 0.5 / this.zoom));
        this.centerY = Math.min(this.centerY, this.height * (1.0 - 0.5 / this.zoom));
        this.centerX = Math.max(this.centerX, this.width * (0.5 / this.zoom));
        this.centerY = Math.max(this.centerY, this.height * (0.5 / this.zoom));
    }
    
    toggleWrap() {
        this.wrap = !this.wrap;
        return this.wrap;
    }
    
    getIndex(x, y) {
        const cx = this.centerX + (x - this.width / 2) / this.zoom;
        const cy = this.centerY + (y - this.height / 2) / this.zoom;
        
        for (let i = 0; i < this.particles.length; i++) {
            const dx = this.particles[i].x - cx;
            const dy = this.particles[i].y - cy;
            if (dx * dx + dy * dy < this.RADIUS * this.RADIUS) {
                return i;
            }
        }
        
        return -1;
    }
    
    getParticleX(index) {
        return this.particles[index].x;
    }
    
    getParticleY(index) {
        return this.particles[index].y;
    }
    
    printParams() {
        let output = "Attraction Matrix:\n";
        for (let i = 0; i < this.types.size(); i++) {
            let row = "";
            for (let j = 0; j < this.types.size(); j++) {
                row += this.types.attraction(i, j).toFixed(4).padStart(8) + "  ";
            }
            output += row + "\n";
        }
        
        output += "\nMinimum Radius:\n";
        for (let i = 0; i < this.types.size(); i++) {
            let row = "";
            for (let j = 0; j < this.types.size(); j++) {
                row += this.types.minRadius(i, j).toFixed(4).padStart(8) + "  ";
            }
            output += row + "\n";
        }
        
        output += "\nMaximum Radius:\n";
        for (let i = 0; i < this.types.size(); i++) {
            let row = "";
            for (let j = 0; j < this.types.size(); j++) {
                row += this.types.maxRadius(i, j).toFixed(4).padStart(8) + "  ";
            }
            output += row + "\n";
        }
        
        return output;
    }
}

// Initialize universe when window loads
let canvas, ctx, universe, animationId;
let isRunning = true;
let camXDest, camYDest, camZoomDest;
let camX, camY, camZoom;
let trackIndex = -1;
let stepsPerFrame = 10;
let stepsPerFrameNormal = 10;

// Add debugging
function debug(message) {
    console.log(`[DEBUG] ${message}`);
}

// Initialize the simulation
function initSimulation() {
    debug("Initializing simulation");
    
    // Get the canvas element
    canvas = document.getElementById('simulation');
    if (!canvas) {
        console.error("Canvas element 'simulation' not found");
        return;
    }
    
    // Get the 2D context
    ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error("Failed to get 2D context from canvas");
        return;
    }
    
    // Set canvas dimensions
    resizeCanvas();
    debug(`Canvas dimensions: ${canvas.width}x${canvas.height}`);
    
    // Create universe
    universe = new Universe(9, 400, canvas.width, canvas.height);
    universe.reseed(-0.02, 0.06, 0.0, 20.0, 20.0, 70.0, 0.05, false); // Balanced preset by default
    debug("Universe created and seeded");
    
    // Test drawing a particle directly to verify canvas works
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.arc(canvas.width/2, canvas.height/2, 10, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 0, 0, 1.0)';
    ctx.fill();
    debug("Test particle drawn");
    
    // Initialize camera
    camX = camXDest = canvas.width / 2;
    camY = camYDest = canvas.height / 2;
    camZoom = camZoomDest = 1.0;
    
    // Start animation loop
    debug("Starting animation loop");
    animationLoop();
}

// Handle canvas resizing
function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    
    debug(`Canvas resized to ${canvas.width}x${canvas.height}`);
    
    if (universe) {
        universe.width = canvas.width;
        universe.height = canvas.height;
    }
}

// Main animation loop
function animationLoop() {
    try {
        // Update camera
        if (trackIndex >= 0 && trackIndex < universe.particles.length) {
            camXDest = universe.getParticleX(trackIndex);
            camYDest = universe.getParticleY(trackIndex);
        }
        
        camX = camX * 0.9 + camXDest * 0.1;
        camY = camY * 0.9 + camYDest * 0.1;
        camZoom = camZoom * 0.8 + camZoomDest * 0.2;
        universe.setZoom(camX, camY, camZoom);
        
        // Simulation steps
        for (let i = 0; i < stepsPerFrame; i++) {
            const opacity = (i + 1) / stepsPerFrame;
            universe.step();
            if (i === stepsPerFrame - 1) {
                universe.draw(ctx, opacity);
            }
        }
        
        if (isRunning) {
            animationId = requestAnimationFrame(animationLoop);
        }
    } catch (error) {
        console.error("Error in animation loop:", error);
    }
}

// Make sure to wait for DOM to load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSimulation);
} else {
    // DOM already loaded, initialize immediately
    initSimulation();
}

window.addEventListener('resize', resizeCanvas);

// Export for use in controls.js
window.ParticleSimulation = {
    getUniverse: () => universe,
    setStepsPerFrame: (steps) => { stepsPerFrame = steps; },
    getStepsPerFrame: () => stepsPerFrame,
    setStepsPerFrameNormal: (steps) => { stepsPerFrameNormal = steps; },
    getStepsPerFrameNormal: () => stepsPerFrameNormal,
    getTrackIndex: () => trackIndex,
    setTrackIndex: (index) => { trackIndex = index; },
    getCamXDest: () => camXDest,
    getCamYDest: () => camYDest,
    setCamXDest: (x) => { camXDest = x; },
    setCamYDest: (y) => { camYDest = y; },
    getCamZoomDest: () => camZoomDest,
    setCamZoomDest: (zoom) => { camZoomDest = zoom; },
    forceRedraw: () => {
        if (universe && ctx) {
            universe.draw(ctx, 1.0);
        }
    }
};