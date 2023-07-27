import { atom } from 'jotai';

export const interstitialAtom = atom({ isOpen: false, message: '' });
