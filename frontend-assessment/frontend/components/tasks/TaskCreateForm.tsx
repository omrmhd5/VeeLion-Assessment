"use client";

import { FormEvent, useState } from "react";

type TaskCreateFormProps = {
  busy: boolean;
  onCreate: (title: string) => Promise<void>;
};

export function TaskCreateForm({ busy, onCreate }: TaskCreateFormProps) {
  const [title, setTitle] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = title.trim();
    if (!trimmed || busy) {
      return;
    }

    await onCreate(trimmed);
    setTitle("");
  };

  return (
    <form
      className="card card--padded-sm card--flat task-create-form"
      onSubmit={handleSubmit}
      aria-label="Create task">
      <label className="task-create-form__label" htmlFor="task-title">
        New task
      </label>
      <div className="task-create-form__row">
        <input
          id="task-title"
          className="input"
          placeholder="What needs to be done?"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          disabled={busy}
          maxLength={120}
        />
        <button
          type="submit"
          className="button button--primary"
          disabled={busy || !title.trim()}>
          Add task
        </button>
      </div>
    </form>
  );
}
