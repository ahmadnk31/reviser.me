"use client";

import { use, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Flashcard } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import SubscriptionMessage from './subscription-message';
import { AlertDialog } from '@radix-ui/react-alert-dialog';
import { AlertDialogContent, AlertDialogFooter } from './ui/alert-dialog';
import { checkUserAccess } from '@/lib/check-access';

interface AIGeneratorProps {
  onFlashcardsGenerated: (flashcards: Flashcard[]) => void;
}

export function AIGenerator({ onFlashcardsGenerated }: AIGeneratorProps) {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [giveAccess, setGiveAccess] = useState(false);
  const supabase = createClient();
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  useEffect(() => {
    const fetchHasAccess= async () => {
      const { data: {user} } = await supabase.auth.getUser();
      if (user === null) {
        return;
      }
      if(user?.id){
        const access=await checkUserAccess(user.id)
        setHasAccess(access)
      }
    
    };
    fetchHasAccess();
  }, []);
  const handleGenerate = async () => {
    const trimmedTopic = topic.trim();
    
   if(hasAccess===false){
     setGiveAccess(true)
     return;
    }
    
    
    if (!trimmedTopic) {
      toast({
        title: "Topic Required",
        description: "Please enter a topic to generate flashcards.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/flashcards/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: trimmedTopic, count: 5 }),
      });

      const data = await response.json();
      console.log('Flashcards generated:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate flashcards');
      }

      onFlashcardsGenerated(data.flashcards);
      setTopic('');
      
      toast({
        title: "Success!",
        description: `Generated ${data.flashcards.length} flashcards successfully.`,
      });
    } catch (error: any) {
      console.error('Generation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate flashcards. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      
      <div className="space-y-2">
        <Label htmlFor="topic">Topic</Label>
        <Input
          id="topic"
          placeholder="Enter a topic (e.g., 'Basic Spanish phrases')"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !loading && topic.trim()&&hasAccess===true) {
              handleGenerate();
            }
          }}
        />
      </div>
      <Button
        onClick={handleGenerate}
        disabled={loading || !topic.trim()||hasAccess===false}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Flashcards
          </>
        )}
      </Button>
      {
        hasAccess===false&&(
          <span className='mt-2 flex items-center gap-2'>
            <AlertTriangle className="text-orange-500" />
            <p className="text-orange-500 text-sm">You need to subscribe to generate flashcards</p>
          </span>
        )
      }
    </div>
  );
}
