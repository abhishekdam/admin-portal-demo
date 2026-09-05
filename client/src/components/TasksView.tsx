import { useState } from 'react';
import { Plus, CheckCircle2, Circle, Pencil, Trash2, RotateCcw, Archive } from 'lucide-react';
import { ITask, TaskPriority } from '../types/index.js';
import { EditTaskModal } from './EditTaskModal.js';
import { api } from '../api/client.js';

interface Props {
  tasks: ITask[];
  setTasks: React.Dispatch<React.SetStateAction<ITask[]>>;
}

export const TasksView: React.FC<Props> = ({ tasks, setTasks }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [editingTask, setEditingTask] = useState<ITask | null>(null);
  const [viewTab, setViewTab] = useState<'active' | 'deleted'>('active');

  const activeTasks = tasks.filter((t) => !t.isDeleted);
  const deletedTasks = tasks.filter((t) => t.isDeleted);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !assignedTo) return;
    try {
      const created = await api.createTask({
        title,
        description,
        assignedTo,
        priority,
      });
      setTasks((prev) => {
        if (prev.some((t) => t._id === created._id)) return prev;
        return [created, ...prev];
      });
      setTitle('');
      setDescription('');
      setAssignedTo('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTask = async (id: string, updatedData: Partial<ITask>) => {
    const updated = await api.updateTask(id, updatedData);
    setTasks((prev) => prev.map((t) => (t._id === id ? updated : t)));
  };

  const handleDeleteTask = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const deleted = await api.deleteTask(id);
      setTasks((prev) => prev.map((t) => (t._id === id ? deleted : t)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestoreTask = async (id: string) => {
    try {
      const restored = await api.restoreTask(id);
      setTasks((prev) => prev.map((t) => (t._id === id ? restored : t)));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTaskStatus = async (task: ITask) => {
    const nextStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    try {
      const updated = await api.updateTaskStatus(task._id!, nextStatus);
      setTasks((prev) => prev.map((t) => (t._id === task._id ? updated : t)));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Task Column */}
        <div className="lg:col-span-2">
          {/* Sub Header & Tab Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Operational Tasks</h2>
              <p className="text-sm text-slate-500">Warehouse & fulfillment tasks assigned to staff</p>
            </div>

            {/* Sub-view switcher */}
            <div className="inline-flex bg-slate-200/80 p-1 rounded-lg text-xs font-semibold self-start sm:self-auto">
              <button
                onClick={() => setViewTab('active')}
                className={`px-3 py-1.5 rounded-md transition ${
                  viewTab === 'active'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active ({activeTasks.length})
              </button>
              <button
                onClick={() => setViewTab('deleted')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                  viewTab === 'deleted'
                    ? 'bg-white text-rose-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Archive size={13} />
                Deleted ({deletedTasks.length})
              </button>
            </div>
          </div>

          {/* Active Tasks List */}
          {viewTab === 'active' && (
            <div className="space-y-3">
              {activeTasks.length === 0 ? (
                <div className="bg-white p-8 rounded-lg border border-slate-200 text-center text-slate-400 text-sm">
                  No active tasks. Create one using the form on the right!
                </div>
              ) : (
                activeTasks.map((task) => {
                  const isCompleted = task.status === 'Completed';
                  return (
                    <div
                      key={task._id}
                      onClick={() => toggleTaskStatus(task)}
                      className={`p-4 rounded-lg border cursor-pointer transition flex items-center justify-between gap-4 group ${
                        isCompleted
                          ? 'bg-slate-50 border-slate-200 text-slate-400'
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {isCompleted ? (
                          <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={20} />
                        ) : (
                          <Circle className="text-slate-400 flex-shrink-0" size={20} />
                        )}
                        <div className="truncate">
                          <h4
                            className={`text-sm font-semibold truncate ${
                              isCompleted ? 'line-through text-slate-400' : 'text-slate-800'
                            }`}
                          >
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-xs text-slate-400 truncate mt-0.5">{task.description}</p>
                          )}
                          <p className="text-xs text-slate-500 mt-0.5">Assigned to: {task.assignedTo}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-medium border ${
                            task.priority === 'High'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : task.priority === 'Medium'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {task.priority}
                        </span>

                        {/* Edit Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTask(task);
                          }}
                          className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition bg-white"
                          title="Edit task details"
                        >
                          <Pencil size={13} />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={(e) => handleDeleteTask(task._id!, e)}
                          className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition bg-white"
                          title="Soft delete task"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Deleted Tasks List */}
          {viewTab === 'deleted' && (
            <div className="space-y-3">
              <div className="bg-rose-50/70 border border-rose-200 rounded-lg p-3 text-xs text-rose-800 flex items-center justify-between">
                <span className="font-semibold flex items-center gap-1.5">
                  <Archive size={14} /> Deleted Tasks Archive
                </span>
                <span>Tasks can be restored back to active view at any time</span>
              </div>

              {deletedTasks.length === 0 ? (
                <div className="bg-white p-8 rounded-lg border border-slate-200 text-center text-slate-400 text-sm">
                  No deleted tasks in archive.
                </div>
              ) : (
                deletedTasks.map((task) => (
                  <div
                    key={task._id}
                    className="p-4 rounded-lg border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Archive className="text-slate-400 flex-shrink-0" size={18} />
                      <div className="truncate">
                        <h4 className="text-sm font-semibold text-slate-500 line-through truncate">
                          {task.title}
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">Assigned to: {task.assignedTo}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs px-2 py-0.5 rounded font-medium bg-rose-100 text-rose-800 border border-rose-200">
                        Archived
                      </span>
                      <button
                        onClick={() => handleRestoreTask(task._id!)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-300 transition shadow-sm"
                        title="Restore task to active list"
                      >
                        <RotateCcw size={13} /> Restore
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Quick Task Creation Form */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm h-fit">
          <h3 className="text-base font-bold text-slate-800 mb-3">Assign New Task</h3>
          <form onSubmit={handleCreateTask} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Task Title</label>
              <input
                required
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Restock Shelf C"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Description (Optional)</label>
              <textarea
                rows={2}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Operational notes or customer requirements"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Assigned Staff</label>
              <input
                required
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Alex"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Priority</label>
              <select
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-2 rounded text-sm font-medium hover:bg-slate-800 transition"
            >
              <Plus size={16} /> Create Task
            </button>
          </form>
        </div>
      </div>

      {/* Edit Task Modal */}
      <EditTaskModal
        isOpen={!!editingTask}
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onUpdate={handleUpdateTask}
      />
    </div>
  );
};
