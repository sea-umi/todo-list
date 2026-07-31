"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "focus-todo-tasks";

function createTask(title) {
  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    completed: false,
    createdAt: Date.now(),
  };
}

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [filter, setFilter] = useState("all");
  const [isReady, setIsReady] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    try {
      const savedTasks = localStorage.getItem(STORAGE_KEY);
      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks);
        if (Array.isArray(parsedTasks)) setTasks(parsedTasks);
      }
    } catch {
      // 保存データが壊れていても、アプリ自体は使えるようにする。
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (isReady) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }
  }, [tasks, isReady]);

  const visibleTasks = useMemo(
    () => tasks.filter((task) => filter === "all" || (filter === "done" ? task.completed : !task.completed)),
    [tasks, filter],
  );

  const remainingCount = tasks.filter((task) => !task.completed).length;
  const completedCount = tasks.length - remainingCount;

  function addTask(event) {
    event.preventDefault();
    if (!newTask.trim()) {
      inputRef.current?.focus();
      return;
    }

    setTasks((currentTasks) => [createTask(newTask), ...currentTasks]);
    setNewTask("");
    inputRef.current?.focus();
  }

  function toggleTask(id) {
    setTasks((currentTasks) =>
      currentTasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)),
    );
  }

  function deleteTask(id) {
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== id));
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
        </form>

        <div className="summary" aria-live="polite">
          <strong>残り {remainingCount} 件</strong>
          <span>完了 {completedCount} 件 / 全 {tasks.length} 件</span>
        </div>

        <div className="toolbar" aria-label="表示するタスクを選択">
          {[
            ["all", "すべて"],
            ["active", "未完了"],
            ["done", "完了済み"],
          ].map(([value, label]) => (
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
          {visibleTasks.map((task) => (
            <li className={task.completed ? "task-item is-completed" : "task-item"} key={task.id}>
              <label className="task-check">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                  aria-label={`${task.title}を完了にする`}
                />
                <span className="custom-checkbox" aria-hidden="true">✓</span>
                <span>{task.title}</span>
              </label>
              <button
                type="button"
                className="delete-button"
                onClick={() => deleteTask(task.id)}
                aria-label={`${task.title}を削除する`}
              >
                削除
              </button>
            </li>
          ))}
        </ul>

        {visibleTasks.length === 0 && (
          <div className="empty-state">
            <p>{tasks.length === 0 ? "タスクはまだありません。最初のひとつを追加しましょう。" : "この条件のタスクはありません。"}</p>
          </div>
        )}

        <p className="storage-note">入力内容はこのブラウザに自動保存されます。</p>
      </section>
    </main>
  );
}
