/**
 * Toast component — re-exports from ToastContext.
 * The actual Toast rendering is handled by ToastProvider in contexts/ToastContext.jsx.
 * 
 * Usage:
 *   import { useToast } from '../contexts/ToastContext';
 *   const { addToast } = useToast();
 *   addToast('Message here', 'success');  // types: 'success' | 'error' | 'info'
 */
export { useToast, ToastProvider } from '../contexts/ToastContext';
