import { AlertTriangle, Info, CheckCircle, X } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

interface NotificationProps {
  type: "warning" | "info" | "success";
  title: string;
  message: string;
  onDismiss?: () => void;
}

export default function CityNotification({
  type,
  title,
  message,
  onDismiss
}: NotificationProps) {
  const [visible, setVisible] = useState(true);

  const handleDismiss = () => {
    setVisible(false);
    if (onDismiss) {
      setTimeout(onDismiss, 300); // Allow animation to complete
    }
  };

  if (!visible) return null;

  // Configure icon and color based on type
  const getIconAndColor = () => {
    switch (type) {
      case "warning":
        return {
          Icon: AlertTriangle,
          bgColor: "bg-warning",
          borderColor: "border-warning"
        };
      case "success":
        return {
          Icon: CheckCircle,
          bgColor: "bg-success",
          borderColor: "border-success"
        };
      case "info":
      default:
        return {
          Icon: Info,
          bgColor: "bg-primary",
          borderColor: "border-primary"
        };
    }
  };

  const { Icon, bgColor, borderColor } = getIconAndColor();

  return (
    <motion.div 
      className={`absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 w-72 border-l-4 ${borderColor}`}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      <div className="flex items-start">
        <div className={`w-8 h-8 ${bgColor} rounded-full flex items-center justify-center text-white mr-3`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <h4 className="font-heading font-bold">{title}</h4>
          <p className="text-sm text-gray-600 mt-1">{message}</p>
          <div className="mt-3 flex justify-end">
            <button 
              className="text-sm text-primary hover:text-primary-dark font-medium"
              onClick={handleDismiss}
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
