"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Smile } from "lucide-react";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

interface EmojiPickerProps {
  onEmojiSelect: (emoji: any) => void;
  disabled?: boolean;
}

export function EmojiPicker({
  onEmojiSelect,
  disabled = false,
}: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleEmojiSelect = (emoji: any) => {
    onEmojiSelect(emoji);
    setIsOpen(false);
  };

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="h-10 w-10 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
        >
          <Smile className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 border-gray-700 bg-gray-800"
        align="end"
      >
        <Picker
          data={data}
          onEmojiSelect={handleEmojiSelect}
          theme="dark"
          set="native"
          previewPosition="none"
          skinTonePosition="none"
          maxFrequentRows={0}
          perLine={8}
          emojiSize={20}
          emojiButtonSize={32}
        />
      </PopoverContent>
    </Popover>
  );
}
