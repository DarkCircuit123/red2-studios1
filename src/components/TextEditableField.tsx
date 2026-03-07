import React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Edit2, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface TextEditableFieldProps {
  value: string;
  onSave: (newValue: string) => void;
  isEditable?: boolean;
  multiline?: boolean;
  className?: string;
  placeholder?: string;
}

function TextEditableField({
  value,
  onSave,
  isEditable = true,
  multiline = false,
  className = '',
  placeholder = 'Enter text...'
}: TextEditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editValue.trim() !== value.trim()) {
      onSave(editValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isEditable) {
    return <span className={className}>{value}</span>;
  }

  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-start gap-2"
      >
        {multiline ? (
          <textarea
            ref={inputRef as React.Ref<HTMLTextAreaElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/40 focus:outline-none focus:border-white/40 resize-none"
            rows={4}
          />
        ) : (
          <input
            ref={inputRef as React.Ref<HTMLInputElement>}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/40 focus:outline-none focus:border-white/40"
          />
        )}
        <button
          onClick={handleSave}
          className="p-2 hover:bg-white/10 rounded transition-colors"
          title="Save"
        >
          <Check className="w-4 h-4 text-green-400" />
        </button>
        <button
          onClick={handleCancel}
          className="p-2 hover:bg-white/10 rounded transition-colors"
          title="Cancel"
        >
          <X className="w-4 h-4 text-red-400" />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="group flex items-center gap-2 cursor-pointer"
      onClick={() => setIsEditing(true)}
      whileHover={{ scale: 1.02 }}
    >
      <span className={className}>{value}</span>
      {isEditable && (
        <Edit2 className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors opacity-0 group-hover:opacity-100" />
      )}
    </motion.div>
  );
}

export default React.memo(TextEditableField);
