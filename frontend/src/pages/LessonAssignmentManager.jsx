import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Users,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import apiRequest from '../utils/apiClient.js';
import {
  bulkCreateLessonAssignments,
  getLessonAssignments,
  deleteLessonAssignment,
  updateLessonAssignment
} from '../utils/lessonAssignmentsApi.js';
import { getTeacherGroupsBySubject } from '../utils/teacherAssignmentsApi.js';
import { useAuth } from '../hooks/useAuth.jsx';

const LessonAssignmentManager = ({ onPageChange, pageParams = {} }) => {
  const lessonId = pageParams.lessonId;
  const { user } = useAuth();

  const [lesson, setLesson] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Assignment form
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [groupDeadlines, setGroupDeadlines] = useState({});

  useEffect(() => {
    if (lessonId) {
      fetchLessonData();
    }
  }, [lessonId]);

  const fetchLessonData = async () => {
    setLoading(true);
    try {
      // Fetch lesson
      const lessonRes = await apiRequest(`/lessons/${lessonId}`);
      setLesson(lessonRes.data);

      // Fetch existing assignments
      const assignmentsRes = await getLessonAssignments({ lesson_id: lessonId, size: 100 });
      setAssignments(assignmentsRes.data?.assignments || []);

      // Fetch available groups for this teacher
      if (user?.role === 'teacher') {
        const groupsRes = await getTeacherGroupsBySubject(user.id, lessonRes.data.subject_id);
        setAvailableGroups(groupsRes.data?.groups || []);
      } else {
        // Admin can see all groups
        const groupsRes = await apiRequest('/groups?page=1&size=100');
        setAvailableGroups(groupsRes.data?.groups || []);
      }
    } catch (err) {
      alert('Failed to load lesson data');
      onPageChange('teacher-dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleGroup = (groupId) => {
    if (selectedGroups.includes(groupId)) {
      setSelectedGroups(selectedGroups.filter(id => id !== groupId));
      const newDeadlines = { ...groupDeadlines };
      delete newDeadlines[groupId];
      setGroupDeadlines(newDeadlines);
    } else {
      setSelectedGroups([...selectedGroups, groupId]);
      // Set default deadline to 7 days from now
      const defaultDeadline = new Date();
      defaultDeadline.setDate(defaultDeadline.getDate() + 7);
      setGroupDeadlines({
        ...groupDeadlines,
        [groupId]: defaultDeadline.toISOString().slice(0, 16)
      });
    }
  };

  const handleDeadlineChange = (groupId, deadline) => {
    setGroupDeadlines({
      ...groupDeadlines,
      [groupId]: deadline
    });
  };

  const handleAssignToGroups = async () => {
    if (selectedGroups.length === 0) {
      alert('Please select at least one group');
      return;
    }

    // Validate all groups have deadlines
    const missingDeadlines = selectedGroups.filter(id => !groupDeadlines[id]);
    if (missingDeadlines.length > 0) {
      alert('Please set deadlines for all selected groups');
      return;
    }

    setSaving(true);
    try {
      const assignmentData = selectedGroups.map(groupId => ({
        group_id: groupId,
        deadline_at: new Date(groupDeadlines[groupId]).toISOString()
      }));

      const response = await bulkCreateLessonAssignments({
        lesson_id: parseInt(lessonId),
        assignments: assignmentData
      });

      if (response.data.success_count > 0) {
        alert(`Successfully assigned to ${response.data.success_count} group(s)!`);
        setSelectedGroups([]);
        setGroupDeadlines({});
        await fetchLessonData();
      }

      if (response.data.errors.length > 0) {
        alert(`Some assignments failed:\n${response.data.errors.join('\n')}`);
      }
    } catch (err) {
      alert(err.message || 'Failed to create assignments');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!confirm('Are you sure you want to remove this assignment?')) return;

    try {
      await deleteLessonAssignment(assignmentId);
      await fetchLessonData();
    } catch (err) {
      alert(err.message || 'Failed to delete assignment');
    }
  };

  const handleUpdateDeadline = async (assignmentId, currentDeadline) => {
    const newDeadline = prompt('Enter new deadline (YYYY-MM-DDTHH:MM format):', currentDeadline);
    if (!newDeadline) return;

    try {
      await updateLessonAssignment(assignmentId, newDeadline);
      await fetchLessonData();
    } catch (err) {
      alert(err.message || 'Failed to update deadline');
    }
  };

  const handleFinish = () => {
    if (assignments.length === 0) {
      if (confirm('No groups assigned yet. Are you sure you want to finish?')) {
        onPageChange('teacher-dashboard');
      }
    } else {
      onPageChange('teacher-dashboard');
    }
  };

  // Get groups that are not yet assigned
  const assignedGroupIds = assignments.map(a => a.group_id);
  const unassignedGroups = availableGroups.filter(g => !assignedGroupIds.includes(g.group_id));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <RefreshCw className="animate-spin text-white" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => onPageChange('teacher-dashboard')}
            className="flex items-center gap-2 text-gray-300 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">Assign Lesson to Groups</h1>
          {lesson && (
            <p className="text-xl text-gray-300">{lesson.title}</p>
          )}
        </div>

        {/* Current Assignments */}
        {assignments.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">Current Assignments</h2>
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="bg-white/10 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/20 rounded-lg">
                      <Users size={24} className="text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{assignment.group_name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                        <Calendar size={14} />
                        <span>
                          Deadline: {new Date(assignment.deadline_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateDeadline(assignment.id, assignment.deadline_at)}
                      className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                      title="Edit deadline"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteAssignment(assignment.id)}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                      title="Remove assignment"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Assignments */}
        {unassignedGroups.length > 0 ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              Assign to New Groups ({selectedGroups.length} selected)
            </h2>

            <div className="space-y-3 mb-6">
              {unassignedGroups.map((group) => {
                const groupId = group.group_id;
                const isSelected = selectedGroups.includes(groupId);

                return (
                  <div
                    key={groupId}
                    className={`bg-white/10 rounded-lg p-4 transition-all ${
                      isSelected ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleGroup(groupId)}
                        className="mt-1 w-5 h-5 text-blue-500 bg-white/20 border-white/30 rounded focus:ring-blue-500"
                      />

                      <div className="flex-1">
                        <h3 className="text-white font-medium">{group.group_name}</h3>

                        {isSelected && (
                          <div className="mt-3">
                            <label className="block text-sm text-gray-300 mb-2">
                              Deadline
                            </label>
                            <input
                              type="datetime-local"
                              value={groupDeadlines[groupId] || ''}
                              onChange={(e) => handleDeadlineChange(groupId, e.target.value)}
                              className="px-4 py-2 bg-white/20 text-white rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedGroups.length > 0 && (
              <button
                onClick={handleAssignToGroups}
                disabled={saving}
                className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="animate-spin" size={20} />
                    Assigning...
                  </>
                ) : (
                  <>
                    <Plus size={20} />
                    Assign to {selectedGroups.length} Group(s)
                  </>
                )}
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6 text-center">
            <CheckCircle className="mx-auto mb-4 text-green-400" size={48} />
            <p className="text-white text-lg mb-2">All available groups assigned!</p>
            <p className="text-gray-400 text-sm">
              This lesson has been assigned to all groups you teach for this subject.
            </p>
          </div>
        )}

        {/* Finish Button */}
        <button
          onClick={handleFinish}
          className="w-full px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <CheckCircle size={20} />
          Finish & Return to Dashboard
        </button>
      </div>
    </div>
  );
};

export default LessonAssignmentManager;
