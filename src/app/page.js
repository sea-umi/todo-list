"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "focus-todo-tasks";
const PRIORITIES = {
  high: { label: "高", order: 0 },
  medium: { label: "中", order: 1 },
  low: { label: "低", order: 2 },
};

function createTask(title, dueDate, priority) {
  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    dueDate,
    priority,
    completed: false,
    createdAt: Date.now(),
  };
}

function normalizeTask(task) {
  return {
    ...task,
    dueDate: task.dueDate ?? "",
    priority: PRIORITIES[task.priority] ? task.priority : "medium",
  };
}

function todayString() {
  return new Date().toLocaleDateString("en-CA");
}

function formatDueDate(date) {
  return new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric", weekday: "short" }).format(
    new Date(`${date}T00:00:00`),
  );
}

function dueLabel(task) {
  if (!task.dueDate) return null;
  if (task.completed) return { text: `期限 ${formatDueDate(task.dueDate)}`, className: "" };
  if (task.dueDate < todayString()) return { text: "期限切れ", className: "is-overdue" };
  if (task.dueDate === todayString()) return { text: "今日が期限", className: "is-today" };
  return { text: `期限 ${formatDueDate(task.dueDate)}`, className: "" };
}

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [editingTask, setEditingTask] = useState({ title: "", dueDate: "", priority: "medium" });
  const [isReady, setIsReady] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    try {
      const savedTasks = localStorage.getItem(STORAGE_KEY);
      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks);
        if (Array.isArray(parsedTasks)) setTasks(parsedTasks.map(normalizeTask));
      }
    } catch {
      // 保存データが壊れていても、アプリ自体は使えるようにする。
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (isReady) localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks, isReady]);

  const visibleTasks = useMemo(() => {
    return tasks
      .filter((task) => filter === "all" || (filter === "done" ? task.completed : !task.completed))
      .sort((first, second) => {
        if (first.completed !== second.completed) return Number(first.completed) - Number(second.completed);
        const priorityDifference = PRIORITIES[first.priority].order - PRIORITIES[second.priority].order;
        if (priorityDifference !== 0) return priorityDifference;
        if (!first.dueDate && !second.dueDate) return 0;
        if (!first.dueDate) return 1;
        if (!second.dueDate) return -1;
        return first.dueDate.localeCompare(second.dueDate);
      });
  }, [tasks, filter]);

  const remainingCount = tasks.filter((task) => !task.completed).length;
  const completedCount = tasks.length - remainingCount;

  function addTask(event) {
    event.preventDefault();
    if (!newTask.trim()) {
      inputRef.current?.focus();
      return;
    }

    setTasks((currentTasks) => [createTask(newTask, newDueDate, newPriority), ...currentTasks]);
    setNewTask("");
    setNewDueDate("");
    setNewPriority("medium");
    inputRef.current?.focus();
  }

  function toggleTask(id) {
    setTasks((currentTasks) => currentTasks.map((task) => (
      task.id === id ? { ...task, completed: !task.completed } : task
    )));
  }

  function deleteTask(id) {
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== id));
    if (editingId === id) setEditingId(null);
  }

  function startEditing(task) {
    setEditingId(task.id);
    setEditingTask({ title: task.title, dueDate: task.dueDate, priority: task.priority });
  }

  function saveEditing(event) {
    event.preventDefault();
    if (!editingTask.title.trim()) return;
    setTasks((currentTasks) => currentTasks.map((task) => (
      task.id === editingId ? { ...task, ...editingTask, title: editingTask.title.trim() } : task
    )));
    setEditingId(null);
  }

  return (
    <main className="page-shell">
      <section className="todo-card" aria-labelledby="page-title">
        <header className="hero">
          <p className="eyebrow">DAILY PLANNER</p>
          <h1 id="page-title">Focus Todo</h1>
          <p className="subtitle">今日やることを、ひとつずつ片づけよう。</p>
        </header>

        <form className="task-form" onSubmit={addTask}>
          <label className="sr-only" htmlFor="new-task">新しいタスク</label>
          <input
            ref={inputRef}
            id="new-task"
            type="text"
            value={newTask}
            onChange={(event) => setNewTask(event.target.value)}
            placeholder="例：課題のデザインを考える"
            maxLength={100}
            autoComplete="off"
          />
          <button type="submit">追加</button>
          <div className="task-options">
            <label>
              <span>期限</span>
              <input type="date" value={newDueDate} onChange={(event) => setNewDueDate(event.target.value)} />
            </label>
            <label>
              <span>優先度</span>
              <select value={newPriority} onChange={(event) => setNewPriority(event.target.value)}>
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
            </label>
          </div>
        </form>

        <div className="summary" aria-live="polite">
          <strong>残り {remainingCount} 件</strong>
          <span>完了 {completedCount} 件 / 全 {tasks.length} 件</span>
        </div>

        <div className="toolbar" aria-label="表示するタスクを選択">
          {[["all", "すべて"], ["active", "未完了"], ["done", "完了済み"]].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={filter === value ? "filter-button is-active" : "filter-button"}
              onClick={() => setFilter(value)}
              aria-pressed={filter === value}
            >
              {label}
            </button>
          ))}
        </div>

        <ul className="task-list" aria-label="タスク一覧">
          {visibleTasks.map((task) => {
            const due = dueLabel(task);
            const isEditing = editingId === task.id;
            return (
              <li className={task.completed ? "task-item is-completed" : "task-item"} key={task.id}>
                {isEditing ? (
                  <form className="edit-form" onSubmit={saveEditing}>
                    <input
                      aria-label="タスク名を編集"
                      value={editingTask.title}
                      maxLength={100}
                      onChange={(event) => setEditingTask({ ...editingTask, title: event.target.value })}
                    />
                    <div className="edit-options">
                      <input
                        aria-label="期限日を編集"
                        type="date"
                        value={editingTask.dueDate}
                        onChange={(event) => setEditingTask({ ...editingTask, dueDate: event.target.value })}
                      />
                      <select
                        aria-label="優先度を編集"
                        value={editingTask.priority}
                        onChange={(event) => setEditingTask({ ...editingTask, priority: event.target.value })}
                      >
                        <option value="high">高</option>
                        <option value="medium">中</option>
                        <option value="low">低</option>
                      </select>
                    </div>
                    <div className="task-actions">
                      <button className="save-button" type="submit">保存</button>
                      <button className="cancel-button" type="button" onClick={() => setEditingId(null)}>キャンセル</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <label className="task-check">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task.id)}
                        aria-label={`${task.title}を完了にする`}
                      />
                      <span className="custom-checkbox" aria-hidden="true">✓</span>
                      <span className="task-content">
                        <span className="task-title">{task.title}</span>
                        <span className="task-meta">
                          <span className={`priority priority-${task.priority}`}>優先度：{PRIORITIES[task.priority].label}</span>
                          {due && <span className={`due-date ${due.className}`}>{due.text}</span>}
                        </span>
                      </span>
                    </label>
                    <div className="task-actions">
                      <button type="button" className="edit-button" onClick={() => startEditing(task)}>編集</button>
                      <button type="button" className="delete-button" onClick={() => deleteTask(task.id)}>削除</button>
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>

        {visibleTasks.length === 0 && (
          <div className="empty-state">
            <p>{tasks.length === 0 ? "タスクはまだありません。最初のひとつを追加しましょう。" : "この条件のタスクはありません。"}</p>
          </div>
        )}

        <p className="storage-note">タスク・期限・優先度は、このブラウザに自動保存されます。</p>
      </section>
    </main>
  );
}
