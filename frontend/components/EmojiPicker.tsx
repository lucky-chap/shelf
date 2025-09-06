import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

const emojis = [
  "👋", "👍", "❤️", "😂", "🎉", "🔥", "🚀", "💡", "✨", "⭐", "🙏", "💯",
  "😊", "😍", "😎", "🤩", "🥳", "🤯", "🙌", "👏", "🤔", "😢", "😠", "🤯"
];

export default function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-left font-normal">
          <span className="mr-2 text-lg">{value}</span>
          <span>Pick an emoji</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <div className="grid grid-cols-6 gap-1">
          {emojis.map((emoji) => (
            <Button
              key={emoji}
              variant="ghost"
              size="icon"
              className="text-lg"
              onClick={() => onChange(emoji)}
            >
              {emoji}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
