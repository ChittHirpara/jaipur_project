import { Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProactiveNotificationProps {
  notification: { title: string; message: string } | null;
}

export function ProactiveNotification({ notification }: ProactiveNotificationProps) {
  return (
    <AnimatePresence>
      {notification && (
        <motion.div 
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="absolute top-6 left-6 right-6 z-50 p-4 rounded-xl border border-cos-accent/50 bg-cos-accent/10 backdrop-blur-md shadow-lg shadow-cos-accent/5"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-cos-accent/20 text-cos-accent shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-cos-accent mb-1">{notification.title}</h4>
              <p className="text-[11px] text-gray-300 leading-relaxed">{notification.message}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
