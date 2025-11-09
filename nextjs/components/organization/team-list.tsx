"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { authClient } from "@/lib/auth-client";
import { TEAM_LABELS, TEAM_ERRORS, TEAM_SUCCESS } from "@/lib/constants";
import { TeamForm } from "./team-form";
import { TeamActions } from "./team-actions";
import { TeamMemberList } from "./team-member-list";
import { Plus, UsersRound, Search } from "lucide-react";
import { formatDate } from "@/lib/utils/date";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Team {
  id: string;
  name: string;
  createdAt: number;
}

interface TeamListProps {
  organizationId: string;
}

export function TeamList({ organizationId }: TeamListProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeamId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  const loadTeams = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      // @ts-expect-error - better-auth organization client API method
      const listResult = await authClient.organization.listTeams({
        query: {
          organizationId,
        },
      });

      if (listResult?.error) {
        setError(listResult.error.message || TEAM_ERRORS.LOAD_TEAMS_FAILED);
      } else if (listResult?.data) {
        const teamsData = Array.isArray(listResult.data)
          ? listResult.data
          : listResult.data?.teams || [];
        setTeams(teamsData);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : TEAM_ERRORS.LOAD_TEAMS_FAILED;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const handleTeamCreated = () => {
    setShowCreateForm(false);
    setSuccess(TEAM_SUCCESS.TEAM_CREATED);
    setTimeout(() => setSuccess(""), 3000);
    loadTeams();
  };

  const handleTeamUpdated = () => {
    setEditingTeam(null);
    setSuccess(TEAM_SUCCESS.TEAM_UPDATED);
    setTimeout(() => setSuccess(""), 3000);
    loadTeams();
  };

  const handleTeamDeleted = () => {
    setSuccess(TEAM_SUCCESS.TEAM_DELETED);
    setTimeout(() => setSuccess(""), 3000);
    loadTeams();
  };

  const handleActionSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(""), 3000);
    loadTeams();
  };

  const filteredTeams = teams.filter((team) =>
    team.name.toLowerCase().includes(searchValue.toLowerCase()),
  );


  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UsersRound className="w-6 h-6 text-gray-900 dark:text-white" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {TEAM_LABELS.TITLE}
          </h2>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {TEAM_LABELS.CREATE_TEAM}
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-800 dark:text-green-200">
          {success}
        </div>
      )}

      {showCreateForm && (
        <div className="mb-6">
          <TeamForm
            organizationId={organizationId}
            onSuccess={handleTeamCreated}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {editingTeam && (
        <div className="mb-6">
          <TeamForm
            team={editingTeam}
            organizationId={organizationId}
            onSuccess={handleTeamUpdated}
            onCancel={() => setEditingTeam(null)}
          />
        </div>
      )}

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search teams..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              {TEAM_LABELS.LOADING}
            </div>
          ) : filteredTeams.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {TEAM_LABELS.NO_TEAMS}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{TEAM_LABELS.NAME}</TableHead>
                    <TableHead>{TEAM_LABELS.CREATED_AT}</TableHead>
                    <TableHead>{TEAM_LABELS.STATUS}</TableHead>
                    <TableHead>{TEAM_LABELS.ACTIONS}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeams.map((team) => {
                    const isActive = team.id === activeTeamId;
                    const isExpanded = expandedTeamId === team.id;
                    return (
                      <Fragment key={team.id}>
                        <TableRow>
                          <TableCell className="font-medium">
                            {team.name}
                          </TableCell>
                          <TableCell>{formatDate(team.createdAt)}</TableCell>
                          <TableCell>
                            {isActive ? (
                              <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setExpandedTeamId(isExpanded ? null : team.id)
                                }
                              >
                                {isExpanded ? "Hide" : "View"} Members
                              </Button>
                              <TeamActions
                                team={team}
                                organizationId={organizationId}
                                onEdit={() => setEditingTeam(team)}
                                onDelete={handleTeamDeleted}
                                onActionSuccess={handleActionSuccess}
                                isActive={isActive}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={4} className="bg-muted/50">
                              <TeamMemberList teamId={team.id} />
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
