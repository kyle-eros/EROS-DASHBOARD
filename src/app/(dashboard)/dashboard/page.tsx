/**
 * @file page.tsx
 * @description Main dashboard page with overview statistics
 * @layer UI
 * @status IMPLEMENTED
 *
 * Shows:
 * - Key metrics (open tickets, in progress, completed today)
 * - Recent activity
 * - Quick actions based on role
 *
 * Server Component that fetches data using services.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { ticketService } from '@/services';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge, PriorityBadge } from '@/components/tickets';
import { Ticket, Clock, CheckCircle2, AlertCircle, Plus, Eye, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { hasPermission, TICKET_STATUS_CONFIG } from '@/lib/constants';
import type { UserRole } from '@prisma/client';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Overview of your ticketing system',
};

export default async function DashboardPage() {
  const session = await auth();
  const userRole = (session?.user?.role || 'CHATTER') as UserRole;
  const userId = session?.user?.id;

  // Fetch dashboard data
  const [statusCounts, recentTickets] = await Promise.all([
    ticketService.getStatusCounts(),
    ticketService.getRecent(5),
  ]);

  // Calculate aggregated counts
  const openCount = (statusCounts.SUBMITTED || 0) + (statusCounts.PENDING_REVIEW || 0);
  const inProgressCount = (statusCounts.IN_PROGRESS || 0) + (statusCounts.ACCEPTED || 0);
  const completedCount = statusCounts.COMPLETED || 0;
  const draftCount = statusCounts.DRAFT || 0;

  const canCreateTickets = hasPermission(userRole, 'tickets:create');
  const canViewAllCreators = hasPermission(userRole, 'creators:read_all');
  const canViewUsers = hasPermission(userRole, 'users:read_all');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {session?.user?.name || 'User'}
          </p>
        </div>
        {canCreateTickets && (
          <Button asChild>
            <Link href="/tickets/new">
              <Plus className="mr-2 h-4 w-4" />
              New Ticket
            </Link>
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Open Tickets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openCount}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting review or action
            </p>
          </CardContent>
        </Card>

        {/* In Progress */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressCount}</div>
            <p className="text-xs text-muted-foreground">
              Being actively worked on
            </p>
          </CardContent>
        </Card>

        {/* Completed */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="text-xs text-muted-foreground">
              Successfully resolved
            </p>
          </CardContent>
        </Card>

        {/* Drafts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{draftCount}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting submission
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Tickets */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Tickets</CardTitle>
              <CardDescription>Latest ticket activity</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/tickets">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentTickets.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Ticket className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>No tickets yet</p>
                {canCreateTickets && (
                  <Button variant="link" asChild className="mt-2">
                    <Link href="/tickets/new">Create your first ticket</Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {recentTickets.map((ticket) => (
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
                        {ticket.creator.stageName} &bull;{' '}
                        {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <Eye className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {canCreateTickets && (
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/tickets/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Ticket
                </Link>
              </Button>
            )}
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/tickets?status=SUBMITTED">
                <Ticket className="mr-2 h-4 w-4" />
                View Open Tickets
              </Link>
            </Button>
            {inProgressCount > 0 && (
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/tickets?status=IN_PROGRESS">
                  <Clock className="mr-2 h-4 w-4" />
                  View In Progress ({inProgressCount})
                </Link>
              </Button>
            )}
            {canViewAllCreators && (
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/creators">
                  <Users className="mr-2 h-4 w-4" />
                  Manage Creators
                </Link>
              </Button>
            )}
            {canViewUsers && (
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/users">
                  <Users className="mr-2 h-4 w-4" />
                  Manage Users
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Ticket Status Overview</CardTitle>
          <CardDescription>Distribution of tickets by status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
            {Object.entries(statusCounts).map(([status, count]) => {
              const config = TICKET_STATUS_CONFIG[status as keyof typeof TICKET_STATUS_CONFIG];
              return (
                <Link
                  key={status}
                  href={`/tickets?status=${status}`}
                  className="flex flex-col items-center rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <span className="text-2xl font-bold">{count}</span>
                  <Badge
                    variant="secondary"
                    className={`mt-1 ${config?.bgColor} ${config?.textColor} border-0`}
                  >
                    {config?.label || status}
                  </Badge>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
