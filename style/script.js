const canvas = document.getElementById("stars");
const ctx = canvas.getContext("2d");

let width, height;
let stars = [];
let shootingStars = [];
let explosions = [];
let time = 0;
let textLetters = [];
let textVisible = true;

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    createStars();
    createTextLetters();
}

function createTextLetters() {
    textLetters = [];
    const texts = [
        { text: "Все звезды для тебя", y: height * 0.4, size: 46 },
        { text: "Загадай желание, а вдруг сбудется", y: height * 0.5, size: 32 }
    ];
    
    texts.forEach(({ text, y, size }) => {
        createLettersForText(text, y, size);
    });
}

function createLettersForText(text, yPos, fontSize) {
    ctx.font = `600 ${fontSize}px Arial`;
    const textWidth = ctx.measureText(text).width;
    const x = (width - textWidth) / 2;
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === ' ') continue;
        
        const charWidth = ctx.measureText(char).width;
        const charX = x + ctx.measureText(text.substring(0, i)).width;
        
        textLetters.push({
            char: char,
            originalX: charX,
            originalY: yPos,
            x: charX,
            y: yPos,
            width: charWidth,
            height: fontSize,
            fontSize: fontSize,
            alpha: 0.3,
            isScattered: false,
            scatterTime: 0,
            particles: [],
            returnProgress: 0,
            color: {
                r: 220 + Math.random() * 35,
                g: 220 + Math.random() * 35,
                b: 220 + Math.random() * 35
            }
        });
    }
}

function scatterLetter(letter) {
    if (letter.isScattered) return;
    
    letter.isScattered = true;
    letter.scatterTime = 0;
    letter.particles = [];
    letter.returnProgress = 0;
    
    // ОЧЕНЬ МНОГО ОЧЕНЬ МАЛЕНЬКИХ частиц
    const particleCount = 40 + Math.floor(letter.fontSize);
    
    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * letter.fontSize * 0.2;
        
        letter.particles.push({
            x: letter.x + Math.cos(angle) * distance,
            y: letter.y + Math.sin(angle) * distance,
            originalX: letter.x + (Math.random() - 0.5) * letter.width * 0.1,
            originalY: letter.y + (Math.random() - 0.5) * letter.height * 0.1,
            targetX: letter.x + (Math.random() - 0.5) * 100,
            targetY: letter.y + (Math.random() - 0.5) * 100,
            size: Math.random() * 0.8 + 0.5, // ОЧЕНЬ МАЛЕНЬКИЕ частицы (0.5-1.3px)
            alpha: 0.9,
            speed: Math.random() * 0.06 + 0.03,
            color: {
                r: letter.color.r,
                g: letter.color.g,
                b: letter.color.b
            },
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.08,
            isReturning: false,
            ease: Math.random() * 0.1 + 0.9, // Плавность движения
            driftX: (Math.random() - 0.5) * 0.3, // Плавное дрейфование
            driftY: (Math.random() - 0.5) * 0.3
        });
    }
}

function updateTextLetters() {
    for (let letter of textLetters) {
        if (letter.isScattered) {
            letter.scatterTime++;
            
            // Плавное изменение прозрачности
            const scatterPhase = Math.min(letter.scatterTime / 60, 1);
            
            if (scatterPhase < 0.4) {
                // Плавный разлет
                for (let particle of letter.particles) {
                    const progress = scatterPhase / 0.4;
                    const easeProgress = 1 - Math.pow(1 - progress, 2); // Ease-out
                    
                    particle.x = particle.x + (particle.targetX - particle.x) * 0.1 * particle.ease;
                    particle.y = particle.y + (particle.targetY - particle.y) * 0.1 * particle.ease;
                    
                    // Плавное вращение и дрейф
                    particle.rotation += particle.rotationSpeed;
                    particle.x += particle.driftX;
                    particle.y += particle.driftY;
                    
                    // Плавное исчезновение
                    particle.alpha = 0.9 * (1 - easeProgress * 0.6);
                }
            } else if (scatterPhase < 0.6) {
                // Плавная пауза с легким мерцанием
                for (let particle of letter.particles) {
                    particle.rotation += particle.rotationSpeed;
                    particle.x += particle.driftX;
                    particle.y += particle.driftY;
                    
                    // Легкое мерцание
                    particle.alpha = 0.4 + Math.sin(time * 5 + particle.x) * 0.1;
                }
            } else {
                // Плавное возвращение
                letter.returnProgress = (scatterPhase - 0.6) / 0.4;
                
                for (let particle of letter.particles) {
                    const returnProgress = Math.min(letter.returnProgress * 1.2, 1);
                    const easeProgress = 1 - Math.pow(1 - returnProgress, 3); // Ease-out
                    
                    particle.x = particle.x + (particle.originalX - particle.x) * 0.12 * particle.ease;
                    particle.y = particle.y + (particle.originalY - particle.y) * 0.12 * particle.ease;
                    
                    particle.rotation += particle.rotationSpeed;
                    particle.x += particle.driftX * (1 - easeProgress);
                    particle.y += particle.driftY * (1 - easeProgress);
                    
                    // Плавное появление
                    particle.alpha = 0.4 + 0.6 * easeProgress;
                    
                    // Плавная проверка возвращения
                    const dx = particle.originalX - particle.x;
                    const dy = particle.originalY - particle.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 1) {
                        particle.x = particle.originalX;
                        particle.y = particle.originalY;
                    }
                }
                
                // Плавное завершение анимации
                if (letter.returnProgress >= 0.9) {
                    letter.isScattered = false;
                    letter.alpha = 0.3;
                    
                    // Гарантируем, что все частицы вернулись
                    for (let particle of letter.particles) {
                        particle.x = particle.originalX;
                        particle.y = particle.originalY;
                    }
                }
            }
        }
    }
}

