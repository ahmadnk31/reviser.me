"use client";

import { use, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Flashcard } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import SubscriptionMessage from './subscription-message';
import { AlertDialog } from '@radix-ui/react-alert-dialog';
import { AlertDialogCancel, AlertDialogContent, AlertDialogFooter } from './ui/alert-dialog';

interface AIGeneratorProps {
  onFlashcardsGenerated: (flashcards: Flashcard[]) => void;
}

export function AIGenerator({ onFlashcardsGenerated }: AIGeneratorProps) {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (user === null) {
        return;
      }
      const { data: subscription_status } = await supabase.from('users').select('subscription_status').eq('id', user.user?.id).single();
      setSubscriptionStatus(subscription_status?.subscription_status);
    };
    fetchSubscriptionStatus();
  }, []);
  const handleGenerate = async () => {
    const trimmedTopic = topic.trim();
    
   
    
    
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
      if(subscriptionStatus!=="active"){
        return(
          toast(
          {
            title: "Subscription Required",
            description: "Please subscribe to generate flashcards.",
            variant: "destructive",
          }
          )
        )
      }
      const response = await fetch('/api/flashcards/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: trimmedTopic, count: 5 }),
      });

      const data = await response.json();

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
            if (e.key === 'Enter' && !loading && topic.trim()) {
              handleGenerate();
            }
          }}
        />
      </div>
      <Button
        onClick={handleGenerate}
        disabled={loading || !topic.trim()}
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
    </div>
  );
}