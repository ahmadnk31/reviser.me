"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { GripVertical, Trash2 } from "lucide-react"
import { EditFlashcardDialog } from "@/components/edit-flashcard-dialog"
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { Flashcard } from "@/lib/types"

interface FlashcardItemProps {
  flashcard: Flashcard
  onDelete: (id: string) => void
  onUpdate: () => void
  onFlip: () => void
  isFlipped: boolean
}

function FlashcardItem({
  flashcard,
  onDelete,
  onUpdate,
  onFlip,
  isFlipped,
}: FlashcardItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: flashcard.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="cursor-pointer transition-all duration-500 transform-gpu"
      onClick={onFlip}
    >
      <CardContent className="p-6 min-h-[200px] flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="font-medium">
              {isFlipped ? flashcard.back : flashcard.front}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="cursor-grab"
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex justify-end space-x-2 mt-4">
          <EditFlashcardDialog 
            flashcard={flashcard}
            onFlashcardUpdated={onUpdate}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(flashcard.id)
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface FlashcardListProps {
  flashcards: Flashcard[]
  onUpdate: () => void
  canEdit?: boolean
}

export function FlashcardList({ flashcards, onUpdate }: FlashcardListProps) {
  const [items, setItems] = useState(flashcards)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [flipped, setFlipped] = useState<Record<string, boolean>>({})
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()


  // Update the sensors configuration in FlashcardList component
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8,
      delay: 100,
      tolerance: 5,
    },
  })
)

// Update the handleDragEnd function
const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event

  if (over && active.id !== over.id) {
    const oldIndex = items.findIndex((item) => item.id === active.id)
    const newIndex = items.findIndex((item) => item.id === over.id)

    const newItems = arrayMove(items, oldIndex, newIndex)
    
    // Update both local state and trigger parent update
    setItems(newItems)
    
    try {
      // More robust update method
      const updatePromises = newItems.map((item, index) => 
        supabase
          .from("flashcards")
          .update({ position: index })
          .eq('id', item.id)
      )

      const results = await Promise.all(updatePromises)

      const hasErrors = results.some(result => result.error)
      
      if (hasErrors) {
        throw new Error('One or more updates failed')
      }

      toast({
        title: "Success",
        description: "Flashcard order updated",
      })
      
      // Trigger parent component update to ensure consistency
      onUpdate()
    } catch (error) {
      console.error("Error updating flashcard order:", error)
      toast({
        title: "Error",
        description: "Failed to update flashcard order",
        variant: "destructive",
      })
      // Revert the order in the UI
      setItems(items)
    }
  }
}
  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)

    try {
      const { error } = await supabase
        .from("flashcards")
        .delete()
        .eq("id", deleteId)

      if (error) throw error

      onUpdate()
      toast({
        title: "Success",
        description: "Flashcard deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete flashcard",
        variant: "destructive",
      })
    } finally {
      setDeleteId(null)
      setIsDeleting(false)
    }
  }

  const toggleFlip = (id: string) => {
    setFlipped(prev => ({ ...prev, [id]: !prev[id] }))
  }

  if (flashcards.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No flashcards yet. Create your first flashcard to get started!
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map(item => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="grid gap-4">
          {items.map((flashcard) => (
            <FlashcardItem
              key={flashcard.id}
              flashcard={flashcard}
              onDelete={(id) => setDeleteId(id)}
              onUpdate={onUpdate}
              onFlip={() => toggleFlip(flashcard.id)}
              isFlipped={flipped[flashcard.id]}
            />
          ))}
        </div>
      </SortableContext>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the flashcard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DndContext>
  )
}