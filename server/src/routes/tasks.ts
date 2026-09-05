import { Router, Request, Response } from 'express';
import { Task } from '../models/Task.js';

export const tasksRouter = Router();

// GET all tasks
tasksRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tasks', error });
  }
});

// POST create operational task
tasksRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { title, description, assignedTo, priority } = req.body;

    if (!title || !assignedTo) {
      return res.status(400).json({ message: 'Title and assignee are required' });
    }

    const task = new Task({
      title,
      description,
      assignedTo,
      priority: priority || 'Medium',
      status: 'Pending',
    });

    const saved = await task.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create task', error });
  }
});

// PATCH update task fields (title, description, assignedTo, priority, status)
tasksRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, assignedTo, priority, status } = req.body;

    const updateData: Record<string, any> = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo.trim();
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;

    const updatedTask = await Task.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update task', error });
  }
});

// DELETE soft delete task
tasksRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const task = await Task.findByIdAndUpdate(
      id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete task', error });
  }
});

// PATCH restore soft-deleted task
tasksRouter.patch('/:id/restore', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const task = await Task.findByIdAndUpdate(
      id,
      { isDeleted: false, deletedAt: null },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Failed to restore task', error });
  }
});

// PATCH mark task complete/status
tasksRouter.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const task = await Task.findByIdAndUpdate(id, { status }, { new: true });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update task status', error });
  }
});
