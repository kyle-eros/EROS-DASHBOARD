/**
 * @file ticket-form.tsx
 * @description Create/Edit ticket form component
 * @layer UI/Component
 * @status IMPLEMENTED
 *
 * Features:
 * - Type selector (affects visible fields)
 * - Title and description
 * - Creator selector dropdown
 * - Priority selector
 * - Deadline picker (optional)
 * - Type-specific fields (using ticketData JSON)
 * - Submit/Cancel buttons
 * - Loading state during submission
 * - Validation errors display
 */

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { createTicketSchema, type CreateTicketInput } from '@/schemas/ticket.schema';
import { TICKET_TYPE_CONFIG, PRIORITY_CONFIG } from '@/lib/constants';
import { TicketType, TicketPriority } from '@prisma/client';

interface Creator {
  id: string;
  name: string;
  stageName?: string | null;
}

interface TicketFormProps {
  creators: Creator[];
  onSubmit: (data: CreateTicketInput) => Promise<{ success: boolean; error?: string; ticketId?: string }>;
  defaultValues?: Partial<CreateTicketInput>;
  isEdit?: boolean;
}

export function TicketForm({
  creators,
  onSubmit,
  defaultValues,
  isEdit = false,
}: TicketFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<CreateTicketInput>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      type: 'GENERAL_INQUIRY',
      title: '',
      description: '',
      priority: 'MEDIUM',
      creatorId: '',
      ticketData: {},
      ...defaultValues,
    },
  });

  const selectedType = form.watch('type');

  const handleSubmit = async (data: CreateTicketInput) => {
    setIsSubmitting(true);
    try {
      const result = await onSubmit(data);
      if (result.success && result.ticketId) {
        router.push(`/tickets/${result.ticketId}`);
      } else if (result.error) {
        form.setError('root', { message: result.error });
      }
    } catch (error) {
      form.setError('root', { message: 'An unexpected error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>{isEdit ? 'Edit Ticket' : 'Create New Ticket'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Root Error */}
            {form.formState.errors.root && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {form.formState.errors.root.message}
              </div>
            )}

            {/* Type Selection */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ticket Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ticket type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(TICKET_TYPE_CONFIG).map(([type, config]) => (
                        <SelectItem key={type} value={type}>
                          <div className="flex flex-col">
                            <span>{config.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {config.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Creator Selection */}
            <FormField
              control={form.control}
              name="creatorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Creator</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select creator" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {creators.map((creator) => (
                        <SelectItem key={creator.id} value={creator.id}>
                          {creator.stageName || creator.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The content creator this ticket is for
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief summary of the request" {...field} />
                  </FormControl>
                  <FormDescription>
                    A clear, concise title for the ticket
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detailed description of the request..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide as much detail as possible
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Priority */}
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(PRIORITY_CONFIG).map(([priority, config]) => (
                        <SelectItem key={priority} value={priority}>
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2 w-2 rounded-full ${
                                priority === 'URGENT'
                                  ? 'bg-red-500'
                                  : priority === 'HIGH'
                                  ? 'bg-orange-500'
                                  : priority === 'MEDIUM'
                                  ? 'bg-blue-500'
                                  : 'bg-gray-500'
                              }`}
                            />
                            <span>{config.label}</span>
                            {config.slaHours && (
                              <span className="text-xs text-muted-foreground">
                                ({config.slaHours}h SLA)
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Deadline */}
            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deadline (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''}
                      onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                    />
                  </FormControl>
                  <FormDescription>
                    When this ticket needs to be completed by
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Type-Specific Fields */}
            {selectedType === 'CUSTOM_VIDEO' && (
              <>
                <Separator />
                <h4 className="font-medium">Custom Video Details</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="ticketData.videoType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Video Type</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., solo, roleplay" {...field} value={field.value as string || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ticketData.duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (minutes)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="5"
                            {...field}
                            value={field.value as number || ''}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ticketData.budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="100.00"
                            {...field}
                            value={field.value as number || ''}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="ticketData.specialInstructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Special Instructions</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any special requirements..."
                          {...field}
                          value={field.value as string || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {selectedType === 'VIDEO_CALL' && (
              <>
                <Separator />
                <h4 className="font-medium">Video Call Details</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="ticketData.preferredDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value as string || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ticketData.preferredTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} value={field.value as string || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ticketData.duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (minutes)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="30"
                            {...field}
                            value={field.value as number || ''}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ticketData.platform"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Platform</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Zoom, Skype" {...field} value={field.value as string || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Update Ticket' : 'Create Ticket'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
