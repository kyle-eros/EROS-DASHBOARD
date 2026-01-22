/**
 * @file page.tsx
 * @description Creator detail page with tickets and statistics
 * @layer UI
 * @status IMPLEMENTED
 *
 * Server Component that shows detailed creator information including:
 * - Creator profile with stage name, platforms, timezone
 * - Statistics (total tickets, open tickets, avg resolution time)
 * - Assigned users
 * - Recent tickets
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { creatorService, ticketService } from '@/services';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { StatusBadge, PriorityBadge } from '@/components/tickets';
import {
  ArrowLeft,
  Edit,
  Mail,
  MapPin,
  Clock,
  Ticket,
  Users,
  Globe,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { hasPermission } from '@/lib/constants';
import { getInitials } from '@/lib/utils';
import type { UserRole } from '@prisma/client';

interface CreatorPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: CreatorPageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const creator = await creatorService.getById(id);
    if (!creator) {
      return { title: 'Creator Not Found' };
    }

    return {
      title: creator.stageName,
      description: `Creator profile for ${creator.stageName}`,
    };
  } catch {
    return { title: 'Creator Not Found' };
  }
}

export default async function CreatorDetailPage({ params }: CreatorPageProps) {
  const { id } = await params;
  const session = await auth();
  const userRole = (session?.user?.role || 'CHATTER') as UserRole;

  // Check permission
  if (!hasPermission(userRole, 'creators:read')) {
    redirect('/dashboard');
  }

  // Fetch creator with stats
  const creator = await creatorService.getByIdWithStats(id);

  if (!creator) {
    notFound();
  }

  // Fetch additional data
  const [stats, assignedUsers, recentTickets] = await Promise.all([
    creatorService.getStats(id),
    creatorService.getAssignedUsers(id),
    ticketService.list({ creatorId: id, pageSize: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
  ]);

  const canEditCreator = hasPermission(userRole, 'creators:update');

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/creators"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Creators
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            {/* Image field not in schema yet
            {creator.user.image && (
              <AvatarImage src={creator.user.image} alt={creator.stageName} />
            )}
            */}
            <AvatarFallback className="text-lg">
              {getInitials(creator.stageName || creator.user.name || 'C')}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{creator.stageName}</h1>
              <Badge variant={creator.isActive ? 'green' : 'gray'}>
                {creator.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {creator.user.name || 'No name'} &bull; {creator.user.email}
            </p>
          </div>
        </div>
        {canEditCreator && (
          <Button asChild variant="outline">
            <Link href={`/creators/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Link>
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTickets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openTickets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedTickets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.avgCompletionDays ? `${stats.avgCompletionDays}d` : '--'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Tickets */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Tickets</CardTitle>
                <CardDescription>Latest tickets for this creator</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/tickets?creatorId=${id}`}>View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentTickets.tickets.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Ticket className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p>No tickets yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentTickets.tickets.map((ticket) => (
                    <Link
                      key={ticket.id}
                      href={`/tickets/${ticket.id}`}
                      className="flex items-start justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">
                            {ticket.ticketNumber}
                          </span>
                          <StatusBadge status={ticket.status} size="sm" />
                          <PriorityBadge priority={ticket.priority} size="sm" />
                        </div>
                        <p className="font-medium truncate">{ticket.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assigned Users */}
          <Card>
            <CardHeader>
              <CardTitle>Assigned Users</CardTitle>
              <CardDescription>Team members managing this creator</CardDescription>
            </CardHeader>
            <CardContent>
              {assignedUsers.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Users className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p>No users assigned</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assignedUsers.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          {/* Image field not in schema yet
                          {assignment.user.image && (
                            <AvatarImage src={assignment.user.image} alt={assignment.user.name || ''} />
                          )}
                          */}
                          <AvatarFallback>
                            {getInitials(assignment.user.name || assignment.user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {assignment.user.name || assignment.user.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {assignment.user.role}
                          </p>
                        </div>
                      </div>
                      {assignment.isPrimary && (
                        <Badge variant="blue">Primary</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Profile Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profile Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email */}
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{creator.user.email}</p>
                </div>
              </div>

              <Separator />

              {/* Timezone */}
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Timezone</p>
                  <p className="text-sm font-medium">{creator.timezone || 'Not set'}</p>
                </div>
              </div>

              <Separator />

              {/* Platforms */}
              <div className="flex items-start gap-3">
                <Globe className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Platforms</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {creator.platforms.length > 0 ? (
                      creator.platforms.map((platform) => (
                        <Badge key={platform} variant="secondary" className="text-xs">
                          {platform}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">None</span>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Created At */}
              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="text-sm font-medium">
                    {format(new Date(creator.createdAt), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/tickets/new?creatorId=${id}`}>
                  <Ticket className="mr-2 h-4 w-4" />
                  Create Ticket
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/tickets?creatorId=${id}`}>
                  <Ticket className="mr-2 h-4 w-4" />
                  View All Tickets
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
