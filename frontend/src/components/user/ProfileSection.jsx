import { cn } from "../../lib/utils";

const ProfileSection = ({ icon: Icon, label, onClick, className }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-4 text-gray-700 hover:bg-gray-50 transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
        "rounded-lg",
        className
      )}
    >
      <Icon className="w-5 h-5 text-gray-500" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
};

export default ProfileSection; 