function drawTextLetters() {
    for (let letter of textLetters) {
        if (letter.isScattered) {
            // Рисуем ОЧЕНЬ МАЛЕНЬКИЕ частицы с плавностью
            for (let particle of letter.particles) {
                if (particle.alpha > 0.1) {
                    ctx.save();
                    
                    // Плавное свечение
                    ctx.shadowBlur = 4;
                    ctx.shadowColor = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${particle.alpha * 0.2})`;
                    
                    // Плавный градиент для крошечных частиц
                    const gradient = ctx.createRadialGradient(
                        particle.x, particle.y, 0,
                        particle.x, particle.y, particle.size * 2
                    );
                    gradient.addColorStop(0, `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${particle.alpha})`);
                    gradient.addColorStop(1, `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, 0)`);
                    
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.restore();
                }
            }
        } else if (textVisible && letter.alpha > 0) {
            // Рисуем полупрозрачный текст с плавным свечением
            ctx.shadowBlur = 10;
            ctx.shadowColor = `rgba(${letter.color.r}, ${letter.color.g}, ${letter.color.b}, ${letter.alpha * 0.3})`;
            
            ctx.font = `600 ${letter.fontSize}px Arial`;
            ctx.fillStyle = `rgba(${letter.color.r}, ${letter.color.g}, ${letter.color.b}, ${letter.alpha})`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(letter.char, letter.x, letter.y);
            
            ctx.shadowBlur = 0;
        }
    }
}

function checkCometTextCollision() {
    for (let comet of shootingStars) {
        for (let letter of textLetters) {
            if (!letter.isScattered) {
                const cometRight = comet.x + comet.thickness * 1.5;
                const cometBottom = comet.y + comet.thickness * 1.5;
                
                const letterLeft = letter.x;
                const letterRight = letter.x + letter.width;
                const letterTop = letter.y - letter.fontSize / 2;
                const letterBottom = letter.y + letter.fontSize / 2;
                
                if (comet.x < letterRight && cometRight > letterLeft &&
                    comet.y < letterBottom && cometBottom > letterTop) {
                    scatterLetter(letter);
                    createTinyExplosion(letter.x, letter.y, letter.color);
                }
            }
        }
    }
}

function createTinyExplosion(x, y, color) {
    const particles = [];
    const num = 25; // Много очень маленьких частиц
    
    for (let i = 0; i < num; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2.5 + 1.5;
        
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: color,
            alpha: 0.8,
            size: Math.random() * 0.6 + 0.4, // Очень маленькие частицы (0.4-1.0px)
            life: Math.random() * 25 + 15,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.06,
            decay: Math.random() * 0.02 + 0.01 // Плавное затухание
        });
    }
    explosions.push(particles);
}

function createStars() {
    stars = [];
    for (let i = 0; i < 500; i++) {
        stars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 1.2 + 0.6,
            alpha: Math.random() * 0.5 + 0.3,
            color: {r: 255, g: 255, b: 255},
            twinkleSpeed: Math.random() * 0.08 + 0.03,
            twinkleOffset: Math.random() * Math.PI * 2
        });
    }
}

function drawStar(star) {
    // Плавное мерцание звезд
    const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.3;
    const currentAlpha = Math.max(0.1, Math.min(1, star.alpha + twinkle));
    
    ctx.shadowBlur = 5;
    ctx.shadowColor = `rgba(255, 255, 255, ${currentAlpha * 0.2})`;
    
    ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
}

function createShootingStar() {
    const x = Math.random() * width;
    const y = Math.random() * height * 0.3;
    
    shootingStars.push({
        x,
        y,
        speed: Math.random() * 14 + 18,
        angle: Math.PI / 4 + (Math.random() - 0.5) * 0.25,
        thickness: Math.random() * 2.5 + 1.8,
        alpha: 1,
        tailColor: {r: 180, g: 210, b: 255},
        coreColor: {r: 255, g: 255, b: 255},
        fadeSpeed: Math.random() * 0.002 + 0.002 // Плавное исчезновение
    });
}

function drawRealisticComet(star) {
    const { x, y, angle, thickness, alpha, tailColor, coreColor } = star;
    
    const tailLength = 140;
    const tailDx = Math.cos(angle + Math.PI) * tailLength;
    const tailDy = Math.sin(angle + Math.PI) * tailLength;

    // Плавный градиент хвоста
    const gradient = ctx.createLinearGradient(x, y, x + tailDx, y + tailDy);
    gradient.addColorStop(0, `rgba(${tailColor.r}, ${tailColor.g}, ${tailColor.b}, ${alpha * 0.9})`);
    gradient.addColorStop(0.3, `rgba(${tailColor.r}, ${tailColor.g}, ${tailColor.b}, ${alpha * 0.6})`);
    gradient.addColorStop(0.7, `rgba(${tailColor.r}, ${tailColor.g}, ${tailColor.b}, ${alpha * 0.3})`);
    gradient.addColorStop(1, `rgba(${tailColor.r}, ${tailColor.g}, ${tailColor.b}, 0)`);

    ctx.strokeStyle = gradient;
    ctx.lineWidth = thickness;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + tailDx, y + tailDy);
    ctx.stroke();

    // Плавное ядро кометы
    ctx.shadowBlur = 12;
    ctx.shadowColor = `rgba(${coreColor.r}, ${coreColor.g}, ${coreColor.b}, ${alpha * 0.4})`;
    
    const coreGradient = ctx.createRadialGradient(x, y, 0, x, y, thickness * 1.2);
    coreGradient.addColorStop(0, `rgba(${coreColor.r}, ${coreColor.g}, ${coreColor.b}, ${alpha})`);
    coreGradient.addColorStop(1, `rgba(${coreColor.r}, ${coreColor.g}, ${coreColor.b}, 0)`);
    
    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(x, y, thickness * 1.2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
}

function drawExplosion() {
    for (let i = explosions.length - 1; i >= 0; i--) {
        const particles = explosions[i];
        for (let j = particles.length - 1; j >= 0; j--) {
            const p = particles[j];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= p.decay; // Плавное затухание
            p.size *= 0.98;
            p.rotation += p.rotationSpeed;
            p.vx *= 0.97; // Плавное замедление
            p.vy *= 0.97;

            if (p.alpha > 0.1) {
                ctx.save();
                
                // Плавное свечение маленьких частиц
                ctx.shadowBlur = 3;
                ctx.shadowColor = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.alpha * 0.2})`;
                
                ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.alpha})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
            }

            if (p.alpha <= 0 || p.size < 0.2) {
                particles.splice(j, 1);
            }
        }
        if (particles.length === 0) {
            explosions.splice(i, 1);
        }
    }
}

