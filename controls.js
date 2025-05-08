// Controls for Particle Life Simulation

document.addEventListener('DOMContentLoaded', function() {
    // Get references to UI elements
    const canvas = document.getElementById('simulation');
    const paramDisplay = document.getElementById('param-display');
    const slowMotionBtn = document.getElementById('slow-motion');
    
    // Make canvas focusable but without visible outline
    canvas.tabIndex = 1;
    
    // Add focus event handlers for better keyboard event handling on macOS
    canvas.addEventListener('click', function() {
        canvas.focus();
    });
    
    window.addEventListener('focus', function() {
        setTimeout(() => canvas.focus(), 100);
    });
    
    // Add visual indicator for focus
    canvas.addEventListener('focus', function() {
        canvas.style.outline = '2px solid rgba(0, 153, 255, 0.5)';
    });
    
    canvas.addEventListener('blur', function() {
        canvas.style.outline = 'none';
    });
    
    // Focus canvas on page load
    window.addEventListener('load', function() {
        setTimeout(() => canvas.focus(), 300);
    });
    
    // Preset buttons
    document.getElementById('preset-balanced').addEventListener('click', function() {
        const universe = ParticleSimulation.getUniverse();
        universe.setPopulation(9, 400);
        universe.reseed(-0.02, 0.06, 0.0, 20.0, 20.0, 70.0, 0.05, false);
    });
    
    document.getElementById('preset-chaos').addEventListener('click', function() {
        const universe = ParticleSimulation.getUniverse();
        universe.setPopulation(6, 400);
        universe.reseed(0.02, 0.04, 0.0, 30.0, 30.0, 100.0, 0.01, false);
    });
    
    document.getElementById('preset-diversity').addEventListener('click', function() {
        const universe = ParticleSimulation.getUniverse();
        universe.setPopulation(12, 400);
        universe.reseed(-0.01, 0.04, 0.0, 20.0, 10.0, 60.0, 0.05, true);
    });
    
    document.getElementById('preset-frictionless').addEventListener('click', function() {
        const universe = ParticleSimulation.getUniverse();
        universe.setPopulation(6, 300);
        universe.reseed(0.01, 0.005, 10.0, 10.0, 10.0, 60.0, 0.0, true);
    });
    
    document.getElementById('preset-gliders').addEventListener('click', function() {
        const universe = ParticleSimulation.getUniverse();
        universe.setPopulation(6, 400);
        universe.reseed(0.0, 0.06, 0.0, 20.0, 10.0, 50.0, 0.1, true);
    });
    
    document.getElementById('preset-homogeneity').addEventListener('click', function() {
        const universe = ParticleSimulation.getUniverse();
        universe.setPopulation(4, 400);
        universe.reseed(0.0, 0.04, 10.0, 10.0, 10.0, 80.0, 0.05, true);
    });
    
    document.getElementById('preset-large').addEventListener('click', function() {
        const universe = ParticleSimulation.getUniverse();
        universe.setPopulation(6, 400);
        universe.reseed(0.025, 0.02, 0.0, 30.0, 30.0, 100.0, 0.2, false);
    });
    
    document.getElementById('preset-medium').addEventListener('click', function() {
        const universe = ParticleSimulation.getUniverse();
        universe.setPopulation(6, 400);
        universe.reseed(0.02, 0.05, 0.0, 20.0, 20.0, 50.0, 0.05, false);
    });
    
    document.getElementById('preset-quiescence').addEventListener('click', function() {
        const universe = ParticleSimulation.getUniverse();
        universe.setPopulation(6, 300);
        universe.reseed(-0.02, 0.1, 10.0, 20.0, 20.0, 60.0, 0.2, false);
    });
    
    document.getElementById('preset-small').addEventListener('click', function() {
        const universe = ParticleSimulation.getUniverse();
        universe.setPopulation(6, 600);
        universe.reseed(-0.005, 0.01, 10.0, 10.0, 20.0, 50.0, 0.01, false);
    });
    
    // Option buttons
    document.getElementById('toggle-wrap').addEventListener('click', function() {
        const universe = ParticleSimulation.getUniverse();
        const isWrapped = universe.toggleWrap();
        this.textContent = isWrapped ? "Toggle Wrap-Around (ON)" : "Toggle Wrap-Around (W)";
    });
    
    document.getElementById('reseed').addEventListener('click', function() {
        const universe = ParticleSimulation.getUniverse();
        universe.setRandomParticles();
    });
    
    document.getElementById('print-params').addEventListener('click', function() {
        const universe = ParticleSimulation.getUniverse();
        const params = universe.printParams();
        paramDisplay.textContent = params;
    });
    
    // New Particle Interaction Controls
    document.getElementById('follow-off').addEventListener('click', function() {
        ParticleSimulation.setTrackIndex(-1);
    });
    
    document.getElementById('zoom-in').addEventListener('click', function() {
        const newZoom = ParticleSimulation.getCamZoomDest() * 1.2;
        ParticleSimulation.setCamZoomDest(Math.min(newZoom, 10.0));
    });
    
    document.getElementById('zoom-out').addEventListener('click', function() {
        const newZoom = ParticleSimulation.getCamZoomDest() * 0.8;
        ParticleSimulation.setCamZoomDest(Math.max(newZoom, 1.0));
    });
    
    document.getElementById('reset-view').addEventListener('click', function() {
        const universe = ParticleSimulation.getUniverse();
        ParticleSimulation.setCamXDest(universe.width * 0.5);
        ParticleSimulation.setCamYDest(universe.height * 0.5);
        ParticleSimulation.setCamZoomDest(1.0);
        ParticleSimulation.setTrackIndex(-1);
    });
    
    // Slow motion button
    slowMotionBtn.addEventListener('mousedown', function() {
        ParticleSimulation.setStepsPerFrame(1);
    });
    
    slowMotionBtn.addEventListener('mouseup', function() {
        ParticleSimulation.setStepsPerFrame(ParticleSimulation.getStepsPerFrameNormal());
    });
    
    slowMotionBtn.addEventListener('mouseleave', function() {
        ParticleSimulation.setStepsPerFrame(ParticleSimulation.getStepsPerFrameNormal());
    });
    
    // Mouse interactions
    let lastScrollTime = 0;
    
    canvas.addEventListener('mousedown', function(e) {
        if (e.button === 0) { // Left click
            const x = e.clientX - canvas.getBoundingClientRect().left;
            const y = e.clientY - canvas.getBoundingClientRect().top;
            const index = ParticleSimulation.getUniverse().getIndex(x, y);
            ParticleSimulation.setTrackIndex(index);
        } else if (e.button === 2) { // Right click
            ParticleSimulation.setTrackIndex(-1);
        }
    });
    
    canvas.addEventListener('wheel', function(e) {
        e.preventDefault();
        const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = ParticleSimulation.getCamZoomDest() * zoomDelta;
        ParticleSimulation.setCamZoomDest(Math.max(Math.min(newZoom, 10.0), 1.0));
        
        const currentTime = Date.now();
        if (currentTime - lastScrollTime > 300) {
            // Only update position if scroll just started
            const x = e.clientX - canvas.getBoundingClientRect().left;
            const y = e.clientY - canvas.getBoundingClientRect().top;
            
            // Update camera destination based on mouse position
            const universe = ParticleSimulation.getUniverse();
            ParticleSimulation.setCamXDest(universe.centerX + (x - universe.width / 2) / universe.zoom);
            ParticleSimulation.setCamYDest(universe.centerY + (y - universe.height / 2) / universe.zoom);
        }
        lastScrollTime = currentTime;
    });
    
    // Prevent context menu on right-click
    canvas.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });
    
    // Attach keyboard events to canvas instead of document for better behavior on macOS
    canvas.addEventListener('keydown', function(e) {
        const universe = ParticleSimulation.getUniverse();
        
        switch(e.key.toLowerCase()) {
            case 'b':
                universe.setPopulation(9, 400);
                universe.reseed(-0.02, 0.06, 0.0, 20.0, 20.0, 70.0, 0.05, false);
                break;
            case 'c':
                universe.setPopulation(6, 400);
                universe.reseed(0.02, 0.04, 0.0, 30.0, 30.0, 100.0, 0.01, false);
                break;
            case 'd':
                universe.setPopulation(12, 400);
                universe.reseed(-0.01, 0.04, 0.0, 20.0, 10.0, 60.0, 0.05, true);
                break;
            case 'f':
                universe.setPopulation(6, 300);
                universe.reseed(0.01, 0.005, 10.0, 10.0, 10.0, 60.0, 0.0, true);
                break;
            case 'g':
                universe.setPopulation(6, 400);
                universe.reseed(0.0, 0.06, 0.0, 20.0, 10.0, 50.0, 0.1, true);
                break;
            case 'h':
                universe.setPopulation(4, 400);
                universe.reseed(0.0, 0.04, 10.0, 10.0, 10.0, 80.0, 0.05, true);
                break;
            case 'l':
                universe.setPopulation(6, 400);
                universe.reseed(0.025, 0.02, 0.0, 30.0, 30.0, 100.0, 0.2, false);
                break;
            case 'm':
                universe.setPopulation(6, 400);
                universe.reseed(0.02, 0.05, 0.0, 20.0, 20.0, 50.0, 0.05, false);
                break;
            case 'q':
                universe.setPopulation(6, 300);
                universe.reseed(-0.02, 0.1, 10.0, 20.0, 20.0, 60.0, 0.2, false);
                break;
            case 's':
                universe.setPopulation(6, 600);
                universe.reseed(-0.005, 0.01, 10.0, 10.0, 20.0, 50.0, 0.01, false);
                break;
            case 'w':
                const isWrapped = universe.toggleWrap();
                document.getElementById('toggle-wrap').textContent = isWrapped ? 
                    "Toggle Wrap-Around (ON)" : "Toggle Wrap-Around (W)";
                break;
            case 'enter':
                universe.setRandomParticles();
                break;
            case ' ': // Space
                e.preventDefault(); // Prevent scrolling on space
                ParticleSimulation.setStepsPerFrame(1);
                break;
            case 'tab':
                e.preventDefault();
                const params = universe.printParams();
                paramDisplay.textContent = params;
                break;
        }
    });
    
    canvas.addEventListener('keyup', function(e) {
        if (e.key === ' ') { // Space released
            ParticleSimulation.setStepsPerFrame(ParticleSimulation.getStepsPerFrameNormal());
        }
    });
    
    // Keep document-level event listeners as fallback
    document.addEventListener('keydown', function(e) {
        // Only handle keys if canvas doesn't have focus
        if (document.activeElement !== canvas) {
            const universe = ParticleSimulation.getUniverse();
            
            switch(e.key.toLowerCase()) {
                case ' ': // Space
                    e.preventDefault(); // Prevent scrolling on space
                    ParticleSimulation.setStepsPerFrame(1);
                    break;
                // Add other key handlers if needed
            }
        }
    });
    
    document.addEventListener('keyup', function(e) {
        // Only handle keys if canvas doesn't have focus
        if (document.activeElement !== canvas) {
            if (e.key === ' ') { // Space released
                ParticleSimulation.setStepsPerFrame(ParticleSimulation.getStepsPerFrameNormal());
            }
        }
    });
});