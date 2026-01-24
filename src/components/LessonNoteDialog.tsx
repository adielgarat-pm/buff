import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { MessageCircle, Heart } from 'lucide-react';

interface LessonNoteDialogProps {
  open: boolean;
  onClose: () => void;
  lessonLabel: string;
  currentNote?: string;
  onSaveNote: (note: string) => void;
}

const QUICK_NOTES = [
  { label: 'Too much noise', emoji: '🔊' },
  { label: 'Meds wore off', emoji: '💊' },
  { label: 'Felt tired', emoji: '😴' },
  { label: 'Hard to focus', emoji: '🎯' },
  { label: 'Needed a break', emoji: '🚶' },
  { label: 'Test anxiety', emoji: '📝' },
];

export function LessonNoteDialog({ open, onClose, lessonLabel, currentNote, onSaveNote }: LessonNoteDialogProps) {
  const [note, setNote] = useState(currentNote || '');

  const handleSave = () => {
    onSaveNote(note);
    onClose();
  };

  const handleQuickNote = (quickNote: string) => {
    setNote(prev => prev ? `${prev}\n${quickNote}` : quickNote);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            Note for {lessonLabel}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Encouraging message */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20">
            <Heart className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              It's okay if things were hard. Understanding why helps you grow. 
              No judgment here! 💙
            </p>
          </div>

          {/* Quick note buttons */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Quick notes:</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_NOTES.map((quick) => (
                <button
                  key={quick.label}
                  onClick={() => handleQuickNote(quick.label)}
                  className="px-3 py-1.5 text-sm rounded-full bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
                >
                  {quick.emoji} {quick.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom note textarea */}
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Or write your own thoughts..."
            className="min-h-[100px] resize-none"
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