function animate() {
    ctx.clearRect(0, 0, width, height);
    time += 0.016;

    // Плавное обновление звезд
    for (let star of stars) {
        drawStar(star);
    }

    // Текст с плавной анимацией
    updateTextLetters();
    drawTextLetters();

    // Плавная проверка столкновений
    checkCometTextCollision();

    // Кометы
    if (Math.random() < 0.03) {
        createShootingStar();
    }

    for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i];
        s.x += Math.cos(s.angle) * s.speed;
        s.y += Math.sin(s.angle) * s.speed;
        s.alpha -= s.fadeSpeed; // Плавное исчезновение

        if (s.alpha > 0.1) {
            drawRealisticComet(s);
        }

        if (s.alpha <= 0 || s.x > width + 150 || s.y > height + 150) {
            shootingStars.splice(i, 1);
        }
    }

    // Плавные взрывы
    drawExplosion();
    
    requestAnimationFrame(animate);
}

// Обработчики событий
canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    let closestLetter = null;
    let minDistance = Infinity;
    
    for (let letter of textLetters) {
        if (!letter.isScattered) {
            const dx = letter.x - x;
            const dy = letter.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < minDistance && distance < 90) {
                minDistance = distance;
                closestLetter = letter;
            }
        }
    }
    
    if (closestLetter) {
        scatterLetter(closestLetter);
        createTinyExplosion(closestLetter.x, closestLetter.y, closestLetter.color);
    }
});

window.addEventListener("resize", resize);

// Запуск
resize();
animate();

// Плавная автогенерация комет
setTimeout(() => {
    for (let i = 0; i < 3; i++) {
        setTimeout(createShootingStar, i * 600);
    }
}, 1200);