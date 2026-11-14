"use client";

import React, { useState } from "react";
import { Plus, Check } from "lucide-react";

export function TasksWidget() {
  const [tasks, setTasks] = useState([
    { id: 1, text: "Finish SDF Assignment", done: true },
    { id: 2, text: "Study DAA Algorithms", done: false },
    { id: 3, text: "Prepare for Mid-Term Exam", done: false },
    { id: 4, text: "Exchange Drafter at Library", done: true },
  ]);

  const toggleTask = (id: number) => {
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  return (
    <div className="bg-white border-2 border-black rounded-3xl p-5 shadow-brutal flex flex-col justify-between h-full min-h-[160px] group hover:-translate-y-1 transition-transform">
      <div className="flex items-center justify-between border-b border-black/10 pb-2">
        <h4 className="font-sans font-black text-sm text-black">My Campus Tasks</h4>
        <button
          type="button"
          onClick={() => {
            const newTaskText = prompt("Enter new campus task:");
            if (newTaskText?.trim()) {
              setTasks([...tasks, { id: Date.now(), text: newTaskText.trim(), done: false }]);
            }
          }}
          className="w-6 h-6 rounded-lg bg-brutal-yellow hover:bg-brutal-yellow-dark text-black border-2 border-black shadow-[1.5px_1.5px_0px_#000] flex items-center justify-center active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
          title="Add task"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-2 my-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => toggleTask(task.id)}
            className="flex items-center space-x-2.5 cursor-pointer group/item select-none"
          >
            <div
              className={`w-4 h-4 rounded border-2 border-black flex items-center justify-center transition-all ${
                task.done
                  ? "bg-brutal-purple text-white shadow-[1px_1px_0px_#000]"
                  : "bg-paper-100 group-hover/item:border-brutal-purple"
              }`}
            >
              {task.done && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
            <span
              className={`text-xs font-semibold tracking-tight ${
                task.done ? "line-through text-ink-400 font-normal" : "text-ink-900"
              }`}
            >
              {task.text}
            </span>
          </div>
        ))}
      </div>

      <div className="text-[10px] font-mono font-bold text-ink-600 pt-1 border-t border-black/10 flex justify-between items-center">
        <span>{tasks.filter((t) => t.done).length} of {tasks.length} completed</span>
        <span className="text-brutal-green-dark font-black">All Tracked</span>
      </div>
    </div>
  );
}

