"use client";

import { useEffect, useState, type RefObject } from "react";
import { api } from "./api-client";
import { useAuth } from "./auth-context";
import type { PublicUser } from "./types";

type Field = HTMLInputElement | HTMLTextAreaElement;

/** "@ali" right before the caret → "ali". */
function queryAtCaret(field: Field): string | null {
  const before = field.value.slice(0, field.selectionStart ?? field.value.length);
  const match = /(?:^|[^\w@])@([a-zA-Z0-9_.]{1,50})$/.exec(before);
  return match ? match[1]! : null;
}

/**
 * @mention autocomplete for a text field: typing "@al" lists matching
 * members; ↑/↓ + Enter/Tab (or a click) inserts "@username ".
 * Pass the field's ref; wire `onChange` and `onKeyDown` onto it, render `menu`.
 */
export function useMentions<T extends Field>(
  ref: RefObject<T | null>,
  value: string,
  setValue: (next: string) => void,
) {
  const { user } = useAuth();
  const [query, setQuery] = useState<string | null>(null);
  const [options, setOptions] = useState<PublicUser[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!query) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      api
        .searchUsers(query)
        .then((users) => {
          if (cancelled) return;
          // Mentioning yourself notifies no one.
          setOptions(users.filter((u) => u.id !== user?.id).slice(0, 6));
          setActive(0);
        })
        .catch(() => {});
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, user?.id]);

  const open = query !== null && options.length > 0;

  function close() {
    setQuery(null);
    setOptions([]);
  }

  function pick(user: PublicUser) {
    const field = ref.current;
    if (!field) return;
    const caret = field.selectionStart ?? value.length;
    const before = value.slice(0, caret).replace(/@[a-zA-Z0-9_.]*$/, `@${user.username} `);
    const next = before + value.slice(caret);
    setValue(next);
    close();
    requestAnimationFrame(() => {
      field.focus();
      field.setSelectionRange(before.length, before.length);
    });
  }

  return {
    onChange(e: React.ChangeEvent<T>) {
      setValue(e.target.value);
      const q = queryAtCaret(e.target);
      if (q) setQuery(q);
      else close();
    },
    onKeyDown(e: React.KeyboardEvent<T>) {
      if (!open) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const step = e.key === "ArrowDown" ? 1 : -1;
        setActive((i) => (i + step + options.length) % options.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        pick(options[active]!);
      } else if (e.key === "Escape") {
        close();
      }
    },
    menu: { open, options, active, pick },
  };
}
