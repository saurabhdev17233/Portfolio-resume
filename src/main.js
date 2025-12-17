console.log("v4 Setup Initialized");
import { LiquidBackground } from './scene.js';

// Setup GSAP
gsap.registerPlugin(ScrollTrigger);

// Setup 3D Scene
const bg = new LiquidBackground();

// Setup Lenis (Smooth Scroll)
const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth: true
});

function raf(time) {
    lenis.raf(time);

    // Render 3D
    bg.render(time * 0.001); // Seconds

    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// Cursor Logic
const cursor = document.querySelector('.cursor');
const follower = document.querySelector('.cursor-follower');

document.addEventListener('mousemove', (e) => {
    gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.1 });
    gsap.to(follower, { x: e.clientX - 15, y: e.clientY - 15, duration: 0.3 });
});

// Magnetic Buttons
document.querySelectorAll('.magnetic').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        gsap.to(btn, { x: x * 0.3, y: y * 0.3, duration: 0.3 });
    });
    btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.3 });
    });
});

// Animations
// 1. Text Reveal
gsap.utils.toArray('.reveal-text').forEach(text => {
    gsap.from(text, {
        y: 100,
        opacity: 0,
        duration: 1.5,
        ease: "power4.out",
        scrollTrigger: {
            trigger: text,
            start: "top 85%",
        }
    });
});

// 2. Horizontal Scroll
const workContainer = document.querySelector('.horizontal-container');
if (workContainer) {
    gsap.to(workContainer, {
        x: () => -(workContainer.scrollWidth - window.innerWidth + 100),
        ease: "none",
        scrollTrigger: {
            trigger: "#work",
            pin: true,
            scrub: 1,
            end: () => "+=" + workContainer.scrollWidth
        }
    });
}

// 3. Parallax Images
gsap.utils.toArray('.about-img-container').forEach(container => {
    const img = container.querySelector('img');
    gsap.to(img, {
        yPercent: 20,
        ease: "none",
        scrollTrigger: {
            trigger: container,
            scrub: true
        }
    });
});
