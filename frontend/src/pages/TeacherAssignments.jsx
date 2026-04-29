import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus,
  Trash2,
  RefreshCw,
  X,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import apiRequest from '../utils/apiClient.js';
import {
  createTeacherAssignment,
  getTeacherAssignments,
  deleteTeacherAssignment
} from '../utils/teacherAssignmentsApi.js';

const PAGE_SIZE = 10;

const TeacherAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [teacherFilter, setTeacherFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);
  const [formData, setFormData] = useState({
    teacher_id: '',
    subject_id: '',
    group_id: ''
  });

  // Options for dropdowns
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [groups, setGroups] = useState([]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Fetch options
  useEffect(() => {
    fetchOptions();
  }, []);

  // Fetch assignments when filters or page change
  useEffect(() => {
    fetchAssignments();
  }, [page, teacherFilter, subjectFilter, groupFilter]);

  const fetchOptions = async () => {
    try {
      const [teachersRes, subjectsRes, groupsRes] = await Promise.all([
        apiRequest('/users?role=teacher&size=1000'),
        apiRequest('/subjects?page=1&size=100'),
        apiRequest('/groups?page=1&size=100')
      ]);

      setTeachers(teachersRes.data?.users || []);
      setSubjects(subjectsRes.data?.subjects || []);
      setGroups(groupsRes.data?.groups || []);
    } catch (err) {
      console.error('Failed to fetch options:', err);
    }
  };

  const fetchAssignments = async () => {
    setLoading(true);
    setError('');
    try {
      const filters = {
        page,
        size: PAGE_SIZE,
        ...(teacherFilter && { teacher_id: teacherFilter }),
        ...(subjectFilter && { subject_id: subjectFilter }),
        ...(groupFilter && { group_id: groupFilter })
      };

      const response = await getTeacherAssignments(filters);
      setAssignments(response.data?.assignments || []);
      setTotal(response.data?.total || 0);
    } catch (err) {
      setError(err.message || 'Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setModalSaving(true);
    try {
      await createTeacherAssignment(formData);
      setModalOpen(false);
      setFormData({ teacher_id: '', subject_id: '', group_id: '' });
      await fetchAssignments();
    } catch (err) {
      alert(err.message || 'Failed to create assignment');
    } finally {
      setModalSaving(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;

    try {
      await deleteTeacherAssignment(assignmentId);
      await fetchAssignments();
    } catch (err) {
      alert(err.message || 'Failed to delete assignment');
    }
  };

  const clearFilters = () => {
    setTeacherFilter('');
    setSubjectFilter('');
    setGroupFilter('');
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Teacher Assignments</h1>
          <p className="text-gray-300">Manage teacher-subject-group assignments</p>
        </div>

        {/* Actions Bar */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            {/* Filters */}
            <div className="flex flex-wrap gap-3 flex-1">
              <select
                value={teacherFilter}
                onChange={(e) => setTeacherFilter(e.target.value)}
                className="px-4 py-2 bg-white/20 text-white rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Teachers</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id} className="text-gray-900">
                    {t.full_name}
                  </option>
                ))}
              </select>

              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="px-4 py-2 bg-white/20 text-white rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id} className="text-gray-900">
                    {s.name}
                  </option>
                ))}
              </select>

              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="px-4 py-2 bg-white/20 text-white rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Groups</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id} className="text-gray-900">
                    {g.name}
                  </option>
                ))}
              </select>

              {(teacherFilter || subjectFilter || groupFilter) && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <X size={18} />
                  Clear
                </button>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={fetchAssignments}
                disabled={loading}
                className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>

              <button
                onClick={() => setModalOpen(true)}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <UserPlus size={18} />
                New Assignment
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-white rounded-lg p-4 mb-6">
            {error}
          </div>
        )}

        {/* Assignments Table */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Teacher
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Group
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-300">
                      <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
                      Loading assignments...
                    </td>
                  </tr>
                ) : assignments.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-300">
                      No assignments found
                    </td>
                  </tr>
                ) : (
                  assignments.map((assignment) => (
                    <tr key={assignment.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {assignment.teacher_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {assignment.subject_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {assignment.group_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {new Date(assignment.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={() => handleDeleteAssignment(assignment.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 flex items-center justify-between border-t border-white/10">
              <div className="text-sm text-gray-300">
                Page {page} of {totalPages} ({total} total)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Assignment Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => !modalSaving && setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-white mb-4">New Teacher Assignment</h2>

              <form onSubmit={handleCreateAssignment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Teacher *
                  </label>
                  <select
                    required
                    value={formData.teacher_id}
                    onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select teacher...</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Subject *
                  </label>
                  <select
                    required
                    value={formData.subject_id}
                    onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select subject...</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Group *
                  </label>
                  <select
                    required
                    value={formData.group_id}
                    onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select group...</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    disabled={modalSaving}
                    className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalSaving}
                    className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {modalSaving && <RefreshCw className="animate-spin" size={18} />}
                    Create
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TeacherAssignments;
