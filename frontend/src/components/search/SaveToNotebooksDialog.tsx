'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckboxList } from '@/components/ui/checkbox-list'
import { useNotebooks } from '@/lib/hooks/use-notebooks'
import { useCreateNote } from '@/lib/hooks/use-notes'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { toast } from 'sonner'

interface SaveToNotebooksDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  question: string
  answer: string
}

export function SaveToNotebooksDialog({
  open,
  onOpenChange,
  question,
  answer
}: SaveToNotebooksDialogProps) {
  const [selectedNotebooks, setSelectedNotebooks] = useState<string[]>([])
  const { data: notebooks, isLoading } = useNotebooks(false) // false = not archived
  const createNote = useCreateNote()

  const handleToggle = (notebookId: string) => {
    setSelectedNotebooks(prev =>
      prev.includes(notebookId)
        ? prev.filter(id => id !== notebookId)
        : [...prev, notebookId]
    )
  }

  const handleSave = async () => {
    if (selectedNotebooks.length === 0) {
      toast.error('少なくとも1つノートブックを選択してください')
      return
    }

    try {
      // Create note in each selected notebook
      for (const notebookId of selectedNotebooks) {
        await createNote.mutateAsync({
          title: question,
          content: answer,
          note_type: 'ai',
          notebook_id: notebookId
        })
      }

      toast.success(`回答を${selectedNotebooks.length}件のノートブックへ保存しました`)
      setSelectedNotebooks([])
      onOpenChange(false)
    } catch {
      toast.error('回答の保存に失敗しました')
    }
  }

  const notebookItems = notebooks?.map(nb => ({
    id: nb.id,
    title: nb.name,
    description: nb.description || undefined
  })) || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>ノートブックへ保存</DialogTitle>
          <DialogDescription>
            回答を保存するノートブックを選択してください
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <CheckboxList
              items={notebookItems}
              selectedIds={selectedNotebooks}
              onToggle={handleToggle}
              emptyMessage="ノートブックがありません。先に作成してください。"
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button
            onClick={handleSave}
            disabled={selectedNotebooks.length === 0 || createNote.isPending}
          >
            {createNote.isPending ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                保存中...
              </>
            ) : (
              (selectedNotebooks.length
                ? `${selectedNotebooks.length}件のノートブックに保存`
                : 'ノートブックに保存')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
