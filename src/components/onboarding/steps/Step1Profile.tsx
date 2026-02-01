import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users } from 'lucide-react';

interface Step1ProfileProps {
  onNext: (data: { childName: string; childAge: number }) => void;
}

export function Step1Profile({ onNext }: Step1ProfileProps) {
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!childName.trim()) {
      setError('אנא הזינו את שם הילד/ה');
      return;
    }
    const age = parseInt(childAge);
    if (!childAge || isNaN(age) || age < 5 || age > 25) {
      setError('אנא הזינו גיל תקין (5-25)');
      return;
    }
    setError('');
    onNext({ childName: childName.trim(), childAge: age });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 px-5 py-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            בואו נכיר את הגיבורים שלכם
          </h1>
          <p className="text-muted-foreground">
            מי מצטרף לנבחרת BUFF?
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="childName" className="text-right block">שם הילד/ה</Label>
            <Input
              id="childName"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder="לדוגמה: נועם"
              className="text-right h-12 text-base"
              dir="rtl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="childAge" className="text-right block">גיל</Label>
            <Input
              id="childAge"
              type="number"
              value={childAge}
              onChange={(e) => setChildAge(e.target.value)}
              placeholder="לדוגמה: 12"
              className="text-right h-12 text-base"
              dir="ltr"
              min={5}
              max={25}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive text-right">{error}</p>
          )}

          {/* Helper text */}
          <div className="p-4 rounded-xl bg-muted/50 border border-border">
            <p className="text-sm text-muted-foreground text-right leading-relaxed">
              💡 הגיל עוזר לנו להתאים את המשימות והשפה בדיוק לשלב שבו הילדים נמצאים.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <div className="px-5 pb-8 pt-4">
        <Button 
          onClick={handleSubmit}
          className="w-full h-14 text-lg font-bold rounded-2xl bg-gradient-to-l from-primary to-success"
          size="lg"
        >
          בואו נתחיל! 🚀
        </Button>
      </div>
    </div>
  );
}
