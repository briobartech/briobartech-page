export function showMessage(text, anchorTarget) {
    const message = document.getElementById('silenceMessage');
    if (!message) {
        console.error('Message element not found');
        return;
    }

    if (message.parentElement !== document.body) {
        document.body.appendChild(message);
    }

    message.textContent = text;
    message.style.position = 'fixed';
    message.style.display = 'block';
    message.style.opacity = '1';

    const anchorElement = anchorTarget instanceof Element
        ? anchorTarget
        : document.querySelector('.brio');

    if (anchorElement) {
        const rect = anchorElement.getBoundingClientRect();
        const margin = 8;
        const messageWidth = message.offsetWidth || 320;
        
        // Position message to the right side of the element, within its bounds
        const desiredLeft = rect.right - messageWidth - 12;
        const desiredTop = rect.top + 12;
        
        const left = Math.min(Math.max(margin, desiredLeft), window.innerWidth - messageWidth - margin);
        const top = Math.min(Math.max(margin, desiredTop), window.innerHeight - message.offsetHeight - margin);
        message.style.left = `${left}px`;
        message.style.top = `${top}px`;
        message.style.bottom = 'auto';
    } else {
        message.style.left = '50%';
        message.style.top = 'auto';
        message.style.bottom = '50%';
    }

    const words = text.split(' ').length;
    const delay = Math.min(words * 300, 10000);

    return new Promise((resolve) => {
        setTimeout(() => {
            message.style.opacity = '0';
            setTimeout(() => {
                message.style.display = 'none';
                resolve();
            }, 500);
        }, delay);
    });
}

function ensureModalMessageElement() {
    let message = document.getElementById('modalCommentMessage');
    if (message) return message;

    message = document.createElement('div');
    message.id = 'modalCommentMessage';
    message.className = 'modal-comment-message';
    document.body.appendChild(message);
    return message;
}

// Message variant for modal-related comments: always bottom-center and above all modals.
export function showModalMessage(text, durationMs) {
    const message = ensureModalMessageElement();
    message.textContent = text;
    message.style.display = 'block';
    message.style.opacity = '1';

    const words = String(text || '').trim().split(/\s+/).filter(Boolean).length;
    const delay = typeof durationMs === 'number'
        ? durationMs
        : Math.min(Math.max(words * 280, 1800), 9000);

    return new Promise((resolve) => {
        setTimeout(() => {
            message.style.opacity = '0';
            setTimeout(() => {
                message.style.display = 'none';
                resolve();
            }, 300);
        }, delay);
    });
}
