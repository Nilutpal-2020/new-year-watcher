import React, { useEffect, useRef } from 'react';

const FireworksBackground = ({ theme = 'dark', intensity = 'normal', enableExplosions = true }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let width = window.innerWidth;
        let height = window.innerHeight;

        // Configuration
        const particles = [];
        const fireworks = [];

        // Brand Colors: Amber-500, Orange-600, Yellow-400, White
        const colors = [
            '#f59e0b', // Amber
            '#ea580c', // Orange
            '#fbbf24', // Amber Light
            '#ffffff'  // White
        ];

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };

        window.addEventListener('resize', resize);
        resize();

        // --- Classes ---

        class Spark {
            constructor() {
                this.x = Math.random() * width;
                this.y = height + Math.random() * 100; // Start below screen
                this.speedY = Math.random() * 1 + 0.5; // Upward drift
                this.speedX = (Math.random() - 0.5) * 0.5; // Slight sway
                this.size = Math.random() * 2 + 0.5;
                this.alpha = Math.random() * 0.5 + 0.1;
                this.decay = 0.005; // Fade out slowly
            }

            update() {
                this.y -= this.speedY;
                this.x += this.speedX;
                this.alpha -= 0.001; // Very slow fade

                // Reset if off screen or invisible
                if (this.y < -10 || this.alpha <= 0) {
                    this.y = height + 10;
                    this.x = Math.random() * width;
                    this.alpha = Math.random() * 0.5 + 0.3;
                    this.speedY = Math.random() * 1 + 0.5;
                }
            }

            draw() {
                ctx.globalAlpha = this.alpha;
                ctx.fillStyle = theme === 'dark' ? '#fbbf24' : '#f59e0b'; // Gold sparks
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        class FireworkParticle {
            constructor(x, y, color) {
                this.x = x;
                this.y = y;
                this.color = color;
                const angle = Math.random() * Math.PI * 2;
                // const Qr = Math.random() * 3 + 1; // Explosion force
                this.vx = Math.cos(angle) * Math.random() * 3;
                this.vy = Math.sin(angle) * Math.random() * 3;
                this.alpha = 1;
                this.friction = 0.96;
                this.gravity = 0.05;
                this.decay = Math.random() * 0.015 + 0.01;
                this.flicker = 0;
            }

            update() {
                this.vx *= this.friction;
                this.vy *= this.friction;
                this.vy += this.gravity;
                this.x += this.vx;
                this.y += this.vy;
                this.alpha -= this.decay;

                // Sparkle effect calculation
                this.flicker = Math.random() > 0.8 ? 0.2 : 0;
            }

            draw() {
                // Add sparkle flicker to alpha
                const drawAlpha = Math.max(0, Math.min(1, this.alpha + (Math.random() * 0.4 - 0.2)));

                ctx.globalAlpha = drawAlpha;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        class Firework {
            constructor() {
                this.x = Math.random() * width;
                this.y = height;
                this.targetY = height * 0.2 + Math.random() * (height * 0.5); // Explode in upper half
                this.speed = Math.random() * 3 + 10; // Launch speed
                this.color = colors[Math.floor(Math.random() * colors.length)];
                this.particles = [];
                this.exploded = false;
                this.dead = false;
            }

            update() {
                if (!this.exploded) {
                    this.y -= this.speed;
                    this.speed *= 0.98; // Slow down ascent

                    // Explode condition
                    if (this.speed < 4 || this.y <= this.targetY) {
                        this.explode();
                    }
                } else {
                    // Update particles
                    for (let i = this.particles.length - 1; i >= 0; i--) {
                        this.particles[i].update();
                        if (this.particles[i].alpha <= 0) {
                            this.particles.splice(i, 1);
                        }
                    }
                    if (this.particles.length === 0) this.dead = true;
                }
            }

            explode() {
                this.exploded = true;
                const particleCount = 100; // Increased particle count
                for (let i = 0; i < particleCount; i++) {
                    this.particles.push(new FireworkParticle(this.x, this.y, this.color));
                }
            }

            draw() {
                if (!this.exploded) {
                    // Draw rocket with a slight sparkle trail feel
                    ctx.globalAlpha = 1;
                    ctx.fillStyle = this.color;
                    ctx.fillRect(this.x, this.y, 3, 8);
                } else {
                    // Draw explosion
                    this.particles.forEach(p => p.draw());
                }
            }
        }

        // Initialize Background Sparks (Always active for ambiance)
        const sparkCount = width < 768 ? 30 : 60;
        for (let i = 0; i < sparkCount; i++) {
            particles.push(new Spark());
        }

        // --- Animation Loop ---
        const render = () => {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(0, 0, width, height);

            ctx.globalCompositeOperation = 'lighter';

            // Draw Background Sparks
            // particles.forEach(p => {
            //     p.update();
            //     p.draw();
            // });

            // Handle Fireworks logic
            // Only spawn NEW fireworks if enabled. Existing ones finish animating.
            const launchChance = intensity === 'high' ? 0.05 : 0.02;

            if (enableExplosions && Math.random() < launchChance) {
                fireworks.push(new Firework());
            }

            for (let i = fireworks.length - 1; i >= 0; i--) {
                fireworks[i].update();
                fireworks[i].draw();
                if (fireworks[i].dead) {
                    fireworks.splice(i, 1);
                }
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [theme, intensity, enableExplosions]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0"
            style={{
                mixBlendMode: theme === 'dark' ? 'screen' : 'normal',
                opacity: theme === 'dark' ? 0.8 : 0.4
            }}
        />
    );
};

export default FireworksBackground;