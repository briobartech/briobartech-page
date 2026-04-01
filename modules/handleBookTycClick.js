import { closeInteractiveModals } from './modalExclusivity.js';

export function handleBookTycClick() {
    closeInteractiveModals('termsModal');
    document.getElementById('termsModal').style.display = 'block';
}