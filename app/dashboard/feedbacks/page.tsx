"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
  
import { 
  MessageCircleQuestion, 
  TrendingUp, 
  Check, 
  X, 
  Edit, 
  Trash2, 
  Eye 
} from "lucide-react"
import { ResponsiveTabs } from "@/components/responsive-tab"

interface Feedback {
  id: string
  created_at: string
  type: 'feedback' | 'feature' | 'bug'
  content: string
  status: 'pending' | 'in_progress' | 'completed' | 'declined'|''
  priority: 'low' | 'medium' | 'high'
  admin_notes?: string
}
const FEEDBACK_STATUS = ['pending', 'in_progress', 'completed', 'declined']
export default function FeedbackManagement() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [status, setStatus] = useState<Feedback['status']>('pending')
  const [loading, setLoading] = useState(true)
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [dialogMode, setDialogMode] = useState<'view' | 'edit'>('view')
  const [editContent, setEditContent] = useState('')
  const [editType, setEditType] = useState<Feedback['type']>('feedback')

  const { user } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchFeedbacks()
    }
  }, [user])

  const fetchFeedbacks = async () => {
    try {
      const { data, error } = await supabase
        .from("feedback")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setFeedbacks(data || [])
      setLoading(false)
    } catch (error) {
      console.error("Error fetching feedbacks:", error)
      toast({
        title: "Error",
        description: "Failed to load feedbacks",
        variant: "destructive"
      })
      setLoading(false)
    }
  }

  const handleEditFeedback = async () => {
    if (!selectedFeedback) return
  
    try {
      const { error } = await supabase
        .from("feedback")
        .update({ 
          content: editContent, 
          type: editType,
          status: status  // This ensures the status is updated
        })
        .eq("id", selectedFeedback.id)
  
      if (error) throw error
  
      // Update local state to reflect all changes including status
      setFeedbacks(prev => 
        prev.map(f => 
          f.id === selectedFeedback.id 
            ? { 
                ...f, 
                content: editContent, 
                type: editType,
                status: status  // Update status in local state as well
              } 
            : f
        )
      )
  
      toast({
        title: "Updated",
        description: "Feedback successfully updated"
      })
  
      setDialogMode('view')
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update feedback",
        variant: "destructive"
      })
    }
  }

  const handleDeleteFeedback = async (id: string) => {
    try {
      const { error } = await supabase
        .from("feedback")
        .delete()
        .eq("id", id)

      if (error) throw error

      setFeedbacks(prev => prev.filter(f => f.id !== id))
      
      toast({
        title: "Deleted",
        description: "Feedback successfully removed"
      })

      setSelectedFeedback(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete feedback",
        variant: "destructive"
      })
    }
  }

  const openFeedbackDialog = (feedback: Feedback) => {
    setSelectedFeedback(feedback)
    setEditContent(feedback.content)
    setEditType(feedback.type)
    setDialogMode('view')
  }

  const renderFeedbackList = (statusFilter?: Feedback['status']) => {
    const filteredFeedbacks = statusFilter 
      ? feedbacks.filter(f => f.status === statusFilter)
      : feedbacks

    return filteredFeedbacks.length === 0 ? (
      <div className="text-center text-muted-foreground p-4">
        No feedbacks found
      </div>
    ) : (
      <div className="space-y-4">
        {filteredFeedbacks.map(feedback => (
          <Card 
            key={feedback.id} 
            className="p-4 hover:bg-muted/50 cursor-pointer flex justify-between items-center"
            onClick={() => openFeedbackDialog(feedback)}
          >
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Badge variant="outline">{feedback.type}</Badge>
                <span className={`text-sm ${getStatusColor(feedback.status)}`}>
                  {feedback.status}
                </span>
              </div>
              <p className="line-clamp-2">{feedback.content}</p>
            </div>
            <small className="text-muted-foreground">
              {new Date(feedback.created_at).toLocaleDateString()}
            </small>
          </Card>
        ))}
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600'
      case 'in_progress': return 'text-blue-600'
      case 'completed': return 'text-green-600'
      case 'declined': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  if (loading) return <div className="animate-pulse p-4">Loading...</div>

  return (
    <div className="container">
     <ResponsiveTabs
     renderContent={(status)=>renderFeedbackList(status)}
     />

      {selectedFeedback && (
        <Dialog open={!!selectedFeedback} onOpenChange={() => setSelectedFeedback(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Feedback Details</DialogTitle>
              <DialogDescription>
                View and manage your submitted feedback
              </DialogDescription>
            </DialogHeader>
            
            {dialogMode === 'view' ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Badge variant="outline">{selectedFeedback.type}</Badge>
                  <span className={getStatusColor(selectedFeedback.status)}>
                    {selectedFeedback.status}
                  </span>
                </div>
                <p>{selectedFeedback.content}</p>
                {selectedFeedback.admin_notes && (
                  <div className="bg-muted p-2 rounded">
                    <strong>Admin Notes:</strong>
                    <p>{selectedFeedback.admin_notes}</p>
                  </div>
                )}
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setDialogMode('edit')}
                  >
                    <Edit className="mr-2 h-4 w-4" /> Edit
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => handleDeleteFeedback(selectedFeedback.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Button 
                    variant={editType === 'feedback' ? 'default' : 'outline'}
                    onClick={() => setEditType('feedback')}
                  >
                    Feedback
                  </Button>
                  <Button 
                    variant={editType === 'feature' ? 'default' : 'outline'}
                    onClick={() => setEditType('feature')}
                  >
                    Feature
                  </Button>
                  <Button 
                    variant={editType === 'bug' ? 'default' : 'outline'}
                    onClick={() => setEditType('bug')}
                  >
                    Bug
                  </Button>
                  <Select 
  defaultValue={selectedFeedback.status}
  onValueChange={(value) => setStatus(value as Feedback['status'])}
>
  <SelectTrigger className="w-38">
    <SelectValue placeholder="Select Status" />
  </SelectTrigger>
  <SelectContent>
    {FEEDBACK_STATUS.map((s) => (
      <SelectItem key={s} value={s}>
        {s}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
                </div>
                <textarea 
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full min-h-[150px] p-2 border rounded"
                />
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setDialogMode('view')}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleEditFeedback}>
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}