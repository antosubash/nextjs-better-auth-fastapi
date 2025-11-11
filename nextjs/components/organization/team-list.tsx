"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { authClient } from "@/lib/auth-client";
import { TEAM_LABELS, TEAM_ERRORS, TEAM_SUCCESS, COMMON_LABELS } from "@/lib/constants";
import { TeamForm } from "./team-form";
import { TeamActions } from "./team-actions";
import { TeamMemberList } from "./team-member-list";
import { Plus, UsersRound } from "lucide-react";
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
import { useSearch } from "@/hooks/organization/use-search";
import { useSuccessMessage } from "@/hooks/organization/use-success-message";
import { useErrorMessage } from "@/hooks/organization/use-error-message";
import { SearchInput } from "./shared/search-input";
import { SuccessMessage } from "./shared/success-message";
import { ErrorMessage } from "./shared/error-message";
import { LoadingState } from "./shared/loading-state";
import { EmptyState } from "./shared/empty-state";
import {
  normalizeTeams,
  extractTeams,
} from "@/lib/utils/organization-data";
import type { NormalizedTeam, TeamListProps } from "@/lib/utils/organization-types";

export function TeamList({ organizationId }: TeamListProps) {
  const [teams, setTeams] = useState<NormalizedTeam[]>([]);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<NormalizedTeam | null>(null);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  const { searchValue, handleSearch } = useSearch();
  const { success, showSuccess, clearSuccess } = useSuccessMessage();
  const { error, showError, clearError } = useErrorMessage();

  const loadTeams = useCallback(async () => {
    setIsLoading(true);
    clearError();
    try {
      const listResult = await authClient.organization.listTeams({
        query: {
          organizationId,
        },
      });

      if (listResult?.error) {
        showError(listResult.error.message || TEAM_ERRORS.LOAD_TEAMS_FAILED);
      } else if (listResult?.data) {
        const normalizedTeams = normalizeTeams(
          extractTeams(listResult.data),
        );
        setTeams(normalizedTeams);
      }

      const sessionResult = await authClient.getSession();
      const sessionActiveTeamId = sessionResult.data?.session?.activeTeamId ?? null;
      setActiveTeamId(sessionActiveTeamId);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : TEAM_ERRORS.LOAD_TEAMS_FAILED;
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, clearError, showError]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const handleTeamCreated = () => {
    setShowCreateForm(false);
    showSuccess(TEAM_SUCCESS.TEAM_CREATED);
    loadTeams();
  };

  const handleTeamUpdated = () => {
    setEditingTeam(null);
    showSuccess(TEAM_SUCCESS.TEAM_UPDATED);
    loadTeams();
  };

  const handleTeamDeleted = () => {
    showSuccess(TEAM_SUCCESS.TEAM_DELETED);
    loadTeams();
  };

  const handleActionSuccess = (message: string) => {
    showSuccess(message);
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

      <ErrorMessage message={error} onDismiss={clearError} className="mb-4" />
      <SuccessMessage message={success} onDismiss={clearSuccess} className="mb-4" />

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
        <SearchInput
          placeholder={TEAM_LABELS.SEARCH_TEAMS}
          value={searchValue}
          onChange={handleSearch}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <LoadingState message={TEAM_LABELS.LOADING} />
          ) : filteredTeams.length === 0 ? (
            <EmptyState message={TEAM_LABELS.NO_TEAMS} />
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
                                {COMMON_LABELS.ACTIVE}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">{COMMON_LABELS.INACTIVE}</Badge>
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
                                {isExpanded ? TEAM_LABELS.HIDE : TEAM_LABELS.VIEW_MEMBERS}
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
                              <TeamMemberList teamId={team.id} organizationId={organizationId} />
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
