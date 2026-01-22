/**
 * @file ticket-comments.tsx
 * @description Ticket comments section component
 * @layer UI/Component
 * @status IMPLEMENTED
 *
 * Features:
 * - List of comments with author and time
 * - Internal badge for internal comments
 * - Add comment form
 * - Edit/Delete own comments (placeholder)
 */

'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { Send, Lock, Loader2 } from 'lucide-react';
import { cn, formatRelativeTime, getInitials } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface Comment {
  id: string;
  content: string;
  isInternal: boolean;
  createdAt: Date | string;
  author: {
    id: string;
    name: string;
    image?: string | null;
  };
}

interface TicketCommentsProps {
  comments: Comment[];
  ticketId: string;
  currentUserId: string;
  onAddComment?: (content: string, isInternal: boolean) => Promise<void>;
}

interface CommentFormData {
  content: string;
  isInternal: boolean;
}

export function TicketComments({
  comments,
  ticketId,
  currentUserId,
  onAddComment,
}: TicketCommentsProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { register, handleSubmit, reset, watch, setValue } = useForm<CommentFormData>({
    defaultValues: {
      content: '',
      isInternal: false,
    },
  });

  const isInternal = watch('isInternal');

  const onSubmit = async (data: CommentFormData) => {
    if (!data.content.trim() || !onAddComment) return;
    setIsSubmitting(true);
    try {
      await onAddComment(data.content, data.isInternal);
      reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sort comments by date ascending (oldest first)
  const sortedComments = [...comments].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Comments List */}
      {sortedComments.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">
          No comments yet. Be the first to comment!
        </p>
      ) : (
        <div className="space-y-4">
          {sortedComments.map((comment) => {
            const isOwnComment = comment.author.id === currentUserId;

            return (
              <div
                key={comment.id}
                className={cn(
                  'rounded-lg border p-4',
                  comment.isInternal && 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900'
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      {/* {comment.author.image && (
                        <AvatarImage src={comment.author.image} alt={comment.author.name} />
                      )} */}
                      <AvatarFallback className="text-xs">
                        {getInitials(comment.author.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{comment.author.name}</span>
                        {comment.isInternal && (
                          <Badge variant="yellow" className="gap-1 text-[10px] px-1.5 py-0">
                            <Lock className="h-2.5 w-2.5" />
                            Internal
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(comment.createdAt)}
                      </p>
                    </div>
                  </div>
                  {/* Actions for own comments */}
                  {isOwnComment && (
                    <div className="flex items-center gap-1">
                      {/* Edit/Delete buttons would go here */}
                    </div>
                  )}
                </div>

                {/* Content */}
                <p className="mt-3 text-sm whitespace-pre-wrap">{comment.content}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Comment Form */}
      {onAddComment && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Textarea
              {...register('content')}
              placeholder="Write a comment..."
              className="min-h-[100px] resize-none"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="internal"
                  checked={isInternal}
                  onCheckedChange={(checked) => setValue('isInternal', checked === true)}
                />
                <Label
                  htmlFor="internal"
                  className="text-sm text-muted-foreground cursor-pointer flex items-center gap-1"
                >
                  <Lock className="h-3 w-3" />
                  Internal only (not visible to creators)
                </Label>
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Send
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
